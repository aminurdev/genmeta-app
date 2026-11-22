import mongoose from "mongoose";
import passport from "passport";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { AiAPI } from "../models/aiApiKey.model.js";
import { AppUser, extractDeviceMeta } from "../models/appUser.model.js";
import { ApiUsageLog } from "../models/apiUsageLog.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/api.error.js";
import { generateAppUserKey, compareVersions } from "../utils/index.js";
import { PLAN_TYPES } from "../constants/index.js";

function extractAppUserKey(req) {
  return (
    req.header("x-app-user-key") ||
    req.header("x-api-key") ||
    req.header("x-app-id") ||
    req.body?.apiKey ||
    req.body?.key ||
    ""
  )
    .toString()
    .trim();
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
    planType === PLAN_TYPES.CREDIT && encryptedKeyDoc ? encryptedKeyDoc.ai_api_key : null;

  const remainingCredit = appDoc.calculateCredit();
  const devices = appDoc.getFormattedDevices(
    deviceMeta.deviceId || null,
    deviceMeta.fingerprint || null
  );
  const maxDevices = appDoc.maxDevices || 2;

  return {
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
    throw new ApiError(403, "Your app license is currently inactive.", [], "", {
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
    apiKey: appUserDoc.key,
    account,
    devices: deviceResult.devices,
    maxDevices: deviceResult.maxDevices,
  }).send(res);
});

export const appKeyDirectLogin = asyncHandler(async (req, res) => {
  const { apiKey, key, replaceDeviceId } = req.body;
  const rawKey = (apiKey || key || extractAppUserKey(req)).toString().trim();

  if (!rawKey) {
    throw new ApiError(400, "License Key is required");
  }

  const appUserDoc = await AppUser.findOne({ key: rawKey }).populate(
    "userId",
    "name email avatar role isDisabled isVerified"
  );

  if (!appUserDoc) {
    throw new ApiError(404, "Invalid License Key. Please check your key and try again.", [], "", {
      code: "INVALID_APP_KEY",
    });
  }

  const user = appUserDoc.userId;
  if (user?.isDisabled) {
    throw new ApiError(403, "Your account has been disabled. Please contact support.", [], "", {
      code: "ACCOUNT_DISABLED",
    });
  }

  if (!appUserDoc.isValid()) {
    if (appUserDoc.status === "suspended") {
      throw new ApiError(403, "Your account has been suspended. Please contact support.", [], "", {
        code: "ACCOUNT_SUSPENDED",
      });
    }
    throw new ApiError(403, "Your app license is not active.", [], "", {
      code: "ACCOUNT_INACTIVE",
    });
  }

  const deviceMeta = extractDeviceMeta(req);
  const deviceResult = appUserDoc.registerOrUpdateDevice(deviceMeta, {
    replaceDeviceId: replaceDeviceId || null,
  });

  if (!deviceResult.allowed) {
    const deviceChallengeToken = createDeviceChallengeToken(
      user || { _id: appUserDoc.userId },
      appUserDoc,
      deviceMeta
    );
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
      _id: user?._id || appUserDoc.userId,
      name: user?.name || appUserDoc.username || "User",
      email: user?.email || appUserDoc.username,
      avatar: user?.avatar || null,
      role: user?.role || "user",
    },
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
    throw new ApiError(403, "Your app license is currently inactive.", [], "", {
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

  const targetKey = decoded.appUserKey;
  if (decoded.purpose !== "device_replace" || !targetKey) {
    throw new ApiError(401, "Invalid device challenge token");
  }

  const appUserDoc = await AppUser.findOne({ key: targetKey }).populate(
    "userId",
    "name email avatar role isDisabled"
  );

  if (!appUserDoc) {
    throw new ApiError(404, "Account license not found");
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

/**
 * CREATE a new App User for an existing registered user
 */
export const createAppUser = asyncHandler(async (req, res) => {
  const { username, expiryDays = 3, plan = PLAN_TYPES.FREE, initialCredit } = req.body;

  if (!username) {
    throw new ApiError(400, "Username (email) is required.");
  }

  const user = await User.findOne({ email: username.toLowerCase().trim() });
  if (!user) {
    throw new ApiError(404, "No user found with the provided email.");
  }

  const userId = user._id;

  const existingAppUser = await AppUser.findOne({ userId });
  if (existingAppUser) {
    throw new ApiError(400, "This user already has an App User profile.");
  }

  const planObject = typeof plan === "object" ? plan : { type: plan };
  const planType = planObject.type || PLAN_TYPES.FREE;

  if (!Object.values(PLAN_TYPES).includes(planType)) {
    throw new ApiError(400, "Invalid plan type. Must be 'free', 'credit', or 'subscription'.");
  }

  let credit = 0;
  let expiresAt = undefined;
  const today = new Date().toISOString().split("T")[0];

  if (planType === PLAN_TYPES.FREE) {
    credit = 5;
  } else if (planType === PLAN_TYPES.CREDIT) {
    credit = initialCredit ? parseInt(initialCredit, 10) : 100;
    if (expiryDays && parseInt(expiryDays, 10) > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays, 10));
      expiryDate.setHours(23, 59, 59, 999);
      expiresAt = expiryDate;
    }
  } else if (planType === PLAN_TYPES.SUBSCRIPTION) {
    credit = Infinity;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (parseInt(expiryDays, 10) || 30));
    expiryDate.setHours(23, 59, 59, 999);
    expiresAt = expiryDate;
  }

  const newAppUser = new AppUser({
    userId,
    username: username.toLowerCase().trim(),
    key: generateAppUserKey(),
    plan: planObject,
    expiresAt,
    credit,
    isActive: true,
    status: "active",
    lastCreditRefresh: today,
    monthlyProcess: new Map([[today.substring(0, 7), 0]]),
    dailyProcess: new Map([[today, 0]]),
  });

  await newAppUser.save();

  return new ApiResponse(201, true, "App user created successfully.", {
    key: newAppUser.key,
    expiresAt: newAppUser.expiresAt,
    plan: newAppUser.plan,
    username: newAppUser.username,
    isActive: newAppUser.isActive,
    credit: newAppUser.credit,
  }).send(res);
});

/**
 * UPDATE an existing App User's plan, credits, or expiry
 */
export const updateAppUser = asyncHandler(async (req, res) => {
  const { username, plan, expiryDays, credit } = req.body;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  if (!plan && expiryDays === undefined && credit === undefined) {
    throw new ApiError(400, "At least one of plan, expiryDays, or credit is required");
  }

  let appDoc = await AppUser.findOne({ username: username.toLowerCase().trim() });
  if (!appDoc) {
    const user = await User.findOne({ email: username.toLowerCase().trim() });
    if (user) {
      appDoc = await findOrCreateAppUser(user);
    }
  }

  if (!appDoc) {
    throw new ApiError(404, "App user not found");
  }

  if (plan) {
    const planObj = typeof plan === "object" ? plan : { type: plan };
    appDoc.plan = planObj;
    if (planObj.type === PLAN_TYPES.FREE) {
      appDoc.expiresAt = undefined;
    } else if (planObj.type === PLAN_TYPES.SUBSCRIPTION) {
      appDoc.credit = Infinity;
    }
  }

  if (expiryDays !== undefined && appDoc.plan?.type !== PLAN_TYPES.FREE) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays, 10));
    expiryDate.setHours(23, 59, 59, 999);
    appDoc.expiresAt = expiryDate;
  }

  if (credit !== undefined) {
    appDoc.credit = parseInt(credit, 10);
  }

  await appDoc.save();

  return new ApiResponse(200, true, "App user updated successfully", {
    key: appDoc.key,
    appUser: appDoc,
  }).send(res);
});

/**
 * DELETE an App User by username
 */
export const deleteAppUser = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  const appDoc = await AppUser.findOneAndDelete({
    username: decodeURIComponent(username).toLowerCase().trim(),
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
  const { key, deviceId } = req.body;

  if (!key) {
    throw new ApiError(400, "App user key is required.");
  }

  const appDoc = await AppUser.findOne({ key });
  if (!appDoc) {
    throw new ApiError(404, "App user not found.");
  }

  if (deviceId) {
    appDoc.removeDevice(deviceId);
  } else {
    appDoc.resetAllDevices();
  }
  await appDoc.save();

  return new ApiResponse(200, true, "Device ID reset successfully.", {
    devices: appDoc.getFormattedDevices(),
    allowedDevices: appDoc.allowedDevices,
  }).send(res);
});

/**
 * SUSPEND or REACTIVATE an App User
 */
export const updateAppUserStatus = asyncHandler(async (req, res) => {
  const { key, mode } = req.body;

  if (!key || !mode) {
    throw new ApiError(400, "App user key and mode are required.");
  }

  const appDoc = await AppUser.findOne({ key });
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
    return new ApiResponse(200, true, "App user suspended successfully.").send(res);
  }

  if (mode === "reactivate") {
    if (appDoc.status !== "suspended") {
      throw new ApiError(400, "App user is not suspended.");
    }
    appDoc.status = "active";
    appDoc.suspendedAt = null;
    await appDoc.save();
    return new ApiResponse(200, true, "App user reactivated successfully.").send(res);
  }

  throw new ApiError(400, "Invalid mode. Use 'suspend' or 'reactivate'.");
});

/**
 * ADD CREDITS to an App User
 */
export const addCredits = asyncHandler(async (req, res) => {
  const { key, credits } = req.body;

  if (!key || credits === undefined) {
    throw new ApiError(400, "App user key and credits are required.");
  }

  const appDoc = await AppUser.findOne({ key });
  if (!appDoc) {
    throw new ApiError(404, "App user not found.");
  }

  appDoc.credit = (isFinite(appDoc.credit) ? appDoc.credit : 0) + parseInt(credits, 10);
  await appDoc.save();

  return new ApiResponse(
    200,
    true,
    `${credits} credits added successfully. New balance: ${appDoc.credit}`
  ).send(res);
});

/**
 * GET user and App User details by key (or userId / appUserId)
 */
export const getUserDetailsByAppUser = asyncHandler(async (req, res) => {
  const targetId = req.params.key;

  if (!targetId) {
    throw new ApiError(400, "App user key is required");
  }

  let appDoc = await AppUser.findOne({ key: targetId })
    .populate("userId", "name email role createdAt")
    .exec();

  if (!appDoc && mongoose.Types.ObjectId.isValid(targetId)) {
    appDoc = await AppUser.findOne({
      $or: [{ _id: targetId }, { userId: targetId }],
    })
      .populate("userId", "name email role createdAt")
      .exec();

    if (!appDoc) {
      const existingUser = await User.findById(targetId).select("name email role isDisabled createdAt");
      if (existingUser) {
        const created = await findOrCreateAppUser(existingUser);
        appDoc = await AppUser.findById(created._id)
          .populate("userId", "name email role createdAt")
          .exec();
      }
    }
  }

  if (!appDoc) {
    throw new ApiError(404, "App user not found");
  }

  const user = appDoc.userId;

  const payments = user?._id
    ? await AppPayment.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .select("trxID plan amount createdAt")
        .lean()
    : [];

  const formattedPayments = payments.map((payment) => ({
    id: payment._id,
    trxID: payment.trxID,
    plan: payment.plan,
    amount: payment.amount,
    createdAt: payment.createdAt,
  }));

  const remainingCredit =
    typeof appDoc.calculateCredit === "function"
      ? appDoc.calculateCredit()
      : appDoc.credit;

  const isValid =
    typeof appDoc.isValid === "function" ? appDoc.isValid() : appDoc.isActive;

  const monthlyUsage = {};
  if (appDoc.monthlyProcess && appDoc.monthlyProcess.size > 0) {
    appDoc.monthlyProcess.forEach((count, month) => {
      monthlyUsage[month] = count;
    });
  }

  const appData = {
    ...appDoc.toObject(),
    credit: remainingCredit === Infinity ? null : remainingCredit,
    remainingCredit: remainingCredit === Infinity ? null : remainingCredit,
    isValid,
    monthlyUsage,
  };

  const data = {
    user: {
      id: user?._id || appDoc.userId,
      name: user?.name || appDoc.username,
      email: user?.email || appDoc.username,
      role: user?.role || "user",
      createdAt: user?.createdAt || appDoc.createdAt,
    },
    appUser: appData,
    payments: formattedPayments,
  };

  return new ApiResponse(200, true, "User details fetched successfully", data).send(res);
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
    throw new ApiError(400, "License key is required in headers.");
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
    throw new ApiError(403, "Account license is not valid or active.", [], "", {
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
  const aiApiKey = isCreditPlan && encryptedKeyDoc ? encryptedKeyDoc.ai_api_key : null;

  return new ApiResponse(200, true, "Account is valid and process allowed.", {
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
    throw new ApiError(400, "License key is required.");
  }

  const appDoc = await AppUser.findOne({ key }).populate("userId", "name email avatar");
  if (!appDoc) {
    throw new ApiError(404, "App user not found.", [], "", {
      code: "KEY_NOT_FOUND",
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

  const encryptedKeyDoc =
    appDoc.plan.type === PLAN_TYPES.CREDIT ? await AiAPI.findOne({ isActive: true }) : null;
  const aiApiKey =
    appDoc.plan.type === PLAN_TYPES.CREDIT && encryptedKeyDoc ? encryptedKeyDoc.ai_api_key : null;

  const remainingCredit = appDoc.calculateCredit();
  const devices = appDoc.getFormattedDevices(
    deviceMeta.deviceId || null,
    deviceMeta.fingerprint || null
  );

  return new ApiResponse(200, true, "User stats retrieved successfully", {
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
    throw new ApiError(400, "License key is required.");
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
    throw new ApiError(400, "License key is required.");
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

/**
 * PROCESS usage accounting for an App User (from Desktop App)
 */
export const processAppUsage = asyncHandler(async (req, res) => {
  const key = extractAppUserKey(req);
  const { processCount, processFileCount, failedCount, failedErrors } = req.body;

  if (!key) throw new ApiError(400, "License key is required in headers.");

  const appDoc = await AppUser.findOne({ key });
  if (!appDoc) throw new ApiError(404, "App user not found.");

  const creditUsed = parseInt(processCount, 10) || 0;
  const fileCount = parseInt(processFileCount, 10) || 0;
  const failed = parseInt(failedCount, 10) || 0;
  const errorMsg = failedErrors || "";

  if (!appDoc.isValid()) {
    if (failed > 0) {
      await logFailedProcess(appDoc, failed, errorMsg);
    }
    throw new ApiError(403, "Account license is not valid or active.");
  }

  if (creditUsed > 0) {
    try {
      await appDoc.useCredit(creditUsed, fileCount);
    } catch (error) {
      await logFailedProcess(appDoc, failed > 0 ? failed : 1, error.message);
      throw new ApiError(429, error.message);
    }
  }

  if (failed > 0) {
    await logFailedProcess(appDoc, failed, errorMsg);
  }

  // Update normalized usage ledger
  const today = new Date().toISOString().split("T")[0];
  try {
    const updateDoc = {
      $setOnInsert: { appUserId: appDoc._id, userId: appDoc.userId, date: today },
      $inc: { processCount: creditUsed, fileCount, failedCount: failed },
    };
    if (errorMsg) {
      updateDoc.$push = { errors: errorMsg };
    }
    await ApiUsageLog.updateOne(
      { appUserId: appDoc._id, date: today },
      updateDoc,
      { upsert: true }
    );
  } catch (err) {
    console.error("Failed to update ApiUsageLog:", err.message);
  }

  const remainingCredit = appDoc.calculateCredit();

  return new ApiResponse(200, true, "Usage updated successfully", {
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
