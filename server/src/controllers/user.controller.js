import passport from "passport";
import config from "../config/index.js";
import { User } from "../models/user.model.js";
import {
  sendOTPEmail,
  sendVerificationEmail,
} from "../services/email/email.service.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { generateAccessAndRefreshTokens } from "../utils/index.js";
import { Referral } from "../models/referral.model.js";

const token_secret = config.email_verify_token_secret;

// Initiate Google OAuth Login
const googleLogin = asyncHandler(async (req, res, next) => {
  const { state, type } = req.query;

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: JSON.stringify({ state, type }),
  })(req, res, next);
});

const googleLoginCallback = asyncHandler(async (req, res, next) => {
  const { state, error } = req.query;

  const parsedState = state ? JSON.parse(JSON.parse(state).state) : {};
  const { redirectPath = "", path = "login", referralCode } = parsedState;

  // If Google OAuth returned an error
  if (error) {
    return res.redirect(
      `${config.cors_origin}/${path}?error=${encodeURIComponent(error)}`
    );
  }

  // Authenticate with Passport
  passport.authenticate("google", { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(`${config.cors_origin}/${path}?error=auth_failed`);
    }

    if (referralCode && !user?.referred) {
      const createdAt = new Date(user.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (createdAt >= today) {
        // Only query referral if the user is new today
        const referralDoc = await Referral.findOne({ referralCode });
        if (referralDoc) {
          user.referred = referralDoc._id;
          await user.save();

          if (!referralDoc.referredUsers.includes(user._id)) {
            referralDoc.referredUsers.push(user._id);
            await referralDoc.save();
          }
        }
      }
    }

    try {
      const accessToken = user.generateAccessToken();

      // Set IP address if missing
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      if (!user.ipAddress) {
        user.ipAddress = ip;
        await user.save({ validateBeforeSave: false });
      }

      let redirectUrl = `${config.cors_origin}/verify-google?token=${accessToken}`;
      if (redirectPath) {
        redirectUrl += `&redirectPath=${encodeURIComponent(redirectPath)}`;
      }

      return res.redirect(redirectUrl);
    } catch (e) {
      console.error("Google Callback Error:", e);
      return res.redirect(`${config.cors_origin}/${path}?error=server_error`);
    }
  })(req, res, next);
});

const verifyGoogleToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, "Token is required");
  }

  const decoded = jwt.verify(token, config.access_token_secret);
  const user = await User.findById(decoded.userId).select(
    "-password -refreshToken -verificationToken"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  const userRes = {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar | null,
    isVerified: user.isVerified,
    loginProvider: user.loginProvider,
    role: user.role,
    accessToken: accessToken,
    refreshToken: refreshToken,
  };

  return new ApiResponse(200, true, "Google verification successful", {
    user: userRes,
  }).send(res);
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, referralCode } = req.body;

  const userIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  // List of allowed email domains
  const allowedDomains = [
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
  ];
  const emailDomain = email?.split("@")[1]?.toLowerCase();

  if (!emailDomain || !allowedDomains.includes(emailDomain)) {
    throw new ApiError(400, "Please use a valid email provider.");
  }

  // Check if user already exists
  let user = await User.findOne({ email });

  if (user && user.isVerified) {
    throw new ApiError(409, "Email already exists.");
  }

  //  Find referral if code is provided
  let referralDoc = null;
  if (referralCode) {
    referralDoc = await Referral.findOne({ referralCode });
  }

  if (user) {
    user.name = name || user.name;
    user.password = password;
    if (referralDoc) {
      user.referred = referralDoc._id;
    }
  } else {
    // Create new user
    user = new User({
      name,
      email,
      password,
      loginProvider: ["email"],
      ipAddress: userIp,
      referred: referralDoc ? referralDoc._id : null,
    });
  }

  await user.save();

  //  Link user to referral if provided
  if (referralDoc) {
    if (!referralDoc.referredUsers.includes(user._id)) {
      referralDoc.referredUsers.push(user._id);
      await referralDoc.save();
    }
  }

  const { otp, otpToken } = generateOtpAndOtpToken(user._id);
  console.log({ email: user.email, otp });

  // Send verification email in production
  if (config.NODE_ENV === "production") {
    await sendVerificationEmail(email, name, otp);
  }

  return new ApiResponse(201, true, "OTP sent! Check your email to verify.", {
    otpToken,
  }).send(res);
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  if (user.isVerified) {
    throw new ApiError(400, "Email is already verified");
  }
  const { otp, otpToken } = generateOtpAndOtpToken(user._id);

  await sendVerificationEmail(user.email, user.name, otp);

  return new ApiResponse(200, true, "Verification email sent successfully", {
    otpToken,
  }).send(res);
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { otp, otpToken } = req.body;

  if (!otp || !otpToken) {
    throw new ApiError(400, "OTP and token are required");
  }

  let decoded;
  try {
    decoded = jwt.verify(otpToken, token_secret);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(400, "OTP token has expired.");
    } else if (err.name === "JsonWebTokenError") {
      throw new ApiError(400, "Invalid OTP token.");
    } else {
      console.error("Unexpected error verifying OTP token:", err.message);
      throw new ApiError(400, "Failed to verify OTP token.");
    }
  }

  if (decoded.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  // ✅ Update the user as verified
  const updatedUser = await User.findByIdAndUpdate(
    decoded.userId,
    {
      isVerified: true,
    },
    { new: true, select: "-password -refreshToken" }
  );

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    updatedUser._id
  );

  const user = {
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    avatar: updatedUser.avatar | null,
    isVerified: updatedUser.isVerified,
    loginProvider: updatedUser.loginProvider,
    role: updatedUser.role,
    accessToken: accessToken,
    refreshToken: refreshToken,
  };

  return new ApiResponse(200, true, "Email verified successfully", {
    user,
  }).send(res);
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "User does not exist");
  }

  if (!user.loginProvider.includes("email")) {
    throw new ApiError(
      403,
      "This email is registered with google login provider, try 'Continue with Google'"
    );
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isVerified) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.ipAddress) {
    const userIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    user.ipAddress = userIp;
    await user.save();
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const userRes = {
    _id: loggedInUser._id,
    name: loggedInUser.name,
    email: loggedInUser.email,
    avatar: loggedInUser.avatar | null,
    isVerified: loggedInUser.isVerified,
    loginProvider: loggedInUser.loginProvider,
    role: loggedInUser.role,
    accessToken: accessToken,
    refreshToken: refreshToken,
  };

  return new ApiResponse(200, true, "Login Successful", {
    user: userRes,
  }).send(res);
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: null },
    },
    { new: true }
  );

  return new ApiResponse(200, true, "Logout Successful").send(res);
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      config.refresh_token_secret
    );

    const user = await User.findById(decodedToken?.userId);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // if (incomingRefreshToken !== user?.refreshToken) {
    //   throw new ApiError(401, "Refresh token is expired or used");
    // }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return new ApiResponse(200, true, "Token refreshed successfully", {
      accessToken,
      refreshToken: newRefreshToken,
    }).send(res);
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return new ApiResponse(200, true, "Password changed successfully").send(res);
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({
    email,
    isVerified: true,
    loginProvider: { $in: ["email"] },
  });
  if (!user) throw new ApiError(404, "User not found");

  const { otp, otpToken } = generateOtpAndOtpToken(user._id);

  await sendOTPEmail(email, user.name, otp);

  return new ApiResponse(200, true, "OTP sent successfully", { otpToken }).send(
    res
  );
});

// Verify OTP
const verifyOTP = asyncHandler(async (req, res) => {
  const { otp, otpToken } = req.body;
  if (!otp || !otpToken) throw new ApiError(400, "OTP and token are required");

  let decoded;
  try {
    decoded = jwt.verify(otpToken, token_secret);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(400, "OTP token has expired. ");
    } else if (err.name === "JsonWebTokenError") {
      throw new ApiError(400, "Invalid OTP token.");
    } else {
      console.error("Unexpected error verifying OTP token:", err.message);
      throw new ApiError(400, "Failed to verify OTP token.");
    }
  }

  if (decoded.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  const tempToken = jwt.sign({ userId: decoded.userId }, token_secret, {
    expiresIn: "15m",
  });

  return new ApiResponse(200, true, "OTP verified successfully", {
    tempToken,
  }).send(res);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { tempToken, newPassword, confirmNewPassword } = req.body;
  if (!tempToken || !newPassword || !confirmNewPassword) {
    throw new ApiError(400, "Temporary token and new password are required");
  }

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  // Ideally, store the tempToken securely in a database/session system
  let decoded;
  try {
    decoded = jwt.verify(tempToken, token_secret);
  } catch (err) {
    console.error("Error verifying OTP token:", err.message);

    throw new ApiError(400, "Invalid or expired temporary token");
  }

  const user = await User.findById(decoded.userId);
  if (!user) throw new ApiError(404, "User not found");
  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  user.password = newPassword;
  await user.save();
  return new ApiResponse(200, true, "Password reset successful").send(res);
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return new ApiResponse(200, true, "User fetched successfully", req.user).send(
    res
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  googleLogin,
  verifyEmail,
  requestPasswordReset,
  verifyOTP,
  resetPassword,
  googleLoginCallback,
  resendVerificationEmail,
  verifyGoogleToken,
};

const generateOtpAndOtpToken = (userId) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpToken = jwt.sign({ otp, userId }, token_secret, {
    expiresIn: "10m",
  });
  return { otp, otpToken };
};
