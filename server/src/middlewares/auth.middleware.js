import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { USER_ROLES } from "../constants/index.js";

/**
 * Middleware to authenticate requests via JWT Bearer token
 */
export const verifyUser = asyncHandler(async (req, _, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Unauthorized request. Missing or malformed token");
  }

  const token = authHeader.split(" ")[1]?.trim();
  if (!token) {
    throw new ApiError(401, "Unauthorized request. Token not provided");
  }

  try {
    const decoded = jwt.verify(token, config.access_token_secret);
    const user = await User.findById(decoded.userId).select(
      "-password -refreshToken -verificationToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token: user does not exist");
    }

    if (user.isDisabled) {
      throw new ApiError(403, "Account has been disabled. Please contact support");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token has expired. Please refresh your token");
    }
    throw new ApiError(401, "Invalid access token");
  }
});

/**
 * Middleware to restrict access to Admin or SuperAdmin users
 */
export const verifyAdmin = asyncHandler(async (req, _, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
  if (!allowedRoles.includes(req.user.role)) {
    throw new ApiError(403, "Access denied. Admin privileges required");
  }

  if (req.user.isDisabled) {
    throw new ApiError(403, "Admin account is disabled");
  }

  if (!req.user.isVerified) {
    throw new ApiError(403, "Admin email must be verified");
  }

  next();
});

/**
 * Middleware to restrict access strictly to SuperAdmin users
 */
export const verifySuperAdmin = asyncHandler(async (req, _, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(403, "Access denied. SuperAdmin privileges required");
  }

  next();
});

// Composed middleware for Admin protected routes
export const authenticateAndVerifyAdmin = [verifyUser, verifyAdmin];
