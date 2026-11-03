import passport from "passport";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { User } from "../models/user.model.js";
import { Referral } from "../models/referral.model.js";
import {
  sendOTPEmail,
  sendVerificationEmail,
} from "../services/email/email.service.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessAndRefreshTokens } from "../utils/index.js";

const token_secret = config.email_verify_token_secret;

const generateOtpAndOtpToken = (userId) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpToken = jwt.sign({ otp, userId }, token_secret, {
    expiresIn: "10m",
  });
  return { otp, otpToken };
};

// Initiate Google OAuth Login
export const googleLogin = asyncHandler(async (req, res, next) => {
  const { state, type } = req.query;

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: JSON.stringify({ state, type }),
  })(req, res, next);
});

export const googleLoginCallback = asyncHandler(async (req, res, next) => {
  const { state, error } = req.query;

  let parsedState = {};
  try {
    parsedState = state ? JSON.parse(JSON.parse(state).state || "{}") : {};
  } catch {
    parsedState = {};
  }

  const { redirectPath = "", path = "login", referralCode } = parsedState;

  if (error) {
    return res.redirect(
      `${config.cors_origin}/${path}?error=${encodeURIComponent(error)}`
    );
  }

  passport.authenticate("google", { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(`${config.cors_origin}/${path}?error=auth_failed`);
    }

    if (referralCode && !user?.referred) {
      const createdAt = new Date(user.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (createdAt >= today) {
        const referralDoc = await Referral.findOne({ referralCode: referralCode.toUpperCase() });
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

      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      if (!user.ipAddress) {
        user.ipAddress = Array.isArray(ip) ? ip[0] : ip;
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

export const verifyGoogleToken = asyncHandler(async (req, res) => {
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
    avatar: user.avatar || null,
    isVerified: user.isVerified,
    loginProvider: user.loginProvider,
    role: user.role,
    accessToken,
    refreshToken,
  };

  return new ApiResponse(200, true, "Google verification successful", {
    user: userRes,
  }).send(res);
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, referralCode } = req.body;

  const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userIp = Array.isArray(rawIp) ? rawIp[0] : rawIp;

  const allowedDomains = [
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
  ];
  const emailDomain = email?.split("@")[1]?.toLowerCase();

  if (!emailDomain || !allowedDomains.includes(emailDomain)) {
    throw new ApiError(400, "Please use a valid email provider (Gmail, Outlook, Yahoo, iCloud, etc.).");
  }

  let user = await User.findOne({ email: email.toLowerCase() });

  if (user && user.isVerified) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  let referralDoc = null;
  if (referralCode) {
    referralDoc = await Referral.findOne({ referralCode: referralCode.toUpperCase() });
  }

  if (user) {
    user.name = name || user.name;
    user.password = password;
    if (referralDoc) {
      user.referred = referralDoc._id;
    }
  } else {
    user = new User({
      name,
      email: email.toLowerCase(),
      password,
      loginProvider: ["email"],
      ipAddress: userIp,
      referred: referralDoc ? referralDoc._id : null,
    });
  }

  await user.save();

  if (referralDoc && !referralDoc.referredUsers.includes(user._id)) {
    referralDoc.referredUsers.push(user._id);
    await referralDoc.save();
  }

  const { otp, otpToken } = generateOtpAndOtpToken(user._id);

  if (config.NODE_ENV === "production") {
    await sendVerificationEmail(email, name, otp);
  } else {
    console.log(`[Dev Verification Code] Email: ${user.email}, OTP: ${otp}`);
  }

  return new ApiResponse(201, true, "OTP sent! Check your email to verify.", {
    otpToken,
  }).send(res);
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email: email.toLowerCase() });
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

export const verifyEmail = asyncHandler(async (req, res) => {
  const { otp, otpToken } = req.body;

  if (!otp || !otpToken) {
    throw new ApiError(400, "OTP and token are required");
  }

  let decoded;
  try {
    decoded = jwt.verify(otpToken, token_secret);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(400, "OTP token has expired. Please request a new one.");
    }
    throw new ApiError(400, "Invalid OTP token.");
  }

  if (decoded.otp !== otp) {
    throw new ApiError(400, "Invalid OTP code");
  }

  const updatedUser = await User.findByIdAndUpdate(
    decoded.userId,
    { isVerified: true },
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
    avatar: updatedUser.avatar || null,
    isVerified: updatedUser.isVerified,
    loginProvider: updatedUser.loginProvider,
    role: updatedUser.role,
    accessToken,
    refreshToken,
  };

  return new ApiResponse(200, true, "Email verified successfully", {
    user,
  }).send(res);
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.loginProvider.includes("email")) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isVerified) {
    throw new ApiError(401, "Please verify your email before logging in");
  }

  if (user.isDisabled) {
    throw new ApiError(403, "Account has been disabled");
  }

  if (!user.ipAddress) {
    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    user.ipAddress = Array.isArray(rawIp) ? rawIp[0] : rawIp;
    await user.save();
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const userRes = {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || null,
    isVerified: user.isVerified,
    loginProvider: user.loginProvider,
    role: user.role,
    accessToken,
    refreshToken,
  };

  return new ApiResponse(200, true, "Login successful", {
    user: userRes,
  }).send(res);
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } },
    { new: true }
  );

  return new ApiResponse(200, true, "Logout successful").send(res);
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request: refresh token is required");
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

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.password) {
    if (!currentPassword) {
      throw new ApiError(400, "Current password is required");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid current password");
    }
  }

  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  user.password = newPassword;
  if (!user.loginProvider.includes("email")) {
    user.loginProvider.push("email");
  }
  await user.save();

  return new ApiResponse(200, true, "Password changed successfully").send(res);
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, "User not found with this email");

  if (!user.isVerified) {
    throw new ApiError(400, "Email is not verified");
  }

  const { otp, otpToken } = generateOtpAndOtpToken(user._id);

  if (config.NODE_ENV === "production") {
    await sendOTPEmail(email, user.name, otp);
    
  } else {
    console.log(`[Dev Verification Code] Email: ${user.email}, OTP: ${otp}`);
  }

  return new ApiResponse(200, true, "OTP sent successfully", { otpToken }).send(res);
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const { otp, otpToken } = req.body;
  if (!otp || !otpToken) throw new ApiError(400, "OTP and token are required");

  let decoded;
  try {
    decoded = jwt.verify(otpToken, token_secret);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(400, "OTP token has expired");
    }
    throw new ApiError(400, "Invalid OTP token");
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

export const resetPassword = asyncHandler(async (req, res) => {
  const { tempToken, newPassword, confirmNewPassword } = req.body;
  if (!tempToken || !newPassword || !confirmNewPassword) {
    throw new ApiError(400, "Temporary token and new password are required");
  }

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, token_secret);
  } catch {
    throw new ApiError(400, "Invalid or expired temporary token");
  }

  const user = await User.findById(decoded.userId);
  if (!user) throw new ApiError(404, "User not found");
  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  user.password = newPassword;
  if (!user.loginProvider.includes("email")) {
    user.loginProvider.push("email");
  }
  await user.save();

  return new ApiResponse(200, true, "Password reset successful").send(res);
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return new ApiResponse(200, true, "User fetched successfully", req.user).send(res);
});
