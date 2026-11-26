import crypto from "crypto";
import mongoose from "mongoose";
import passport from "passport";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { AppPricing } from "../models/appPricing.model.js";
import { AiAPI } from "../models/aiApiKey.model.js";
import { resolveAiApiKeyForClient } from "../utils/encrypt.js";
import { AppUser, extractDeviceMeta } from "../models/appUser.model.js";
import { ApiUsageLog } from "../models/apiUsageLog.model.js";
import { Referral } from "../models/referral.model.js";
import { Session } from "../models/session.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/api.error.js";
import { generateAppUserKey, compareVersions } from "../utils/index.js";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  PAYMENT_GATEWAYS,
  PLAN_TYPES,
  PROCESS_ERROR_STATUS,
  WITHDRAWAL_STATUS,
} from "../constants/index.js";
import { parseErrorMessages } from "../utils/processError.utils.js";
import planService from "../services/plan.service.js";
import notificationService from "../services/notification/notification.service.js";

function extractAppUserKey(req) {
  return (
    req.header("x-app-user-key") ||
    req.header("x-api-key") ||
    req.header("x-app-id") ||
    req.body?.appUserKey ||
    req.body?.apiKey ||
    req.body?.key ||
    ""
  )
    .toString()
    .trim();
}

async function resolveAdminAppUser(
  { appUserId, userId, username, key } = {},
  { createIfMissing = false } = {}
) {
  let appDoc = null;

  if (appUserId && mongoose.Types.ObjectId.isValid(appUserId)) {
    appDoc = await AppUser.findById(appUserId);
  }

  if (!appDoc && userId && mongoose.Types.ObjectId.isValid(userId)) {
    appDoc = await AppUser.findOne({ userId });
    if (!appDoc && createIfMissing) {
      const existingUser = await User.findById(userId);
      if (existingUser) {
        appDoc = await findOrCreateAppUser(existingUser);
      }
    }
  }

  if (!appDoc && username) {
    const normalizedEmail = String(username).toLowerCase().trim();
    if (normalizedEmail) {
      appDoc = await AppUser.findOne({ username: normalizedEmail });
      if (!appDoc && createIfMissing) {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          appDoc = await findOrCreateAppUser(existingUser);
        }
      }
    }
  }

  if (!appDoc && key) {
    appDoc = await AppUser.findOne({ key: String(key).trim() });
  }

  return appDoc;
}

export const findOrCreateAppUser = async (user) => {
  let appUser = await AppUser.findOne({ userId: user._id });

  if (!appUser) {
    const today = new Date().toISOString().split("T")[0];
    appUser = await AppUser.create({
      userId: user._id,
      username: user.email.toLowerCase().trim(),
      key: generateAppUserKey(),
      plan: { type: PLAN_TYPES.FREE },
      credit: 5,
      isActive: true,
      status: user.isDisabled ? "suspended" : "active",
      lastCreditRefresh: today,
      monthlyProcess: new Map([[today.substring(0, 7), 0]]),
      dailyProcess: new Map([[today, 0]]),
    });
  }

  return appUser;
};

function createDeviceChallengeToken(user, appUserDoc, deviceMeta) {
  return jwt.sign(
    {
      purpose: "device_replace",
      userId: user._id.toString(),
      appUserId: appUserDoc._id.toString(),
      appUserKey: appUserDoc.key,
      pendingDeviceId: deviceMeta?.deviceId || null,
    },
    config.access_token_secret,
    { expiresIn: "10m" }
  );
}

async function buildAppAccountPayload(appDoc, user, deviceMeta = {}) {
  const now = new Date();
  const planType = appDoc.plan?.type || PLAN_TYPES.FREE;
  const expiresIn =
    (planType === PLAN_TYPES.CREDIT || planType === PLAN_TYPES.SUBSCRIPTION) &&
    appDoc.expiresAt
      ? Math.max(0, Math.floor((appDoc.expiresAt - now) / (1000 * 60 * 60 * 24)))
      : null;

  const encryptedKeyDoc =
    planType === PLAN_TYPES.CREDIT ? await AiAPI.findOne({ isActive: true }) : null;
  const aiApiKey =
    planType === PLAN_TYPES.CREDIT && encryptedKeyDoc
      ? resolveAiApiKeyForClient(encryptedKeyDoc.ai_api_key)
      : null;
  const aiApiSecret = planType === PLAN_TYPES.CREDIT ? config.encoderKey : null;

  const remainingCredit = appDoc.calculateCredit();
  const devices = appDoc.getFormattedDevices(
    deviceMeta.deviceId || null,
    deviceMeta.fingerprint || null
  );
  const maxDevices = appDoc.maxDevices || 2;

  return {
    appUserId: appDoc._id.toString(),
    userId: (user?._id || appDoc.userId)?.toString() || null,
    appUserKey: appDoc.key,
    key: appDoc.key,
    plan: appDoc.plan,
    planType,
    planId: appDoc.plan?.id || null,
    username: user?.name || appDoc.username,
    email: user?.email || appDoc.username,
    name: user?.name || appDoc.username,
    status: appDoc.status,
    isValid: appDoc.isActive && appDoc.status === "active",
    expiresAt:
      planType === PLAN_TYPES.CREDIT || planType === PLAN_TYPES.SUBSCRIPTION
        ? appDoc.expiresAt
        : null,
    expiresIn,
    credit: remainingCredit === Infinity ? null : remainingCredit,
    totalProcess: appDoc.totalProcess || 0,
    aiApiSecret,
    aiApiKey,
    hasAiApiKey: planType === PLAN_TYPES.CREDIT && Boolean(aiApiKey),
    devices,
    maxDevices,
    currentDeviceId: deviceMeta.deviceId || null,
  };
}

function renderOAuthResultHtml({ success, title, subtitle, redirectUrl }) {
  const accentColor = success ? "#2ecc71" : "#e74c3c";
  const badgeBg = success ? "rgba(46, 204, 113, 0.14)" : "rgba(231, 76, 60, 0.14)";
  const iconSvg = success
    ? `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`
    : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - GenMeta</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #141619;
      color: #e4e6eb;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .card {
      background: #1f2228;
      border: 1px solid #2f343d;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
      padding: 36px 40px;
      max-width: 420px;
      width: 92%;
    }
    .icon-badge {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${badgeBg};
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 18px;
    }
    h2 {
      color: #ffffff;
      font-size: 20px;
      margin: 0 0 8px;
      font-weight: 600;
    }
    p {
      color: #9aa0a6;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 24px;
    }
    .btn {
      display: inline-block;
      background: #0078d7;
      color: #ffffff;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 22px;
      border-radius: 8px;
      transition: background 0.15s ease;
    }
    .btn:hover { background: #006cc1; }
    .hint {
      margin-top: 16px;
      font-size: 12px;
      color: #6c727a;
    }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      window.location.replace(${JSON.stringify(redirectUrl)});
    });
  </script>
</head>
<body>
  <div class="card">
    <div class="icon-badge">${iconSvg}</div>
    <h2>${title}</h2>
    <p>${subtitle}</p>
    <a class="btn" href="${redirectUrl}">Return to GenMeta App</a>
    <div class="hint">You can safely close this browser tab once GenMeta opens.</div>
  </div>
</body>
</html>`;
}

/* -------------------------------------------------------------------------- */
/*                      Desktop App OAuth & Login Flows                       */
/* -------------------------------------------------------------------------- */

export const googleLoginAPP = asyncHandler(async (req, res, next) => {
  const { state } = req.query;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: state || undefined,
  })(req, res, next);
});

export const googleCallback = asyncHandler(async (req, res, next) => {
  const { state, error, error_description } = req.query;

  let parsedState = {};
  try {
    parsedState = state ? JSON.parse(state) : {};
  } catch {
    parsedState = {};
  }

  if (error) {
    console.log("Google OAuth Error (App):", error, error_description);

    if (parsedState.state) {
      const errorUrl = `genmeta://auth?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || "Authentication cancelled")}&state=${encodeURIComponent(parsedState.state)}`;
      return res.send(
        renderOAuthResultHtml({
          success: false,
          title: "Authentication Cancelled",
          subtitle: "Google sign-in was cancelled. Redirecting you back to GenMeta...",
          redirectUrl: errorUrl,
        })
      );
    }
    throw new ApiError(401, `Google Auth Failed: ${error}`);
  }

  passport.authenticate("google", { session: false }, async (err, user) => {
    try {
      if (err || !user) {
        if (parsedState.state) {
          const errorUrl = `genmeta://auth?error=auth_failed&state=${encodeURIComponent(parsedState.state)}`;
          return res.send(
            renderOAuthResultHtml({
              success: false,
              title: "Authentication Failed",
              subtitle: "We couldn't verify your Google account. Returning to GenMeta...",
              redirectUrl: errorUrl,
            })
          );
        }
        throw new ApiError(401, "Google Authentication Failed");
      }

      const accessToken = user.generateAccessToken();

      if (parsedState.state) {
        const redirectUrl = `genmeta://auth?token=${encodeURIComponent(accessToken)}&state=${encodeURIComponent(parsedState.state)}`;
        return res.send(
          renderOAuthResultHtml({
            success: true,
            title: "Signed In Successfully",
            subtitle: `Welcome, ${user.name || user.email}! Returning you to the GenMeta desktop app...`,
            redirectUrl,
          })
        );
      }

      return new ApiResponse(200, true, "Google authentication successful", {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
      }).send(res);
    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

export const appUserLogin = asyncHandler(async (req, res) => {
  const { email, password, replaceDeviceId } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
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

  if (!user.isVerified) {
    throw new ApiError(
      403,
      "Your email address is not verified. Please verify your email on the web portal first.",
      [],
      "",
      { code: "EMAIL_NOT_VERIFIED" }
    );
  }

  if (!user.loginProvider.includes("email")) {
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
    throw new ApiError(401, "Invalid email or password", [], "", {
      code: "INVALID_CREDENTIALS",
    });
  }

  const appUserDoc = await findOrCreateAppUser(user);

  if (!appUserDoc.isValid()) {
    if (appUserDoc.status === "suspended") {
      throw new ApiError(403, "Your account has been suspended. Please contact support.", [], "", {
        code: "ACCOUNT_SUSPENDED",
      });
    }
    throw new ApiError(403, "Your app user account is currently inactive.", [], "", {
      code: "ACCOUNT_INACTIVE",
    });
  }

  const deviceMeta = extractDeviceMeta(req);
  const deviceResult = appUserDoc.registerOrUpdateDevice(deviceMeta, {
    replaceDeviceId: replaceDeviceId || null,
  });

  if (!deviceResult.allowed) {
    const deviceChallengeToken = createDeviceChallengeToken(user, appUserDoc, deviceMeta);
    throw new ApiError(
      403,
      `Device limit reached (${deviceResult.maxDevices}/${deviceResult.maxDevices} devices active). Please deactivate an existing device to continue.`,
      [],
      "",
      {
        code: "DEVICE_LIMIT_REACHED",
        data: {
          code: "DEVICE_LIMIT_REACHED",
          maxDevices: deviceResult.maxDevices,
          devices: deviceResult.devices,
          currentDevice: deviceMeta,
          deviceChallengeToken,
        },
      }
    );
  }

  await appUserDoc.save();
  const account = await buildAppAccountPayload(appUserDoc, user, deviceMeta);

  return new ApiResponse(200, true, "Login successful", {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      role: user.role,
    },
    appUserKey: appUserDoc.key,
    apiKey: appUserDoc.key,
    account,
    devices: deviceResult.devices,
    maxDevices: deviceResult.maxDevices,
  }).send(res);
});

export const verifyGoogle = asyncHandler(async (req, res) => {
  const user = req.user;
  const { replaceDeviceId } = req.body || {};
  const appUserDoc = await findOrCreateAppUser(user);

  if (!appUserDoc.isValid()) {
    if (appUserDoc.status === "suspended") {
      throw new ApiError(403, "Your account has been suspended. Please contact support.", [], "", {
        code: "ACCOUNT_SUSPENDED",
      });
    }
    throw new ApiError(403, "Your app user account is currently inactive.", [], "", {
      code: "ACCOUNT_INACTIVE",
    });
  }

  const deviceMeta = extractDeviceMeta(req);
  const deviceResult = appUserDoc.registerOrUpdateDevice(deviceMeta, {
    replaceDeviceId: replaceDeviceId || null,
  });

  if (!deviceResult.allowed) {
    const deviceChallengeToken = createDeviceChallengeToken(user, appUserDoc, deviceMeta);
    throw new ApiError(
      403,
      `Device limit reached (${deviceResult.maxDevices}/${deviceResult.maxDevices} devices active). Please deactivate an existing device to continue.`,
      [],
      "",
      {
        code: "DEVICE_LIMIT_REACHED",
        data: {
          code: "DEVICE_LIMIT_REACHED",
          maxDevices: deviceResult.maxDevices,
          devices: deviceResult.devices,
          currentDevice: deviceMeta,
          deviceChallengeToken,
        },
      }
    );
  }

  await appUserDoc.save();
  const account = await buildAppAccountPayload(appUserDoc, user, deviceMeta);

  return new ApiResponse(200, true, "Login successful", {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      role: user.role,
    },
    appUserKey: appUserDoc.key,
    apiKey: appUserDoc.key,
    account,
    devices: deviceResult.devices,
    maxDevices: deviceResult.maxDevices,
  }).send(res);
});

export const replaceDeviceAndLogin = asyncHandler(async (req, res) => {
  const { deviceChallengeToken, removeDeviceId } = req.body;

  if (!deviceChallengeToken || !removeDeviceId) {
    throw new ApiError(400, "Device challenge token and target device ID are required");
  }

  let decoded;
  try {
    decoded = jwt.verify(deviceChallengeToken, config.access_token_secret);
  } catch {
    throw new ApiError(
      401,
      "Device authorization session expired. Please sign in again.",
      [],
      "",
      { code: "CHALLENGE_EXPIRED" }
    );
  }

  const targetAppUserId = decoded.appUserId;
  const targetKey = decoded.appUserKey;
  if (decoded.purpose !== "device_replace" || (!targetAppUserId && !targetKey)) {
    throw new ApiError(401, "Invalid device challenge token");
  }

  const appUserDoc = await (
    targetAppUserId
      ? AppUser.findById(targetAppUserId)
      : AppUser.findOne({ key: targetKey })
  ).populate("userId", "name email avatar role isDisabled");

  if (!appUserDoc) {
    throw new ApiError(404, "App user profile not found");
  }

  const user = appUserDoc.userId;
  if (user?.isDisabled || appUserDoc.status === "suspended" || !appUserDoc.isActive) {
    throw new ApiError(403, "Account is suspended or disabled", [], "", {
      code: "ACCOUNT_SUSPENDED",
    });
  }

  const deviceMeta = extractDeviceMeta(req);
  const deviceResult = appUserDoc.registerOrUpdateDevice(deviceMeta, {
    replaceDeviceId: removeDeviceId,
  });

  if (!deviceResult.allowed) {
    throw new ApiError(
      403,
      "Could not activate this device. Please select a valid active device to replace.",
      [],
      "",
      {
        code: "DEVICE_LIMIT_REACHED",
        data: {
          code: "DEVICE_LIMIT_REACHED",
          maxDevices: deviceResult.maxDevices,
          devices: deviceResult.devices,
          currentDevice: deviceMeta,
          deviceChallengeToken,
        },
      }
    );
  }

  await appUserDoc.save();
  const account = await buildAppAccountPayload(appUserDoc, user, deviceMeta);

  return new ApiResponse(200, true, "Device activated and login successful", {
    user: {
      _id: user?._id || appUserDoc.userId,
      name: user?.name || appUserDoc.username || "User",
      email: user?.email || appUserDoc.username,
      avatar: user?.avatar || null,
      role: user?.role || "user",
    },
    appUserKey: appUserDoc.key,
    apiKey: appUserDoc.key,
    account,
    devices: deviceResult.devices,
    maxDevices: deviceResult.maxDevices,
  }).send(res);
});

export const appUserLogout = asyncHandler(async (req, res) => {
  const key = extractAppUserKey(req);
  const deviceMeta = extractDeviceMeta(req);
  const releaseDevice = req.body?.releaseDevice !== false;

  if (key && deviceMeta.deviceId && releaseDevice) {
    const appUserDoc = await AppUser.findOne({ key });
    if (appUserDoc) {
      appUserDoc.removeDevice(deviceMeta.deviceId);
      await appUserDoc.save();
    }
  }

  return new ApiResponse(200, true, "Logged out successfully").send(res);
});

/* -------------------------------------------------------------------------- */
/*                    Admin App User Management Endpoints                     */
/* -------------------------------------------------------------------------- */

function toUtcDateKey(date) {
  return new Date(date).toISOString().split("T")[0];
}

function toUtcMonthKey(date) {
  return new Date(date).toISOString().slice(0, 7);
}

function getMapCount(mapOrObj, key) {
  if (!mapOrObj) return 0;
  if (typeof mapOrObj.get === "function") {
    return Number(mapOrObj.get(key)) || 0;
  }
  return Number(mapOrObj[key]) || 0;
}

async function resolvePlanName(plan) {
  const planType = plan?.type || PLAN_TYPES.FREE;
  const planId = plan?.id || null;
  if (plan?.name) return plan.name;

  if (planId && mongoose.Types.ObjectId.isValid(planId)) {
    const pricingDoc = await AppPricing.findById(planId).select("name").lean();
    if (pricingDoc?.name) {
      return pricingDoc.name;
    }
  }

  if (planType === PLAN_TYPES.SUBSCRIPTION) return "Subscription";
  if (planType === PLAN_TYPES.CREDIT) return "Credit Pack";
  return "Free Tier";
}

function computeFutureExpiry(days, baseDate = new Date()) {
  const parsed = Number(days);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  const expiryDate = new Date(baseDate);
  expiryDate.setDate(expiryDate.getDate() + Math.round(parsed));
  expiryDate.setHours(23, 59, 59, 999);
  return expiryDate;
}

async function createManualPaymentRecord({
  userId,
  plan,
  amount,
  adminUser,
  note,
}) {
  const trxSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  const ts = Date.now();
  return AppPayment.create({
    userId,
    paymentID: `MANUAL-PAY-${ts}-${trxSuffix}`,
    trxID: `MANUAL-${ts}-${trxSuffix}`,
    gateway: PAYMENT_GATEWAYS.MANUAL,
    plan: {
      id: plan.id || plan.type,
      type: plan.type,
      name:
        plan.name ||
        (plan.type === PLAN_TYPES.SUBSCRIPTION ? "Subscription" : "Credit Pack"),
    },
    amount: Math.max(0, Number(amount) || 0),
    currency: "BDT",
    status: "Completed",
    paymentDetails: {
      source: "admin_manual",
      recordedBy: adminUser?._id?.toString() || null,
      recordedByEmail: adminUser?.email || null,
      note: note || "Manual admin plan assignment",
    },
  });
}

function serializeAppUserSummary(appDoc) {
  const { key: _omitKey, ...obj } = appDoc.toObject();
  return {
    ...obj,
    credit: obj.credit === Infinity || obj.credit === null ? null : obj.credit ?? 0,
  };
}

/**
 * CREATE a new App User (optionally creating the User account and recording a manual payment)
 */
export const createAppUser = asyncHandler(async (req, res) => {
  const {
    username,
    name,
    password,
    createAccountIfMissing = false,
    isVerified = true,
    planId = null,
    plan = PLAN_TYPES.FREE,
    expiryDays,
    initialCredit,
    credit: explicitCredit,
    maxDevices = 2,
    recordPayment = false,
    paymentAmount,
    paymentNote,
    reason,
  } = req.body;

  if (!username) {
    throw new ApiError(400, "Username (email) is required.");
  }

  const normalizedEmail = username.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });
  let userCreated = false;

  if (!user) {
    if (!createAccountIfMissing) {
      throw new ApiError(
        404,
        "No user found with the provided email. Enable 'Create new platform account' to register and provision them together."
      );
    }
    if (!name || name.trim().length < 2) {
      throw new ApiError(400, "Full name (at least 2 characters) is required.");
    }
    if (!password || password.length < 8) {
      throw new ApiError(400, "Password (at least 8 characters) is required.");
    }

    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      isVerified: Boolean(isVerified),
      loginProvider: ["email"],
      role: "user",
    });
    userCreated = true;
  }

  const existingAppUser = await AppUser.findOne({ userId: user._id });
  if (existingAppUser) {
    throw new ApiError(400, "This user already has an App User profile.");
  }

  let selectedPricing = null;
  if (planId) {
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      throw new ApiError(400, "Invalid pricing plan ID.");
    }
    selectedPricing = await AppPricing.findById(planId).lean();
    if (!selectedPricing) {
      throw new ApiError(404, "Selected pricing plan not found.");
    }
  }

  const rawPlanObj = typeof plan === "object" && plan !== null ? plan : { type: plan };
  const planType = selectedPricing?.type || rawPlanObj.type || PLAN_TYPES.FREE;

  if (!Object.values(PLAN_TYPES).includes(planType)) {
    throw new ApiError(
      400,
      "Invalid plan type. Must be 'free', 'credit', or 'subscription'."
    );
  }

  const resolvedPlanName =
    selectedPricing?.name ||
    rawPlanObj.name ||
    (planType === PLAN_TYPES.SUBSCRIPTION
      ? "Subscription"
      : planType === PLAN_TYPES.CREDIT
      ? "Credit Pack"
      : "Free Tier");

  const planObject = {
    type: planType,
    id: selectedPricing ? selectedPricing._id.toString() : rawPlanObj.id || null,
    name: resolvedPlanName,
  };

  const now = new Date();
  const today = toUtcDateKey(now);
  const currentMonth = toUtcMonthKey(now);

  let resolvedCredit = 5;
  let expiresAt = undefined;
  const requestedCredit =
    explicitCredit !== undefined ? explicitCredit : initialCredit;

  if (planType === PLAN_TYPES.FREE) {
    resolvedCredit =
      requestedCredit !== undefined ? Math.max(0, parseInt(requestedCredit, 10) || 0) : 5;
  } else if (planType === PLAN_TYPES.CREDIT) {
    resolvedCredit =
      requestedCredit !== undefined
        ? Math.max(0, parseInt(requestedCredit, 10) || 0)
        : selectedPricing?.credit || 100;
    const days =
      expiryDays !== undefined ? expiryDays : selectedPricing?.planDuration;
    expiresAt = computeFutureExpiry(days, now);
  } else if (planType === PLAN_TYPES.SUBSCRIPTION) {
    resolvedCredit = Infinity;
    const days =
      expiryDays !== undefined
        ? expiryDays
        : selectedPricing?.planDuration || 30;
    expiresAt = computeFutureExpiry(days > 0 ? days : 30, now);
  }

  const newAppUser = new AppUser({
    userId: user._id,
    username: normalizedEmail,
    key: generateAppUserKey(),
    plan: planObject,
    expiresAt,
    credit: resolvedCredit,
    maxDevices: Math.min(20, Math.max(1, parseInt(maxDevices, 10) || 2)),
    isActive: true,
    status: "active",
    lastCreditRefresh: today,
    lastPlanChange: now,
    planHistory: [
      {
        planType,
        changedAt: now,
        reason: reason || (selectedPricing ? `admin_created:${selectedPricing.name}` : "admin_created"),
      },
    ],
    monthlyProcess: new Map([[currentMonth, 0]]),
    dailyProcess: new Map([[today, 0]]),
  });

  await newAppUser.save();

  let paymentRecorded = null;
  if (recordPayment && planType !== PLAN_TYPES.FREE) {
    const defaultPrice =
      selectedPricing?.discountPrice && selectedPricing.discountPrice > 0
        ? selectedPricing.discountPrice
        : selectedPricing?.basePrice ?? 0;
    const finalAmount =
      paymentAmount !== undefined ? Number(paymentAmount) : defaultPrice;

    paymentRecorded = await createManualPaymentRecord({
      userId: user._id,
      plan: planObject,
      amount: finalAmount,
      adminUser: req.user,
      note: paymentNote || "Manual payment recorded during app user creation",
    });
  }

  return new ApiResponse(201, true, "App user created successfully.", {
    appUserId: newAppUser._id.toString(),
    username: newAppUser.username,
    userId: user._id.toString(),
    plan: newAppUser.plan,
    expiresAt: newAppUser.expiresAt || null,
    isActive: newAppUser.isActive,
    maxDevices: newAppUser.maxDevices,
    credit: newAppUser.credit === Infinity ? null : newAppUser.credit,
    userCreated,
    paymentRecorded: paymentRecorded
      ? {
          id: paymentRecorded._id.toString(),
          trxID: paymentRecorded.trxID,
          amount: paymentRecorded.amount,
        }
      : null,
  }).send(res);
});

/**
 * UPDATE / UPGRADE an existing App User's plan, pricing package, credits, devices, or expiry
 */
export const updateAppUser = asyncHandler(async (req, res) => {
  const {
    appUserId,
    userId,
    username,
    key,
    planId = null,
    plan,
    upgradeMode = "replace",
    expiryDays,
    credit,
    maxDevices,
    reactivate = false,
    recordPayment = false,
    paymentAmount,
    paymentNote,
    triggerReferralReward = false,
    reason,
  } = req.body;

  if (!appUserId && !userId && !username && !key) {
    throw new ApiError(400, "userId, appUserId, or username is required.");
  }

  const appDoc = await resolveAdminAppUser(
    { appUserId, userId, username, key },
    { createIfMissing: true }
  );

  if (!appDoc) {
    throw new ApiError(404, "App user not found.");
  }

  let selectedPricing = null;
  if (planId) {
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      throw new ApiError(400, "Invalid pricing plan ID.");
    }
    selectedPricing = await AppPricing.findById(planId).lean();
    if (!selectedPricing) {
      throw new ApiError(404, "Selected pricing plan not found.");
    }
  }

  const hasPlanUpdate = Boolean(selectedPricing || plan);
  if (
    !hasPlanUpdate &&
    expiryDays === undefined &&
    credit === undefined &&
    maxDevices === undefined &&
    !reactivate
  ) {
    throw new ApiError(
      400,
      "Provide a plan, pricing package, expiryDays, credit, maxDevices, or reactivate flag."
    );
  }

  const now = new Date();
  const today = toUtcDateKey(now);
  const currentMonth = toUtcMonthKey(now);
  const previousPlanType = appDoc.plan?.type || PLAN_TYPES.FREE;

  const rawPlanObj =
    typeof plan === "object" && plan !== null ? plan : plan ? { type: plan } : null;

  const targetPlanType =
    selectedPricing?.type || rawPlanObj?.type || previousPlanType;

  if (!Object.values(PLAN_TYPES).includes(targetPlanType)) {
    throw new ApiError(
      400,
      "Invalid plan type. Must be 'free', 'credit', or 'subscription'."
    );
  }

  if (hasPlanUpdate) {
    const targetPlanName =
      selectedPricing?.name ||
      rawPlanObj?.name ||
      (targetPlanType === PLAN_TYPES.SUBSCRIPTION
        ? "Subscription"
        : targetPlanType === PLAN_TYPES.CREDIT
        ? "Credit Pack"
        : "Free Tier");

    appDoc.plan = {
      type: targetPlanType,
      id: selectedPricing
        ? selectedPricing._id.toString()
        : rawPlanObj?.id || null,
      name: targetPlanName,
    };
    appDoc.lastPlanChange = now;

    if (!appDoc.planHistory) appDoc.planHistory = [];
    appDoc.planHistory.push({
      planType: targetPlanType,
      changedAt: now,
      reason:
        reason ||
        (selectedPricing
          ? `admin_upgrade:${selectedPricing.name}`
          : "admin_manual_update"),
    });
  }

  if (targetPlanType === PLAN_TYPES.FREE) {
    appDoc.expiresAt = undefined;
    appDoc.credit = credit !== undefined ? Math.max(0, parseInt(credit, 10) || 0) : 5;
    appDoc.lastCreditRefresh = today;
    if (!appDoc.dailyProcess) appDoc.dailyProcess = new Map();
    if (!appDoc.monthlyProcess) appDoc.monthlyProcess = new Map();
    if (!appDoc.dailyProcess.has(today)) appDoc.dailyProcess.set(today, 0);
    if (!appDoc.monthlyProcess.has(currentMonth)) {
      appDoc.monthlyProcess.set(currentMonth, 0);
    }
  } else if (targetPlanType === PLAN_TYPES.SUBSCRIPTION) {
    appDoc.credit = Infinity;
    const days =
      expiryDays !== undefined
        ? Number(expiryDays)
        : selectedPricing?.planDuration;

    if (days !== undefined && Number(days) > 0) {
      const canExtend =
        upgradeMode === "extend" &&
        previousPlanType === PLAN_TYPES.SUBSCRIPTION &&
        appDoc.expiresAt &&
        new Date(appDoc.expiresAt) > now;
      const baseDate = canExtend ? new Date(appDoc.expiresAt) : now;
      appDoc.expiresAt = computeFutureExpiry(days, baseDate);
    } else if (!appDoc.expiresAt || new Date(appDoc.expiresAt) <= now) {
      appDoc.expiresAt = computeFutureExpiry(30, now);
    }
  } else if (targetPlanType === PLAN_TYPES.CREDIT) {
    const resolvedCreditAmount =
      credit !== undefined
        ? Math.max(0, parseInt(credit, 10) || 0)
        : selectedPricing?.credit;

    if (resolvedCreditAmount !== undefined) {
      if (upgradeMode === "extend" && previousPlanType === PLAN_TYPES.CREDIT) {
        const currentFinite = Number.isFinite(appDoc.credit) ? appDoc.credit : 0;
        appDoc.credit = currentFinite + resolvedCreditAmount;
      } else {
        appDoc.credit = resolvedCreditAmount;
      }
    } else if (!Number.isFinite(appDoc.credit)) {
      appDoc.credit = 100;
    }

    const days =
      expiryDays !== undefined
        ? Number(expiryDays)
        : selectedPricing?.planDuration;
    if (days !== undefined) {
      if (Number(days) <= 0) {
        appDoc.expiresAt = undefined;
      } else {
        const canExtend =
          upgradeMode === "extend" &&
          previousPlanType === PLAN_TYPES.CREDIT &&
          appDoc.expiresAt &&
          new Date(appDoc.expiresAt) > now;
        const baseDate = canExtend ? new Date(appDoc.expiresAt) : now;
        appDoc.expiresAt = computeFutureExpiry(days, baseDate);
      }
    }
  }

  if (maxDevices !== undefined) {
    appDoc.maxDevices = Math.min(20, Math.max(1, parseInt(maxDevices, 10) || 2));
  }

  if (reactivate) {
    appDoc.isActive = true;
    appDoc.status = "active";
    appDoc.suspendedAt = null;
  }

  await appDoc.save();

  let paymentRecorded = null;
  if (recordPayment && appDoc.plan?.type !== PLAN_TYPES.FREE) {
    const defaultPrice =
      selectedPricing?.discountPrice && selectedPricing.discountPrice > 0
        ? selectedPricing.discountPrice
        : selectedPricing?.basePrice ?? 0;
    const finalAmount =
      paymentAmount !== undefined ? Number(paymentAmount) : defaultPrice;

    paymentRecorded = await createManualPaymentRecord({
      userId: appDoc.userId,
      plan: appDoc.plan,
      amount: finalAmount,
      adminUser: req.user,
      note: paymentNote || "Manual plan upgrade by administrator",
    });

    if (triggerReferralReward && appDoc.userId) {
      await planService.processReferralReward(appDoc.userId, {
        paymentId: paymentRecorded._id,
      });
    }
  }

  if (appDoc.userId) {
    notificationService
      .notifyUser({
        recipientId: appDoc.userId,
        type: "plan.admin_updated",
        category: NOTIFICATION_CATEGORIES.PLAN,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        title: "Plan Updated by Admin",
        message: `An administrator updated your GenMeta plan to "${appDoc.plan?.name || appDoc.plan?.type || "Updated Plan"}".`,
        actionUrl: "/dashboard",
        actionLabel: "View Dashboard",
        metadata: {
          planType: appDoc.plan?.type,
          planName: appDoc.plan?.name,
        },
      })
      .catch(() => {});
  }

  return new ApiResponse(200, true, "App user updated successfully", {
    appUser: serializeAppUserSummary(appDoc),
    paymentRecorded: paymentRecorded
      ? {
          id: paymentRecorded._id.toString(),
          trxID: paymentRecorded.trxID,
          amount: paymentRecorded.amount,
        }
      : null,
  }).send(res);
});

/**
 * DELETE an App User by userId, appUserId, or username
 */
export const deleteAppUser = asyncHandler(async (req, res) => {
  const rawId = req.params.identifier || req.params.username;

  if (!rawId) {
    throw new ApiError(400, "User ID or username is required");
  }

  let decoded = rawId;
  try {
    decoded = decodeURIComponent(rawId).trim();
  } catch {
    decoded = String(rawId).trim();
  }

  const appDoc = mongoose.Types.ObjectId.isValid(decoded)
    ? await AppUser.findOneAndDelete({
        $or: [{ userId: decoded }, { _id: decoded }],
      })
    : await AppUser.findOneAndDelete({
        username: decoded.toLowerCase().trim(),
      });

  if (!appDoc) {
    throw new ApiError(404, "App user not found");
  }

  return new ApiResponse(200, true, "App user deleted successfully").send(res);
});

/**
 * RESET allowed device bindings for an App User (all devices or a single deviceId)
 */
export const resetDevice = asyncHandler(async (req, res) => {
  const { appUserId, userId, username, key, deviceId } = req.body;

  if (!appUserId && !userId && !username && !key) {
    throw new ApiError(400, "userId, appUserId, or username is required.");
  }

  const appDoc = await resolveAdminAppUser({ appUserId, userId, username, key });
  if (!appDoc) {
    throw new ApiError(404, "App user not found.");
  }

  if (deviceId) {
    const removed = appDoc.removeDevice(deviceId);
    if (!removed) {
      throw new ApiError(404, "Desktop device not found on this account.");
    }
  } else {
    appDoc.resetAllDevices();
  }
  await appDoc.save();

  if (appDoc.userId) {
    notificationService
      .notifyUser({
        recipientId: appDoc.userId,
        type: "security.devices_reset",
        category: NOTIFICATION_CATEGORIES.SECURITY,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        title: "Desktop Device Binding Reset",
        message: deviceId
          ? "One of your linked desktop devices was removed by an administrator."
          : "All linked desktop devices on your account were reset by an administrator.",
        actionUrl: "/dashboard",
        actionLabel: "Manage Devices",
        metadata: { deviceId: deviceId || null },
      })
      .catch(() => {});
  }

  return new ApiResponse(
    200,
    true,
    deviceId ? "Desktop device removed successfully." : "All devices reset successfully.",
    {
      devices: appDoc.getFormattedDevices(),
      allowedDevices: appDoc.allowedDevices,
    }
  ).send(res);
});

/**
 * SUSPEND or REACTIVATE an App User
 */
export const updateAppUserStatus = asyncHandler(async (req, res) => {
  const { appUserId, userId, username, key, mode } = req.body;

  if ((!appUserId && !userId && !username && !key) || !mode) {
    throw new ApiError(400, "App user identifier and mode are required.");
  }

  const appDoc = await resolveAdminAppUser(
    { appUserId, userId, username, key },
    { createIfMissing: true }
  );
  if (!appDoc) {
    throw new ApiError(404, "App user not found.");
  }

  if (mode === "suspend") {
    if (appDoc.status === "suspended") {
      throw new ApiError(400, "App user is already suspended.");
    }
    appDoc.status = "suspended";
    appDoc.suspendedAt = new Date();
    await appDoc.save();
    if (appDoc.userId) {
      notificationService
        .notifyUser({
          recipientId: appDoc.userId,
          type: "plan.app_suspended",
          category: NOTIFICATION_CATEGORIES.PLAN,
          priority: NOTIFICATION_PRIORITIES.URGENT,
          sendEmail: true,
          title: "Desktop App Access Suspended",
          message:
            "Your GenMeta desktop app license has been suspended by an administrator. Please contact support for details.",
          actionUrl: "/contact",
          actionLabel: "Contact Support",
        })
        .catch(() => {});
    }
    return new ApiResponse(200, true, "App user suspended successfully.").send(res);
  }

  if (mode === "reactivate") {
    if (appDoc.status !== "suspended" && appDoc.isActive) {
      throw new ApiError(400, "App user is not suspended.");
    }
    appDoc.isActive = true;
    appDoc.status = "active";
    appDoc.suspendedAt = null;
    await appDoc.save();
    if (appDoc.userId) {
      notificationService
        .notifyUser({
          recipientId: appDoc.userId,
          type: "plan.app_reactivated",
          category: NOTIFICATION_CATEGORIES.PLAN,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          sendEmail: true,
          title: "Desktop App Access Reactivated",
          message:
            "Your GenMeta desktop app license has been reactivated. You can sign in and resume processing.",
          actionUrl: "/dashboard",
          actionLabel: "Open Dashboard",
        })
        .catch(() => {});
    }
    return new ApiResponse(200, true, "App user reactivated successfully.").send(res);
  }

  throw new ApiError(400, "Invalid mode. Use 'suspend' or 'reactivate'.");
});

/**
 * ADD CREDITS to an App User
 */
export const addCredits = asyncHandler(async (req, res) => {
  const { appUserId, userId, username, key, credits } = req.body;

  if ((!appUserId && !userId && !username && !key) || credits === undefined) {
    throw new ApiError(400, "App user identifier and credits are required.");
  }

  const appDoc = await resolveAdminAppUser(
    { appUserId, userId, username, key },
    { createIfMissing: true }
  );
  if (!appDoc) {
    throw new ApiError(404, "App user not found.");
  }

  appDoc.credit =
    (Number.isFinite(appDoc.credit) ? appDoc.credit : 0) + parseInt(credits, 10);
  await appDoc.save();

  if (appDoc.userId) {
    notificationService
      .notifyUser({
        recipientId: appDoc.userId,
        type: "plan.credits_added",
        category: NOTIFICATION_CATEGORIES.PLAN,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        title: "Credits Added to Your Account",
        message: `${parseInt(credits, 10)} credits were added to your account by an administrator. New balance: ${Number.isFinite(appDoc.credit) ? appDoc.credit : "Unlimited"}.`,
        actionUrl: "/dashboard",
        actionLabel: "View Balance",
        metadata: {
          creditsAdded: parseInt(credits, 10),
          newBalance: Number.isFinite(appDoc.credit) ? appDoc.credit : null,
        },
      })
      .catch(() => {});
  }

  return new ApiResponse(
    200,
    true,
    `${credits} credits added successfully. New balance: ${appDoc.credit}`
  ).send(res);
});

/**
 * GET complete user profile, desktop license, usage telemetry, payments, referrals, and sessions
 */
export const getUserDetailsByAppUser = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  const targetId = req.params.userId || req.params.key;
  if (!targetId) {
    throw new ApiError(400, "User ID is required");
  }

  const now = new Date();
  const isExplicitRefresh =
    req.query.refresh === "true" || req.query.refresh === "1";

  const userSelectFields =
    "name email avatar role isVerified isDisabled loginProvider lastLoginAt passwordChangedAt ipAddress failedLoginAttempts lockUntil referred createdAt updatedAt";

  const userPopulateConfig = {
    path: "userId",
    select: userSelectFields,
    populate: {
      path: "referred",
      select: "referralCode referrer",
      populate: { path: "referrer", select: "name email" },
    },
  };

  let appDoc = null;

  if (mongoose.Types.ObjectId.isValid(targetId)) {
    appDoc = await AppUser.findOne({
      $or: [{ userId: targetId }, { _id: targetId }],
    })
      .populate(userPopulateConfig)
      .exec();

    if (!appDoc) {
      const existingUser = await User.findById(targetId).select(userSelectFields);
      if (existingUser) {
        const created = await findOrCreateAppUser(existingUser);
        appDoc = await AppUser.findById(created._id)
          .populate(userPopulateConfig)
          .exec();
      }
    }
  }

  if (!appDoc) {
    const normalized = String(targetId).toLowerCase().trim();
    appDoc = await AppUser.findOne({
      $or: [{ username: normalized }, { key: targetId }],
    })
      .populate(userPopulateConfig)
      .exec();

    if (!appDoc && normalized.includes("@")) {
      const existingUser = await User.findOne({ email: normalized }).select(
        userSelectFields
      );
      if (existingUser) {
        const created = await findOrCreateAppUser(existingUser);
        appDoc = await AppUser.findById(created._id)
          .populate(userPopulateConfig)
          .exec();
      }
    }
  }

  if (!appDoc) {
    throw new ApiError(404, "App user not found");
  }

  // Reconcile devices, expired paid plans, and daily free credits
  appDoc.syncDevicesList();
  if (appDoc.isActive && appDoc.status === "active") {
    appDoc.isValid();
    appDoc.calculateCredit();
  }
  if (appDoc.isModified()) {
    await appDoc.save();
  }

  const user = appDoc.userId;
  const resolvedUserId = user?._id || appDoc.userId;

  const last7DateKeys = Array.from({ length: 7 }, (_, i) =>
    toUtcDateKey(
      new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (6 - i))
      )
    )
  );
  const last6MonthKeys = Array.from({ length: 6 }, (_, i) =>
    toUtcMonthKey(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1))
    )
  );

  const [
    payments,
    dailyUsageLogs,
    monthlyUsageLogs,
    referralDoc,
    activeSessions,
    activeSessionsCount,
    resolvedPlanName,
  ] = await Promise.all([
    resolvedUserId
      ? AppPayment.find({ userId: resolvedUserId })
          .sort({ createdAt: -1 })
          .select("paymentID trxID gateway plan amount currency status paymentDetails createdAt")
          .lean()
      : [],
    resolvedUserId
      ? ApiUsageLog.find({
          userId: resolvedUserId,
          date: { $in: last7DateKeys },
        })
          .select("date processCount fileCount failedCount")
          .lean()
      : [],
    resolvedUserId
      ? ApiUsageLog.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(resolvedUserId),
              date: { $gte: `${last6MonthKeys[0]}-01` },
            },
          },
          {
            $group: {
              _id: { $substrBytes: ["$date", 0, 7] },
              count: {
                $sum: {
                  $cond: [{ $gt: ["$fileCount", 0] }, "$fileCount", "$processCount"],
                },
              },
              failed: { $sum: { $ifNull: ["$failedCount", 0] } },
            },
          },
        ])
      : [],
    resolvedUserId
      ? Referral.findOne({ referrer: resolvedUserId }).lean()
      : null,
    resolvedUserId
      ? Session.find({
          userId: resolvedUserId,
          revokedAt: null,
          expiresAt: { $gt: now },
        })
          .sort({ lastActiveAt: -1 })
          .limit(10)
          .select("deviceName userAgent ipAddress lastActiveAt createdAt expiresAt")
          .lean()
      : [],
    resolvedUserId
      ? Session.countDocuments({
          userId: resolvedUserId,
          revokedAt: null,
          expiresAt: { $gt: now },
        })
      : 0,
    resolvePlanName(appDoc.plan),
  ]);

  // Usage series
  const dailyLogMap = new Map();
  for (const log of dailyUsageLogs || []) {
    const count =
      log.fileCount && log.fileCount > 0 ? log.fileCount : log.processCount || 0;
    dailyLogMap.set(log.date, {
      count,
      failed: log.failedCount || 0,
    });
  }

  const monthlyLogMap = new Map();
  for (const row of monthlyUsageLogs || []) {
    if (row?._id) {
      monthlyLogMap.set(row._id, {
        count: row.count || 0,
        failed: row.failed || 0,
      });
    }
  }

  const last7DaysProcess = last7DateKeys.map((date) => {
    const logEntry = dailyLogMap.get(date) || { count: 0, failed: 0 };
    return {
      date,
      count: Math.max(getMapCount(appDoc.dailyProcess, date), logEntry.count),
      failed: logEntry.failed,
    };
  });

  const last6MonthProcess = last6MonthKeys.map((month) => {
    const logEntry = monthlyLogMap.get(month) || { count: 0, failed: 0 };
    return {
      month,
      count: Math.max(getMapCount(appDoc.monthlyProcess, month), logEntry.count),
      failed: logEntry.failed,
    };
  });

  const monthlyUsage = {};
  if (appDoc.monthlyProcess && appDoc.monthlyProcess.size > 0) {
    appDoc.monthlyProcess.forEach((count, month) => {
      monthlyUsage[month] = count;
    });
  }
  for (const point of last6MonthProcess) {
    monthlyUsage[point.month] = Math.max(monthlyUsage[point.month] || 0, point.count);
  }

  const todayProcess = last7DaysProcess[last7DaysProcess.length - 1]?.count || 0;
  const currentMonthProcess =
    last6MonthProcess[last6MonthProcess.length - 1]?.count || 0;

  const totalProcess = Math.max(
    appDoc.totalProcess || 0,
    currentMonthProcess,
    todayProcess
  );
  const totalFailedProcess = appDoc.totalFailedProcess || 0;
  const totalAttempted = totalProcess + totalFailedProcess;
  const successRate =
    totalAttempted > 0
      ? Number(((totalProcess / totalAttempted) * 100).toFixed(1))
      : 100;

  const recentFailures = [];
  if (appDoc.failedProcess && appDoc.failedProcess.size > 0) {
    appDoc.failedProcess.forEach((val, date) => {
      recentFailures.push({
        date,
        count: val?.count || 0,
        errorMessages: Array.isArray(val?.errorMessages) ? val.errorMessages : [],
      });
    });
    recentFailures.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Payments & summary
  const formattedPayments = payments.map((payment) => ({
    id: payment._id.toString(),
    _id: payment._id.toString(),
    paymentID: payment.paymentID || "",
    trxID: payment.trxID || "",
    gateway: payment.gateway || "paystation",
    plan: {
      id: payment.plan?.id || "",
      type: payment.plan?.type || "subscription",
      name: payment.plan?.name || payment.plan?.type || "Standard",
    },
    amount: payment.amount || 0,
    currency: payment.currency || "BDT",
    status: payment.status || "Completed",
    note: payment.paymentDetails?.note || null,
    createdAt: payment.createdAt,
  }));

  const totalSpent = formattedPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );
  const paymentSummary = {
    totalSpent,
    totalCount: formattedPayments.length,
    lastPaymentAt: formattedPayments[0]?.createdAt || null,
  };

  // Referral summary
  let referralSummary = {
    exists: false,
    referralCode: null,
    withdrawAccount: null,
    referredCount: 0,
    availableBalance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    pendingWithdrawalsCount: 0,
    pendingWithdrawalsAmount: 0,
  };

  if (referralDoc) {
    const earnedHistory = Array.isArray(referralDoc.earnedHistory)
      ? referralDoc.earnedHistory
      : [];
    const withdrawHistory = Array.isArray(referralDoc.withdrawHistory)
      ? referralDoc.withdrawHistory
      : [];
    const totalEarned = earnedHistory.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const totalWithdrawn = withdrawHistory
      .filter((w) => w.status === WITHDRAWAL_STATUS.COMPLETED)
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
    const pendingList = withdrawHistory.filter(
      (w) => w.status === WITHDRAWAL_STATUS.PENDING
    );
    const pendingWithdrawalsAmount = pendingList.reduce(
      (sum, w) => sum + (Number(w.amount) || 0),
      0
    );

    referralSummary = {
      exists: true,
      referralCode: referralDoc.referralCode || null,
      withdrawAccount: referralDoc.withdrawAccount || null,
      referredCount: Array.isArray(referralDoc.referredUsers)
        ? referralDoc.referredUsers.length
        : 0,
      availableBalance: referralDoc.availableBalance || 0,
      totalEarned,
      totalWithdrawn,
      pendingWithdrawalsCount: pendingList.length,
      pendingWithdrawalsAmount,
    };
  }

  // Account & Plan metadata
  const remainingCredit =
    typeof appDoc.calculateCredit === "function"
      ? appDoc.calculateCredit()
      : appDoc.credit;

  const isValid =
    typeof appDoc.isValid === "function" ? appDoc.isValid() : appDoc.isActive;

  const remainingDays = appDoc.expiresAt
    ? Math.max(
        0,
        Math.ceil((new Date(appDoc.expiresAt) - now) / (1000 * 60 * 60 * 24))
      )
    : null;

  const planType = appDoc.plan?.type || PLAN_TYPES.FREE;
  const isExpired = Boolean(
    (planType === PLAN_TYPES.SUBSCRIPTION || planType === PLAN_TYPES.CREDIT) &&
      appDoc.expiresAt &&
      new Date(appDoc.expiresAt) <= now
  );

  const formattedDevices = appDoc.getFormattedDevices();
  const deviceRemoval = appDoc.getDeviceRemovalStatus(now);
  const rawAppObj = appDoc.toObject();

  const planHistory = Array.isArray(rawAppObj.planHistory)
    ? [...rawAppObj.planHistory].sort(
        (a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0)
      )
    : [];

  const appData = {
    id: appDoc._id.toString(),
    _id: appDoc._id.toString(),
    userId: resolvedUserId?.toString() || "",
    username: appDoc.username,
    expiresAt: appDoc.expiresAt || null,
    remainingDays,
    isExpired,
    isActive: Boolean(appDoc.isActive),
    status: appDoc.status || "active",
    suspendedAt: appDoc.suspendedAt || null,
    plan: {
      type: planType,
      id: appDoc.plan?.id || null,
      name: resolvedPlanName,
    },
    credit:
      planType === PLAN_TYPES.SUBSCRIPTION || remainingCredit === Infinity
        ? null
        : remainingCredit ?? 0,
    remainingCredit:
      planType === PLAN_TYPES.SUBSCRIPTION || remainingCredit === Infinity
        ? null
        : remainingCredit ?? 0,
    lastCreditRefresh: appDoc.lastCreditRefresh || null,
    lastPlanChange: appDoc.lastPlanChange || null,
    planHistory,
    totalProcess,
    totalFailedProcess,
    todayProcess,
    currentMonthProcess,
    successRate,
    last7DaysProcess,
    last6MonthProcess,
    monthlyUsage,
    recentFailures,
    allowedDevices: appDoc.allowedDevices || [],
    devices: formattedDevices,
    maxDevices: appDoc.maxDevices || 2,
    deviceRemoval,
    isValid,
    createdAt: appDoc.createdAt,
    updatedAt: appDoc.updatedAt,
  };

  const referredBy = user?.referred
    ? {
        referralCode: user.referred.referralCode || null,
        referrerName: user.referred.referrer?.name || null,
        referrerEmail: user.referred.referrer?.email || null,
      }
    : null;

  const isLocked = Boolean(
    user?.lockUntil && new Date(user.lockUntil).getTime() > now.getTime()
  );

  const data = {
    user: {
      id: resolvedUserId?.toString() || "",
      name: user?.name || appDoc.username,
      email: user?.email || appDoc.username,
      avatar: user?.avatar || null,
      role: user?.role || "user",
      isVerified: Boolean(user?.isVerified),
      isDisabled: Boolean(user?.isDisabled),
      loginProvider:
        Array.isArray(user?.loginProvider) && user.loginProvider.length > 0
          ? user.loginProvider
          : ["email"],
      lastLoginAt: user?.lastLoginAt || null,
      passwordChangedAt: user?.passwordChangedAt || null,
      ipAddress: user?.ipAddress || null,
      failedLoginAttempts: user?.failedLoginAttempts || 0,
      isLocked,
      referredBy,
      createdAt: user?.createdAt || appDoc.createdAt,
      updatedAt: user?.updatedAt || appDoc.updatedAt,
    },
    appUser: appData,
    payments: formattedPayments,
    paymentSummary,
    referral: referralSummary,
    security: {
      activeSessionsCount,
      sessions: (activeSessions || []).map((s) => ({
        id: s._id.toString(),
        deviceName: s.deviceName || "Web Browser",
        userAgent: s.userAgent || "",
        ipAddress: s.ipAddress || "",
        lastActiveAt: s.lastActiveAt || null,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
    },
    meta: {
      generatedAt: now.toISOString(),
      refreshed: isExplicitRefresh,
    },
  };

  return new ApiResponse(200, true, "User details fetched successfully", data).send(
    res
  );
});

/* -------------------------------------------------------------------------- */
/*                     Desktop App Runtime API Endpoints                      */
/* -------------------------------------------------------------------------- */

/**
 * VALIDATE an App User and check processing permissions (from Desktop App)
 */
export const validateAppUser = asyncHandler(async (req, res) => {
  const key = extractAppUserKey(req);
  const deviceMeta = extractDeviceMeta(req);
  const { deviceId } = deviceMeta;
  const version = req.header("x-app-version") || deviceMeta.appVersion;

  if (!version) {
    throw new ApiError(426, "Please update your app. A new version is available.", [], "", {
      code: "APP_UPDATE_REQUIRED",
    });
  }

  if (compareVersions(version, config.minimumRequiredAppVersion) < 0) {
    throw new ApiError(426, "Please update your app. A new version is available.", [], "", {
      code: "APP_UPDATE_REQUIRED",
    });
  }

  const { processCount = 1 } = req.body;

  if (!key) {
    throw new ApiError(400, "App user key is required in headers.");
  }

  if (!deviceId) {
    throw new ApiError(400, "Device ID is required in headers.");
  }

  const count = parseInt(processCount, 10);
  if (isNaN(count) || count < 1) {
    throw new ApiError(400, "Valid process count is required (must be a positive number).");
  }

  const appDoc = await AppUser.findOne({ key });
  if (!appDoc) {
    throw new ApiError(404, "App user not found.");
  }

  if (!appDoc.isValid()) {
    if (appDoc.status === "suspended") {
      throw new ApiError(403, "Account has been suspended.", [], "", {
        code: "ACCOUNT_SUSPENDED",
      });
    }
    throw new ApiError(403, "App user account is not valid or active.", [], "", {
      code: "ACCOUNT_INACTIVE",
    });
  }

  const deviceResult = appDoc.registerOrUpdateDevice(deviceMeta);
  if (!deviceResult.allowed) {
    throw new ApiError(
      403,
      `This account is already used on ${deviceResult.maxDevices} devices. No more devices allowed.`,
      [],
      "",
      {
        code: "DEVICE_LIMIT_REACHED",
        data: {
          code: "DEVICE_LIMIT_REACHED",
          devices: deviceResult.devices,
          maxDevices: deviceResult.maxDevices,
        },
      }
    );
  }
  await appDoc.save();

  if (!appDoc.canProcess(count)) {
    const limit = appDoc.plan.type === PLAN_TYPES.FREE ? 5 : appDoc.credit;
    throw new ApiError(429, `You need ${count} credits but have ${limit} remaining.`);
  }

  const now = new Date();
  const expiresIn =
    (appDoc.plan.type === PLAN_TYPES.CREDIT || appDoc.plan.type === PLAN_TYPES.SUBSCRIPTION) &&
    appDoc.expiresAt
      ? Math.max(0, Math.floor((appDoc.expiresAt - now) / (1000 * 60 * 60 * 24)))
      : null;

  const isCreditPlan = appDoc.plan.type === PLAN_TYPES.CREDIT;
  const aiApiSecret = isCreditPlan ? config.encoderKey : null;
  const encryptedKeyDoc = isCreditPlan ? await AiAPI.findOne({ isActive: true }) : null;
  const aiApiKey =
    isCreditPlan && encryptedKeyDoc
      ? resolveAiApiKeyForClient(encryptedKeyDoc.ai_api_key)
      : null;

  return new ApiResponse(200, true, "Account is valid and process allowed.", {
    appUserKey: appDoc.key,
    key: appDoc.key,
    username: appDoc.username,
    plan: appDoc.plan,
    totalProcess: appDoc.totalProcess,
    expiresAt:
      appDoc.plan.type === PLAN_TYPES.CREDIT || appDoc.plan.type === PLAN_TYPES.SUBSCRIPTION
        ? appDoc.expiresAt
        : null,
    expiresIn,
    aiApiSecret,
    aiApiKey,
    deviceId,
    devices: deviceResult.devices,
    maxDevices: deviceResult.maxDevices,
    remainingCredit: appDoc.credit === Infinity ? null : appDoc.credit,
  }).send(res);
});

/**
 * GET current stats for an App User (from Desktop App)
 */
export const getAppUserStats = asyncHandler(async (req, res) => {
  const key = extractAppUserKey(req);

  if (!key) {
    throw new ApiError(400, "App user key is required.");
  }

  const appDoc = await AppUser.findOne({ key }).populate("userId", "name email avatar");
  if (!appDoc) {
    throw new ApiError(404, "App user not found.", [], "", {
      code: "APP_USER_NOT_FOUND",
    });
  }

  const deviceMeta = extractDeviceMeta(req);
  if (deviceMeta.deviceId) {
    const deviceResult = appDoc.registerOrUpdateDevice(deviceMeta);
    if (!deviceResult.allowed) {
      throw new ApiError(
        403,
        `This device is no longer authorized. Your account is active on ${deviceResult.maxDevices} other devices.`,
        [],
        "",
        {
          code: "DEVICE_REVOKED",
          data: {
            code: "DEVICE_REVOKED",
            devices: deviceResult.devices,
            maxDevices: deviceResult.maxDevices,
          },
        }
      );
    }
  }

  const isValid = appDoc.isValid();
  await appDoc.save();

  const now = new Date();
  const expiresIn =
    (appDoc.plan.type === PLAN_TYPES.CREDIT || appDoc.plan.type === PLAN_TYPES.SUBSCRIPTION) &&
    appDoc.expiresAt
      ? Math.max(0, Math.floor((appDoc.expiresAt - now) / (1000 * 60 * 60 * 24)))
      : null;

  const isCreditPlan = appDoc.plan.type === PLAN_TYPES.CREDIT;
  const aiApiSecret = isCreditPlan ? config.encoderKey : null;
  const encryptedKeyDoc = isCreditPlan ? await AiAPI.findOne({ isActive: true }) : null;
  const aiApiKey =
    isCreditPlan && encryptedKeyDoc
      ? resolveAiApiKeyForClient(encryptedKeyDoc.ai_api_key)
      : null;

  const remainingCredit = appDoc.calculateCredit();
  const devices = appDoc.getFormattedDevices(
    deviceMeta.deviceId || null,
    deviceMeta.fingerprint || null
  );

  return new ApiResponse(200, true, "User stats retrieved successfully", {
    appUserKey: appDoc.key,
    key: appDoc.key,
    plan: appDoc.plan,
    planType: appDoc.plan?.type || PLAN_TYPES.FREE,
    planId: appDoc.plan?.id || null,
    username: appDoc.username,
    status: appDoc.status,
    isValid,
    expiresAt:
      appDoc.plan.type === PLAN_TYPES.CREDIT || appDoc.plan.type === PLAN_TYPES.SUBSCRIPTION
        ? appDoc.expiresAt
        : null,
    expiresIn,
    credit: remainingCredit === Infinity ? null : remainingCredit,
    totalProcess: appDoc.totalProcess,
    aiApiSecret,
    aiApiKey,
    devices,
    maxDevices: appDoc.maxDevices || 2,
    currentDeviceId: deviceMeta.deviceId || null,
    user: {
      name: appDoc.userId?.name,
      email: appDoc.userId?.email,
      avatar: appDoc.userId?.avatar || null,
    },
  }).send(res);
});

/**
 * GET registered devices for an App User (from Desktop App)
 */
export const getAppDevices = asyncHandler(async (req, res) => {
  const key = extractAppUserKey(req);
  if (!key) {
    throw new ApiError(400, "App user key is required.");
  }

  const appDoc = await AppUser.findOne({ key });
  if (!appDoc) {
    throw new ApiError(404, "App user not found.");
  }

  const deviceMeta = extractDeviceMeta(req);
  const devices = appDoc.getFormattedDevices(
    deviceMeta.deviceId || null,
    deviceMeta.fingerprint || null
  );

  return new ApiResponse(200, true, "Registered devices retrieved", {
    devices,
    maxDevices: appDoc.maxDevices || 2,
    currentDeviceId: deviceMeta.deviceId || null,
  }).send(res);
});

/**
 * REMOVE a specific registered device from an App User (from Desktop App)
 */
export const removeAppDevice = asyncHandler(async (req, res) => {
  const key = extractAppUserKey(req);
  const targetDeviceId = req.params.deviceId || req.body?.deviceId;

  if (!key) {
    throw new ApiError(400, "App user key is required.");
  }
  if (!targetDeviceId) {
    throw new ApiError(400, "Target device ID is required.");
  }

  const appDoc = await AppUser.findOne({ key });
  if (!appDoc) {
    throw new ApiError(404, "App user not found.");
  }

  const callerMeta = extractDeviceMeta(req);
  if (callerMeta.deviceId) {
    const callerDevice = appDoc.findMatchingDevice(callerMeta.deviceId, callerMeta.fingerprint);
    if (!callerDevice && appDoc.devices.length >= (appDoc.maxDevices || 2)) {
      throw new ApiError(403, "Unauthorized device cannot remove other devices.", [], "", {
        code: "DEVICE_REVOKED",
      });
    }
  }

  const removed = appDoc.removeDevice(targetDeviceId);
  if (!removed) {
    throw new ApiError(404, "Device not found on this account.");
  }

  await appDoc.save();

  const devices = appDoc.getFormattedDevices(
    callerMeta.deviceId || null,
    callerMeta.fingerprint || null
  );

  return new ApiResponse(200, true, "Device removed successfully", {
    removedDeviceId: targetDeviceId,
    devices,
    maxDevices: appDoc.maxDevices || 2,
    currentDeviceId: callerMeta.deviceId || null,
  }).send(res);
});

async function upsertApiUsageLog(
  appDoc,
  { creditUsed = 0, fileCount = 0, failed = 0, errorMsg = "" } = {}
) {
  const today = new Date().toISOString().split("T")[0];
  const parsedErrors = parseErrorMessages(errorMsg);

  try {
    const updateDoc = {
      $setOnInsert: { appUserId: appDoc._id, userId: appDoc.userId, date: today },
      $inc: { processCount: creditUsed, fileCount, failedCount: failed },
    };

    if (parsedErrors.length > 0) {
      updateDoc.$push = {
        errors: {
          $each: parsedErrors,
          $slice: -200,
        },
      };
    }

    if (failed > 0 || parsedErrors.length > 0) {
      updateDoc.$set = {
        errorStatus: PROCESS_ERROR_STATUS.UNRESOLVED,
        lastErrorAt: new Date(),
        resolvedAt: null,
        resolvedBy: null,
      };
    }

    await ApiUsageLog.updateOne(
      { appUserId: appDoc._id, date: today },
      updateDoc,
      { upsert: true }
    );
  } catch (err) {
    console.error("Failed to update ApiUsageLog:", err.message);
  }
}

/**
 * PROCESS usage accounting for an App User (from Desktop App)
 */
export const processAppUsage = asyncHandler(async (req, res) => {
  const key = extractAppUserKey(req);
  const { processCount, processFileCount, failedCount, failedErrors } = req.body;

  if (!key) throw new ApiError(400, "App user key is required in headers.");

  const appDoc = await AppUser.findOne({ key });
  if (!appDoc) throw new ApiError(404, "App user not found.");

  const creditUsed = parseInt(processCount, 10) || 0;
  const fileCount = parseInt(processFileCount, 10) || 0;
  const failed = parseInt(failedCount, 10) || 0;
  const errorMsg = failedErrors || "";

  if (!appDoc.isValid()) {
    if (failed > 0) {
      await logFailedProcess(appDoc, failed, errorMsg);
      await upsertApiUsageLog(appDoc, { failed, errorMsg });
    }
    throw new ApiError(403, "App user account is not valid or active.");
  }

  if (creditUsed > 0) {
    try {
      await appDoc.useCredit(creditUsed, fileCount);
    } catch (error) {
      const effectiveFailed = failed > 0 ? failed : 1;
      await logFailedProcess(appDoc, effectiveFailed, error.message);
      await upsertApiUsageLog(appDoc, {
        failed: effectiveFailed,
        errorMsg: error.message,
      });
      throw new ApiError(429, error.message);
    }
  }

  if (failed > 0) {
    await logFailedProcess(appDoc, failed, errorMsg);
  }

  // Update normalized usage ledger
  await upsertApiUsageLog(appDoc, { creditUsed, fileCount, failed, errorMsg });

  const remainingCredit = appDoc.calculateCredit();

  return new ApiResponse(200, true, "Usage updated successfully", {
    appUserKey: appDoc.key,
    key: appDoc.key,
    plan: appDoc.plan,
    remainingCredit: remainingCredit === Infinity ? null : remainingCredit,
    totalProcess: appDoc.totalProcess,
    dailyProcess: Object.fromEntries(appDoc.dailyProcess || new Map()),
    monthlyProcess: Object.fromEntries(appDoc.monthlyProcess || new Map()),
    totalFailedProcess: appDoc.totalFailedProcess,
    failedProcess: Object.fromEntries(appDoc.failedProcess || new Map()),
  }).send(res);
});

async function logFailedProcess(appDoc, count, errorMessage) {
  const dayKey = new Date().toISOString().split("T")[0];

  if (!appDoc.failedProcess) {
    appDoc.failedProcess = new Map();
  }

  const dayData = appDoc.failedProcess.get(dayKey) || {
    count: 0,
    errorMessages: [],
  };

  dayData.count += count;
  appDoc.totalFailedProcess = (appDoc.totalFailedProcess || 0) + count;

  if (errorMessage && errorMessage.trim()) {
    const errorList = errorMessage
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    dayData.errorMessages.push(...errorList);
  }

  appDoc.failedProcess.set(dayKey, dayData);
  cleanupFailedData(appDoc);
  await appDoc.save();
}

function cleanupFailedData(appDoc) {
  if (!appDoc.failedProcess) return;
  const now = new Date();
  const recentDays = new Set();

  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    recentDays.add(d.toISOString().split("T")[0]);
  }

  for (const k of appDoc.failedProcess.keys()) {
    if (!recentDays.has(k)) {
      appDoc.failedProcess.delete(k);
    }
  }
}
