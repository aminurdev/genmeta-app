import crypto from "crypto";
import mongoose from "mongoose";
import passport from "passport";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import config from "../config/index.js";
import { User } from "../models/user.model.js";
import { Session } from "../models/session.model.js";
import { AuthToken } from "../models/authToken.model.js";
import { Referral } from "../models/referral.model.js";
import { findOrCreateAppUser } from "./appUser.controller.js";
import {
  sendPasswordResetOTP,
  sendVerificationEmail,
} from "../services/email/email.service.js";
import notificationService from "../services/notification/notification.service.js";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
} from "../constants/index.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  clearAuthCookies,
  generateOpaqueToken,
  generateOtpCode,
  getClientIp,
  getDummyPasswordHash,
  parseDurationToMs,
  parseUserAgent,
  sanitizeRedirectPath,
  serializeUser,
  setAuthCookies,
  sha256,
  timingSafeHashEqual,
} from "../utils/auth.utils.js";

const OTP_TTL_MS = 15 * 60 * 1000;
const OAUTH_EXCHANGE_TTL_MS = 2 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

async function createSessionAndSetCookies(req, res, user) {
  const tokenFamily = crypto.randomUUID();
  const refreshExpiryMs = parseDurationToMs(
    config.refresh_token_expiry,
    30 * 24 * 60 * 60 * 1000
  );
  const sessionId = new mongoose.Types.ObjectId();
  const ua = req.headers["user-agent"] || "";
  const ipAddress = getClientIp(req);

  const accessToken = user.generateAccessToken(sessionId);
  const refreshToken = user.generateRefreshToken(sessionId, tokenFamily);

  const session = await Session.create({
    _id: sessionId,
    userId: user._id,
    tokenHash: sha256(refreshToken),
    tokenFamily,
    userAgent: ua,
    deviceName: parseUserAgent(ua),
    ipAddress,
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + refreshExpiryMs),
  });

  setAuthCookies(res, accessToken, refreshToken);

  const now = new Date();
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        lastLoginAt: now,
        failedLoginAttempts: 0,
        lockUntil: null,
        ...(!user.ipAddress && ipAddress ? { ipAddress } : {}),
      },
    }
  );
  user.lastLoginAt = now;

  return { session, accessToken, refreshToken };
}

async function applyReferralIfEligible(user, referralCode) {
  if (!referralCode || user.referred) return;

  const normalizedCode = String(referralCode).trim().toUpperCase();
  if (!normalizedCode) return;

  const referralDoc = await Referral.findOne({ referralCode: normalizedCode });
  if (!referralDoc || referralDoc.referrer.toString() === user._id.toString()) {
    return;
  }

  // Only attach referral for new accounts (created today or within 24h)
  const ageMs = Date.now() - new Date(user.createdAt).getTime();
  if (ageMs > 24 * 60 * 60 * 1000) {
    return;
  }

  user.referred = referralDoc._id;
  await User.updateOne(
    { _id: user._id, referred: null },
    { $set: { referred: referralDoc._id } }
  );

  if (!referralDoc.referredUsers.some((id) => id.toString() === user._id.toString())) {
    referralDoc.referredUsers.push(user._id);
    await referralDoc.save();
    notificationService
      .notifyUser({
        recipientId: referralDoc.referrer,
        type: "referral.joined",
        category: NOTIFICATION_CATEGORIES.REFERRAL,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        title: "New Referral Sign-Up",
        message: `${user.name || user.email} joined GenMeta using your referral link! You will earn a commission when they purchase their first plan.`,
        actionUrl: "/dashboard/referral",
        actionLabel: "View Referrals",
        dedupeKey: `referral_joined:${referralDoc._id}:${user._id}`,
        actor: {
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || null,
        },
        metadata: { referredUserId: user._id.toString() },
      })
      .catch(() => {});
  }
}

async function issueEmailVerificationToken(user) {
  await AuthToken.updateMany(
    { userId: user._id, type: "email_verification", usedAt: null },
    { $set: { usedAt: new Date() } }
  );

  const otp = generateOtpCode();
  const linkToken = generateOpaqueToken(32);

  await AuthToken.create({
    userId: user._id,
    email: user.email.toLowerCase().trim(),
    type: "email_verification",
    codeHash: sha256(otp),
    linkTokenHash: sha256(linkToken),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  const verificationLink = `${config.cors_origin}/verify-email?token=${linkToken}`;

  if (config.isProduction || config.resend_api_key) {
    await sendVerificationEmail(user.email, user.name, otp, verificationLink);
  }
  if (!config.isProduction) {
    console.log(
      `[Dev Email Verification] Email: ${user.email} | OTP: ${otp} | Link: ${verificationLink}`
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                               Google OAuth                                 */
/* -------------------------------------------------------------------------- */

export const googleLogin = asyncHandler(async (req, res, next) => {
  const { state, type, redirectPath } = req.query;

  // Preserve desktop Electron app OAuth contract
  if (type === "app") {
    return passport.authenticate("google", {
      scope: ["profile", "email"],
      state: JSON.stringify({ state, type: "app" }),
    })(req, res, next);
  }

  let requestedRedirect = redirectPath;
  if (!requestedRedirect && state) {
    try {
      const parsed = JSON.parse(String(state));
      requestedRedirect = parsed?.redirectPath;
    } catch {
      requestedRedirect = undefined;
    }
  }

  const safeRedirectPath = sanitizeRedirectPath(requestedRedirect, "/dashboard");
  const signedState = jwt.sign(
    {
      nonce: generateOpaqueToken(16),
      redirectPath: safeRedirectPath,
      type: "web",
    },
    config.access_token_secret,
    { expiresIn: "10m" }
  );

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: signedState,
  })(req, res, next);
});

export const googleLoginCallback = asyncHandler(async (req, res, next) => {
  const { state, error } = req.query;

  if (error) {
    return res.redirect(
      `${config.cors_origin}/login?error=${encodeURIComponent(String(error))}`
    );
  }

  let verifiedState;
  try {
    verifiedState = jwt.verify(String(state || ""), config.access_token_secret);
    if (verifiedState?.type !== "web") {
      throw new Error("Invalid OAuth state type");
    }
  } catch {
    return res.redirect(`${config.cors_origin}/auth-error?error=invalid_state`);
  }

  const safeRedirectPath = sanitizeRedirectPath(
    verifiedState.redirectPath,
    "/dashboard"
  );

  passport.authenticate("google", { session: false }, async (err, user) => {
    try {
      if (err || !user) {
        return res.redirect(`${config.cors_origin}/auth-error?error=auth_failed`);
      }

      if (user.isDisabled) {
        return res.redirect(
          `${config.cors_origin}/auth-error?error=account_disabled`
        );
      }

      await findOrCreateAppUser(user);

      const ipAddress = getClientIp(req);
      if (!user.ipAddress && ipAddress) {
        await User.updateOne(
          { _id: user._id },
          { $set: { ipAddress } }
        );
      }

      const exchangeCode = generateOpaqueToken(32);
      await AuthToken.create({
        userId: user._id,
        email: user.email,
        type: "oauth_exchange",
        codeHash: sha256(exchangeCode),
        expiresAt: new Date(Date.now() + OAUTH_EXCHANGE_TTL_MS),
        metadata: { redirectPath: safeRedirectPath },
      });

      const redirectUrl = `${config.cors_origin}/verify-google?code=${encodeURIComponent(
        exchangeCode
      )}&redirectPath=${encodeURIComponent(safeRedirectPath)}`;

      return res.redirect(redirectUrl);
    } catch (callbackErr) {
      console.error("Google Callback Error:", callbackErr);
      return res.redirect(`${config.cors_origin}/auth-error?error=server_error`);
    }
  })(req, res, next);
});

export const verifyGoogleToken = asyncHandler(async (req, res) => {
  const { code, referralCode } = req.body;

  if (!code) {
    throw new ApiError(400, "Google authorization code is required");
  }

  const tokenDoc = await AuthToken.findOneAndUpdate(
    {
      type: "oauth_exchange",
      codeHash: sha256(code),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } },
    { new: true }
  );

  if (!tokenDoc) {
    throw new ApiError(
      401,
      "Invalid or expired Google sign-in code. Please try signing in again.",
      [],
      "",
      { code: "OAUTH_CODE_INVALID" }
    );
  }

  const user = await User.findById(tokenDoc.userId).select(
    "-password -refreshToken -verificationToken"
  );
  if (!user) {
    throw new ApiError(404, "User account not found");
  }

  if (user.isDisabled) {
    throw new ApiError(
      403,
      "Your account has been disabled. Please contact support.",
      [],
      "",
      { code: "ACCOUNT_DISABLED" }
    );
  }

  await applyReferralIfEligible(user, referralCode);
  await findOrCreateAppUser(user);

  const { session } = await createSessionAndSetCookies(req, res, user);
  const redirectPath = sanitizeRedirectPath(
    tokenDoc.metadata?.redirectPath,
    "/dashboard"
  );

  return new ApiResponse(200, true, "Google verification successful", {
    user: serializeUser(user),
    sessionId: session._id.toString(),
    redirectPath,
  }).send(res);
});

/* -------------------------------------------------------------------------- */
/*                       Registration & Email Verification                    */
/* -------------------------------------------------------------------------- */

export const registerUser = asyncHandler(async (req, res) => {
  const { name, password, referralCode } = req.body;
  const email = req.body.email.toLowerCase().trim();
  const userIp = getClientIp(req);

  let user = await User.findOne({ email });

  if (user && user.isVerified) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  if (user && !user.loginProvider.includes("email")) {
    throw new ApiError(
      409,
      "This email is registered with Google Sign-In. Please continue with Google."
    );
  }

  let referralDoc = null;
  if (referralCode) {
    referralDoc = await Referral.findOne({
      referralCode: String(referralCode).trim().toUpperCase(),
    });
  }

  if (user) {
    user.name = name || user.name;
    user.password = password;
    if (userIp && !user.ipAddress) user.ipAddress = userIp;
    if (referralDoc && !referralDoc.referrer.equals(user._id)) {
      user.referred = referralDoc._id;
    }
  } else {
    user = new User({
      name,
      email,
      password,
      loginProvider: ["email"],
      ipAddress: userIp,
    });
    if (referralDoc && !referralDoc.referrer.equals(user._id)) {
      user.referred = referralDoc._id;
    }
  }

  await user.save();
  await findOrCreateAppUser(user);

  if (
    referralDoc &&
    !referralDoc.referrer.equals(user._id) &&
    !referralDoc.referredUsers.some((id) => id.toString() === user._id.toString())
  ) {
    referralDoc.referredUsers.push(user._id);
    await referralDoc.save();
  }

  await issueEmailVerificationToken(user);

  return new ApiResponse(
    201,
    true,
    "Account created! Check your email for the 6-digit verification code or link.",
    {
      email: user.email,
      requiresVerification: true,
    }
  ).send(res);
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user || user.isVerified || user.isDisabled) {
    return new ApiResponse(
      200,
      true,
      "If an unverified account exists for this email, a new verification code has been sent.",
      { email }
    ).send(res);
  }

  const latestToken = await AuthToken.findOne({
    userId: user._id,
    type: "email_verification",
    usedAt: null,
  }).sort({ createdAt: -1 });

  if (latestToken) {
    const elapsedMs = Date.now() - new Date(latestToken.createdAt).getTime();
    if (elapsedMs < RESEND_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000);
      throw new ApiError(
        429,
        `Please wait ${retryAfterSeconds}s before requesting another code.`,
        [],
        "",
        { code: "RESEND_COOLDOWN", data: { retryAfterSeconds } }
      );
    }
  }

  await issueEmailVerificationToken(user);

  return new ApiResponse(
    200,
    true,
    "If an unverified account exists for this email, a new verification code has been sent.",
    { email }
  ).send(res);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const rawLinkToken = req.query?.token || req.body?.token;
  const email = req.body?.email?.toLowerCase?.().trim();
  const otp = req.body?.otp?.trim?.();

  let tokenDoc = null;

  if (rawLinkToken) {
    tokenDoc = await AuthToken.findOneAndUpdate(
      {
        type: "email_verification",
        linkTokenHash: sha256(String(rawLinkToken).trim()),
        usedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { $set: { usedAt: new Date() } },
      { new: true }
    );

    if (!tokenDoc) {
      throw new ApiError(
        400,
        "Verification link is invalid or has expired. Please request a new verification email.",
        [],
        "",
        { code: "VERIFICATION_TOKEN_INVALID" }
      );
    }
  } else if (email && otp) {
    const candidate = await AuthToken.findOne({
      email,
      type: "email_verification",
      usedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!candidate) {
      throw new ApiError(
        400,
        "Verification code is invalid or has expired. Please request a new code.",
        [],
        "",
        { code: "VERIFICATION_CODE_INVALID" }
      );
    }

    if (candidate.attempts >= candidate.maxAttempts) {
      await AuthToken.updateOne(
        { _id: candidate._id, usedAt: null },
        { $set: { usedAt: new Date() } }
      );
      throw new ApiError(
        429,
        "Too many failed verification attempts. Please request a new code.",
        [],
        "",
        { code: "OTP_ATTEMPTS_EXCEEDED" }
      );
    }

    const isMatch = timingSafeHashEqual(sha256(otp), candidate.codeHash);
    if (!isMatch) {
      const nextAttempts = candidate.attempts + 1;
      const exhausted = nextAttempts >= candidate.maxAttempts;
      await AuthToken.updateOne(
        { _id: candidate._id },
        {
          $inc: { attempts: 1 },
          ...(exhausted ? { $set: { usedAt: new Date() } } : {}),
        }
      );

      if (exhausted) {
        throw new ApiError(
          429,
          "Too many failed verification attempts. Please request a new code.",
          [],
          "",
          { code: "OTP_ATTEMPTS_EXCEEDED" }
        );
      }

      const remaining = candidate.maxAttempts - nextAttempts;
      throw new ApiError(
        400,
        `Invalid verification code. ${remaining} attempt(s) remaining.`
      );
    }

    tokenDoc = await AuthToken.findOneAndUpdate(
      { _id: candidate._id, usedAt: null },
      { $set: { usedAt: new Date() } },
      { new: true }
    );

    if (!tokenDoc) {
      throw new ApiError(400, "Verification code has already been used.");
    }
  } else {
    throw new ApiError(
      400,
      "Please provide either a verification token or your email and 6-digit code."
    );
  }

  const user = await User.findByIdAndUpdate(
    tokenDoc.userId,
    { $set: { isVerified: true } },
    { new: true, select: "-password -refreshToken -verificationToken" }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isDisabled) {
    throw new ApiError(
      403,
      "Your account has been disabled. Please contact support.",
      [],
      "",
      { code: "ACCOUNT_DISABLED" }
    );
  }

  await AuthToken.updateMany(
    { userId: user._id, type: "email_verification", usedAt: null },
    { $set: { usedAt: new Date() } }
  );

  await findOrCreateAppUser(user);
  const { session } = await createSessionAndSetCookies(req, res, user);

  Promise.resolve()
    .then(async () => {
      await notificationService.notifyUser({
        recipientId: user._id,
        recipientEmail: user.email,
        recipientName: user.name,
        type: "account.welcome",
        category: NOTIFICATION_CATEGORIES.ANNOUNCEMENT,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        title: "Welcome to GenMeta!",
        message:
          "Your email is verified and your account is ready. Download the desktop app or explore plans in your dashboard.",
        actionUrl: "/dashboard",
        actionLabel: "Open Dashboard",
        dedupeKey: `welcome:${user._id}`,
      });

      if (user.referred) {
        const referralDoc = await Referral.findById(user.referred)
          .select("referrer")
          .lean();
        if (referralDoc?.referrer) {
          await notificationService.notifyUser({
            recipientId: referralDoc.referrer,
            type: "referral.joined",
            category: NOTIFICATION_CATEGORIES.REFERRAL,
            priority: NOTIFICATION_PRIORITIES.NORMAL,
            title: "New Referral Sign-Up",
            message: `${user.name || user.email} verified their GenMeta account via your referral link!`,
            actionUrl: "/dashboard/referral",
            actionLabel: "View Referrals",
            dedupeKey: `referral_joined:${user.referred}:${user._id}`,
            actor: {
              userId: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar || null,
            },
            metadata: { referredUserId: user._id.toString() },
          });
        }
      }
    })
    .catch(() => {});

  return new ApiResponse(200, true, "Email verified successfully", {
    user: serializeUser(user),
    sessionId: session._id.toString(),
  }).send(res);
});

/* -------------------------------------------------------------------------- */
/*                           Login, Refresh & Sessions                        */
/* -------------------------------------------------------------------------- */

export const loginUser = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  const { password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    await bcrypt.compare(password, getDummyPasswordHash());
    throw new ApiError(401, "Invalid email or password", [], "", {
      code: "INVALID_CREDENTIALS",
    });
  }

  if (user.isDisabled) {
    throw new ApiError(
      403,
      "Your account has been disabled. Please contact support.",
      [],
      "",
      { code: "ACCOUNT_DISABLED" }
    );
  }

  if (user.isLocked()) {
    const remainingMin = Math.max(
      1,
      Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000)
    );
    throw new ApiError(
      423,
      `Account temporarily locked due to repeated failed login attempts. Try again in ${remainingMin} minute(s).`,
      [],
      "",
      { code: "ACCOUNT_LOCKED", data: { retryAfterMinutes: remainingMin } }
    );
  }

  if (!user.password || !user.loginProvider.includes("email")) {
    await bcrypt.compare(password, getDummyPasswordHash());
    throw new ApiError(
      401,
      "This account uses Google Sign-In. Please click 'Continue with Google' to sign in.",
      [],
      "",
      { code: "USE_GOOGLE_LOGIN" }
    );
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    const maxAttempts = config.max_login_attempts || 5;
    const lockoutMs = config.lockout_duration_ms || 15 * 60 * 1000;
    const nextAttempts = (user.failedLoginAttempts || 0) + 1;

    if (nextAttempts >= maxAttempts) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            failedLoginAttempts: 0,
            lockUntil: new Date(Date.now() + lockoutMs),
          },
        }
      );
      throw new ApiError(
        423,
        "Too many failed login attempts. Your account has been temporarily locked for 15 minutes.",
        [],
        "",
        { code: "ACCOUNT_LOCKED" }
      );
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: nextAttempts } }
    );

    throw new ApiError(401, "Invalid email or password", [], "", {
      code: "INVALID_CREDENTIALS",
    });
  }

  if (!user.isVerified) {
    throw new ApiError(
      403,
      "Please verify your email address before signing in.",
      [],
      "",
      { code: "EMAIL_NOT_VERIFIED", data: { email: user.email } }
    );
  }

  await findOrCreateAppUser(user);
  const { session } = await createSessionAndSetCookies(req, res, user);

  return new ApiResponse(200, true, "Login successful", {
    user: serializeUser(user),
    sessionId: session._id.toString(),
  }).send(res);
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    clearAuthCookies(res);
    throw new ApiError(401, "Session expired. Please sign in again.", [], "", {
      code: "REFRESH_TOKEN_MISSING",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, config.refresh_token_secret);
  } catch {
    clearAuthCookies(res);
    throw new ApiError(401, "Invalid or expired refresh token", [], "", {
      code: "REFRESH_TOKEN_INVALID",
    });
  }

  if (decoded.type !== "refresh" || !decoded.sid || !decoded.fam || !decoded.userId) {
    clearAuthCookies(res);
    throw new ApiError(401, "Malformed refresh token", [], "", {
      code: "REFRESH_TOKEN_INVALID",
    });
  }

  const [session, user] = await Promise.all([
    Session.findById(decoded.sid),
    User.findById(decoded.userId).select("-password -refreshToken -verificationToken"),
  ]);

  if (!user) {
    clearAuthCookies(res);
    throw new ApiError(401, "User account not found", [], "", {
      code: "USER_NOT_FOUND",
    });
  }

  if (user.isDisabled) {
    await Session.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "user_disabled" } }
    );
    clearAuthCookies(res);
    throw new ApiError(403, "Account has been disabled. Please contact support.", [], "", {
      code: "ACCOUNT_DISABLED",
    });
  }

  if (
    user.passwordChangedAt &&
    decoded.iat &&
    decoded.iat * 1000 < user.passwordChangedAt.getTime()
  ) {
    await Session.updateOne(
      { _id: decoded.sid, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "password_change" } }
    );
    clearAuthCookies(res);
    throw new ApiError(401, "Session invalidated by password change.", [], "", {
      code: "TOKEN_INVALIDATED",
    });
  }

  const incomingHash = sha256(incomingRefreshToken);

  if (
    !session ||
    session.userId.toString() !== user._id.toString() ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !timingSafeHashEqual(session.tokenHash, incomingHash)
  ) {
    // Refresh token reuse / revoked session replay detected: revoke entire family
    await Session.updateMany(
      { userId: user._id, tokenFamily: decoded.fam, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "token_reuse" } }
    );
    clearAuthCookies(res);
    throw new ApiError(
      401,
      "Your session could not be verified. Please sign in again.",
      [],
      "",
      { code: "TOKEN_REUSE_DETECTED" }
    );
  }

  const newAccessToken = user.generateAccessToken(session._id);
  const newRefreshToken = user.generateRefreshToken(session._id, session.tokenFamily);
  const refreshExpiryMs = parseDurationToMs(
    config.refresh_token_expiry,
    30 * 24 * 60 * 60 * 1000
  );

  const ua = req.headers["user-agent"] || session.userAgent || "";
  const ipAddress = getClientIp(req) || session.ipAddress;

  // Atomic check-and-rotate so concurrent refresh requests cannot replay the same token
  const rotated = await Session.findOneAndUpdate(
    {
      _id: session._id,
      tokenHash: incomingHash,
      revokedAt: null,
    },
    {
      $set: {
        tokenHash: sha256(newRefreshToken),
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + refreshExpiryMs),
        userAgent: ua,
        deviceName: parseUserAgent(ua),
        ipAddress,
      },
    },
    { new: true }
  );

  if (!rotated) {
    await Session.updateMany(
      { userId: user._id, tokenFamily: decoded.fam, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "token_reuse" } }
    );
    clearAuthCookies(res);
    throw new ApiError(
      401,
      "Refresh token conflict detected. Please sign in again.",
      [],
      "",
      { code: "TOKEN_REUSE_DETECTED" }
    );
  }

  setAuthCookies(res, newAccessToken, newRefreshToken);

  return new ApiResponse(200, true, "Session refreshed successfully", {
    user: serializeUser(user),
    sessionId: rotated._id.toString(),
  }).send(res);
});

export const logoutUser = asyncHandler(async (req, res) => {
  let sessionId = req.sessionId || null;

  if (!sessionId) {
    const refreshCookie = req.cookies?.[REFRESH_COOKIE_NAME];
    if (refreshCookie) {
      try {
        const decoded = jwt.verify(refreshCookie, config.refresh_token_secret, {
          ignoreExpiration: true,
        });
        if (decoded?.sid) sessionId = decoded.sid;
      } catch {
        // Ignore invalid refresh cookie on logout
      }
    }
  }

  if (!sessionId) {
    const accessCookie = req.cookies?.[ACCESS_COOKIE_NAME];
    if (accessCookie) {
      try {
        const decoded = jwt.verify(accessCookie, config.access_token_secret, {
          ignoreExpiration: true,
        });
        if (decoded?.sid) sessionId = decoded.sid;
      } catch {
        // Ignore invalid access cookie on logout
      }
    }
  }

  if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
    await Session.updateOne(
      { _id: sessionId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "logout" } }
    );
  }

  clearAuthCookies(res);
  return new ApiResponse(200, true, "Logged out successfully").send(res);
});

export const logoutAllSessions = asyncHandler(async (req, res) => {
  await Session.updateMany(
    { userId: req.user._id, revokedAt: null },
    { $set: { revokedAt: new Date(), revokeReason: "logout_all" } }
  );

  clearAuthCookies(res);
  return new ApiResponse(200, true, "Signed out from all devices successfully").send(res);
});

export const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({
    userId: req.user._id,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastActiveAt: -1 })
    .lean();

  const formatted = sessions.map((s) => ({
    id: s._id.toString(),
    deviceName: s.deviceName || "Unknown Device",
    ipAddress: s.ipAddress || "",
    userAgent: s.userAgent || "",
    lastActiveAt: s.lastActiveAt,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    isCurrent: Boolean(req.sessionId && s._id.toString() === req.sessionId),
  }));

  return new ApiResponse(200, true, "Active sessions retrieved", {
    sessions: formatted,
  }).send(res);
});

export const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new ApiError(400, "Invalid session ID");
  }

  const revoked = await Session.findOneAndUpdate(
    {
      _id: sessionId,
      userId: req.user._id,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
        revokeReason: "revoked_by_user",
      },
    },
    { new: true }
  );

  if (!revoked) {
    throw new ApiError(404, "Active session not found");
  }

  const revokedCurrent = Boolean(req.sessionId && sessionId === req.sessionId);
  if (revokedCurrent) {
    clearAuthCookies(res);
  }

  return new ApiResponse(200, true, "Session revoked successfully", {
    sessionId,
    revokedCurrent,
  }).send(res);
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return new ApiResponse(200, true, "User fetched successfully", {
    user: serializeUser(req.user),
    currentSessionId: req.sessionId || null,
  }).send(res);
});

/* -------------------------------------------------------------------------- */
/*                       Password Reset & Password Change                     */
/* -------------------------------------------------------------------------- */

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const uniformMessage =
    "If an account exists for this email, a 6-digit password reset code has been sent.";

  const user = await User.findOne({ email });

  if (user && !user.isDisabled) {
    const latestToken = await AuthToken.findOne({
      userId: user._id,
      type: "password_reset",
      usedAt: null,
    }).sort({ createdAt: -1 });

    const elapsedMs = latestToken
      ? Date.now() - new Date(latestToken.createdAt).getTime()
      : Infinity;

    if (elapsedMs >= RESEND_COOLDOWN_MS) {
      await AuthToken.updateMany(
        { userId: user._id, type: "password_reset", usedAt: null },
        { $set: { usedAt: new Date() } }
      );

      const otp = generateOtpCode();
      await AuthToken.create({
        userId: user._id,
        email: user.email,
        type: "password_reset",
        codeHash: sha256(otp),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      });

      if (config.isProduction || config.resend_api_key) {
        await sendPasswordResetOTP(user.email, user.name, otp);
      }
      if (!config.isProduction) {
        console.log(`[Dev Password Reset OTP] Email: ${user.email} | OTP: ${otp}`);
      }
    }
  }

  return new ApiResponse(200, true, uniformMessage, { email }).send(res);
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  const otp = req.body.otp?.trim();

  if (!email || !otp) {
    throw new ApiError(400, "Email and 6-digit OTP are required");
  }

  const candidate = await AuthToken.findOne({
    email,
    type: "password_reset",
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!candidate) {
    throw new ApiError(400, "Invalid or expired verification code");
  }

  if (candidate.attempts >= candidate.maxAttempts) {
    await AuthToken.updateOne(
      { _id: candidate._id, usedAt: null },
      { $set: { usedAt: new Date() } }
    );
    throw new ApiError(
      429,
      "Too many failed attempts. Please request a new reset code."
    );
  }

  const isMatch = timingSafeHashEqual(sha256(otp), candidate.codeHash);
  if (!isMatch) {
    const nextAttempts = candidate.attempts + 1;
    const exhausted = nextAttempts >= candidate.maxAttempts;
    await AuthToken.updateOne(
      { _id: candidate._id },
      {
        $inc: { attempts: 1 },
        ...(exhausted ? { $set: { usedAt: new Date() } } : {}),
      }
    );

    if (exhausted) {
      throw new ApiError(
        429,
        "Too many failed attempts. Please request a new reset code."
      );
    }

    const remaining = candidate.maxAttempts - nextAttempts;
    throw new ApiError(400, `Invalid OTP code. ${remaining} attempt(s) remaining.`);
  }

  const consumed = await AuthToken.findOneAndUpdate(
    { _id: candidate._id, usedAt: null },
    { $set: { usedAt: new Date() } },
    { new: true }
  );

  if (!consumed) {
    throw new ApiError(400, "This verification code has already been used.");
  }

  // Invalidate any previous unused reset session tokens
  await AuthToken.updateMany(
    { userId: candidate.userId, type: "password_reset_session", usedAt: null },
    { $set: { usedAt: new Date() } }
  );

  const resetToken = generateOpaqueToken(32);
  await AuthToken.create({
    userId: candidate.userId,
    email: candidate.email,
    type: "password_reset_session",
    codeHash: sha256(resetToken),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  return new ApiResponse(200, true, "OTP verified successfully", {
    resetToken,
  }).send(res);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword, confirmNewPassword } = req.body;

  if (!resetToken || !newPassword || !confirmNewPassword) {
    throw new ApiError(400, "Reset token and new password are required");
  }

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  const tokenDoc = await AuthToken.findOneAndUpdate(
    {
      type: "password_reset_session",
      codeHash: sha256(resetToken),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } },
    { new: true }
  );

  if (!tokenDoc) {
    throw new ApiError(
      400,
      "Password reset session has expired or is invalid. Please request a new code."
    );
  }

  const user = await User.findById(tokenDoc.userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isDisabled) {
    throw new ApiError(403, "Account has been disabled. Please contact support.");
  }

  user.password = newPassword;
  if (!user.loginProvider.includes("email")) {
    user.loginProvider.push("email");
  }
  user.isVerified = true;
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  await Session.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date(), revokeReason: "password_reset" } }
  );

  clearAuthCookies(res);

  notificationService
    .notifyUser({
      recipientId: user._id,
      recipientEmail: user.email,
      recipientName: user.name,
      type: "security.password_reset",
      category: NOTIFICATION_CATEGORIES.SECURITY,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      forceDeliver: true,
      sendEmail: true,
      title: "Password Reset Completed",
      message:
        "Your GenMeta password was reset and all active sessions were signed out. If you did not authorize this reset, contact support immediately.",
      actionUrl: "/dashboard/profile",
      actionLabel: "Review Security",
    })
    .catch(() => {});

  return new ApiResponse(
    200,
    true,
    "Password reset successfully. Please sign in with your new password."
  ).send(res);
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const confirmPassword = req.body.confirmPassword || req.body.confirmNewPassword;

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.password) {
    if (!currentPassword) {
      throw new ApiError(400, "Current password is required");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(400, "Current password is incorrect");
    }
    if (currentPassword === newPassword) {
      throw new ApiError(
        400,
        "New password must be different from your current password"
      );
    }
  }

  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  user.password = newPassword;
  if (!user.loginProvider.includes("email")) {
    user.loginProvider.push("email");
  }
  await user.save();

  // Revoke all other sessions
  const otherSessionFilter = {
    userId: user._id,
    revokedAt: null,
    ...(req.sessionId ? { _id: { $ne: req.sessionId } } : {}),
  };
  await Session.updateMany(otherSessionFilter, {
    $set: { revokedAt: new Date(), revokeReason: "password_change" },
  });

  // Rotate the current session's tokens so the user stays signed in cleanly
  if (req.sessionId) {
    await Session.updateOne(
      { _id: req.sessionId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "password_change" } }
    );
  }
  await createSessionAndSetCookies(req, res, user);

  notificationService
    .notifyUser({
      recipientId: user._id,
      recipientEmail: user.email,
      recipientName: user.name,
      type: "security.password_changed",
      category: NOTIFICATION_CATEGORIES.SECURITY,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      forceDeliver: true,
      sendEmail: true,
      title: "Account Password Changed",
      message:
        "Your GenMeta password was updated and your other active sessions were signed out. Contact support if this wasn't you.",
      actionUrl: "/dashboard/profile",
      actionLabel: "Check Sessions",
    })
    .catch(() => {});

  return new ApiResponse(
    200,
    true,
    "Password changed successfully. Other active sessions have been signed out."
  ).send(res);
});
