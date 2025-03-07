import config from "../config/index.js";
import { User } from "../models/user.model.js";
import { sendVerificationEmail } from "../services/email/email.service.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    console.log(err);
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const googleLogin = asyncHandler(async (req, res) => {
  const { name, email, googleId } = req.body;

  if (!email || !googleId) {
    throw new ApiError(400, "Google authentication failed");
  }

  let user = await User.findOne({ email });

  if (!user) {
    // Create new user if not found
    user = new User({
      name,
      email,
      googleId,
      loginProvider: "google",
      isVerified: true,
    });

    await user.save();
  } else if (user.loginProvider !== "google") {
    throw new ApiError(
      400,
      "This email is already registered with another provider"
    );
  }

  // Generate JWT tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Store refreshToken in the database
  user.refreshToken = refreshToken;
  await user.save();

  return new ApiResponse(200, true, "Google Login Successful", {
    user,
    accessToken,
    refreshToken,
  }).send(res);
});

// eslint-disable-next-line no-unused-vars
const registerUserOld = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }
  const user = await User.create({
    name,
    email,
    password,
    loginProvider: "email",
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  return new ApiResponse(201, true, "User registered Successfully", {
    user: createdUser,
    accessToken,
    refreshToken,
  }).send(res);
});
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });

  if (user && user.isVerified) {
    throw new ApiError(409, "Email already exists");
  }

  if (user) {
    user.name = name || user.name;
    user.password = password;
  } else {
    user = new User.create({
      name,
      email,
      password,
      loginProvider: "email",
    });
  }

  const verificationToken = user.generateEmailVerifyToken();
  user.verificationToken = verificationToken;
  await user.save();
  await sendVerificationEmail("dev.aminur@gmail.com", verificationToken);

  return new ApiResponse(
    201,
    true,
    "Registration successful! Check your email to verify."
  ).send(res);
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const decoded = jwt.verify(token, config.email_verify_token_secret);
  const user = await User.findById(decoded._id);

  if (!user) {
    throw new ApiError(400, "Invalid token");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email already verified");
  }
  if (!(token === user.verificationToken)) {
    throw new ApiError(400, "Invalid token");
  }
  user.isVerified = true;
  user.verificationToken = null;
  await user.save();

  return new ApiResponse(200, "Email verified successfully").send(res);
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "User does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.isVerified) {
    const verificationToken = user.generateEmailVerifyToken();
    user.verificationToken = verificationToken;
    await user.save();
    await sendVerificationEmail("dev.aminur@gmail.com", verificationToken);

    throw new ApiError(
      403,
      "Email is not verified. A new verification email has been sent."
    );
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return new ApiResponse(200, true, "Login Successful", {
    user: loggedInUser,
    accessToken,
    refreshToken,
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
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, newRefreshToken } =
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
  const { oldPassword, newPassword, confPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  if (newPassword !== confPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return new ApiResponse(200, true, "Password changed successfully").send(res);
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return new ApiResponse(200, req.user, "User fetched successfully").send(res);
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
};
