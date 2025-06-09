import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyUser = asyncHandler(async (req, _, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized request");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.access_token_secret);
    const user = await User.findById(decoded.userId).select(
      "-password -refreshToken -verificationToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized request");
  }
});

export const verifyAdmin = asyncHandler(async (req, _, next) => {
  try {
    // First, ensure the user is authenticated
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    // Check if the user has admin role
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Access denied. Admin privileges required");
    }

    // Optional: Additional checks for admin account status
    if (req.user.isDisabled) {
      throw new ApiError(403, "Admin account is disabled");
    }

    // Optional: Verify email verification for admin
    if (!req.user.isVerified) {
      throw new ApiError(403, "Admin email must be verified");
    }

    next();
  } catch (error) {
    // If any check fails, throw an appropriate error
    throw new ApiError(
      error.statusCode || 403,
      error.message || "Admin access denied"
    );
  }
});

// Combine both authentication and admin verification
export const authenticateAndVerifyAdmin = [verifyUser, verifyAdmin];
