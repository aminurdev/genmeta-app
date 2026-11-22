import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { User } from "../models/user.model.js";
import { Session } from "../models/session.model.js";
import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { USER_ROLES } from "../constants/index.js";
import { ACCESS_COOKIE_NAME } from "../utils/auth.utils.js";

function extractAccessToken(req) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.split(" ")[1]?.trim();
    if (bearer) return bearer;
  }

  const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
  if (cookieToken) {
    return String(cookieToken).trim();
  }

  return null;
}

async function resolveAuthenticatedUser(token) {
  const decoded = jwt.verify(token, config.access_token_secret);

  if (decoded.purpose === "device_replace") {
    throw new ApiError(401, "Invalid access token type", [], "", {
      code: "INVALID_TOKEN_TYPE",
    });
  }

  if (decoded.type && decoded.type !== "access") {
    throw new ApiError(401, "Invalid access token type", [], "", {
      code: "INVALID_TOKEN_TYPE",
    });
  }

  const user = await User.findById(decoded.userId).select(
    "-password -refreshToken -verificationToken"
  );

  if (!user) {
    throw new ApiError(401, "Invalid access token: user does not exist", [], "", {
      code: "USER_NOT_FOUND",
    });
  }

  if (user.isDisabled) {
    throw new ApiError(403, "Account has been disabled. Please contact support", [], "", {
      code: "ACCOUNT_DISABLED",
    });
  }

  if (
    user.passwordChangedAt &&
    decoded.iat &&
    decoded.iat * 1000 < user.passwordChangedAt.getTime()
  ) {
    throw new ApiError(
      401,
      "Session invalidated due to password change. Please sign in again.",
      [],
      "",
      { code: "TOKEN_INVALIDATED" }
    );
  }

  let sessionId = null;
  if (decoded.sid) {
    const session = await Session.findById(decoded.sid);
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.userId.toString() !== user._id.toString()
    ) {
      throw new ApiError(
        401,
        "Session has expired or been revoked. Please sign in again.",
        [],
        "",
        { code: "SESSION_REVOKED" }
      );
    }

    sessionId = session._id.toString();

    const FIVE_MINUTES = 5 * 60 * 1000;
    if (Date.now() - new Date(session.lastActiveAt).getTime() > FIVE_MINUTES) {
      Session.updateOne(
        { _id: session._id },
        { $set: { lastActiveAt: new Date() } }
      ).catch(() => {});
    }
  }

  return { user, sessionId };
}

/**
 * Middleware to authenticate requests via HttpOnly cookie or JWT Bearer token
 */
export const verifyUser = asyncHandler(async (req, _, next) => {
  const token = extractAccessToken(req);

  if (!token) {
    throw new ApiError(401, "Unauthorized request. Missing authentication token", [], "", {
      code: "AUTH_TOKEN_MISSING",
    });
  }

  try {
    const { user, sessionId } = await resolveAuthenticatedUser(token);
    req.user = user;
    req.sessionId = sessionId;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token has expired. Please refresh your token", [], "", {
        code: "TOKEN_EXPIRED",
      });
    }
    throw new ApiError(401, "Invalid access token", [], "", {
      code: "TOKEN_INVALID",
    });
  }
});

/**
 * Optional authentication middleware (attaches req.user when valid, otherwise continues as guest)
 */
export const optionalAuth = asyncHandler(async (req, _, next) => {
  const token = extractAccessToken(req);
  if (!token) return next();

  try {
    const { user, sessionId } = await resolveAuthenticatedUser(token);
    req.user = user;
    req.sessionId = sessionId;
  } catch {
    // Ignore invalid/expired optional auth and proceed unauthenticated
  }
  next();
});

/**
 * Middleware factory for custom allowed roles
 */
export const authorizeRoles = (...allowedRoles) =>
  asyncHandler(async (req, _, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "Access denied. Insufficient permissions");
    }
    next();
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

// Composed middleware for SuperAdmin protected routes
export const authenticateAndVerifySuperAdmin = [verifyUser, verifySuperAdmin];
