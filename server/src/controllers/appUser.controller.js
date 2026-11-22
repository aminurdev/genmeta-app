import passport from "passport";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { AiAPI } from "../models/aiApiKey.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/api.error.js";
import { AppKey, extractDeviceMeta } from "../models/appKey.model.js";
import { generateAppKey } from "./appKey.controller.js";
import { PLAN_TYPES } from "../constants/index.js";

function createDeviceChallengeToken(user, appKeyDoc, deviceMeta) {
  return jwt.sign(
    {
      purpose: "device_replace",
      userId: user._id.toString(),
      appKey: appKeyDoc.key,
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
    appId: appDoc.key,
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

  const appKeyDoc = await findOrCreateAppKey(user);

  if (!appKeyDoc.isValid()) {
    if (appKeyDoc.status === "suspended") {
      throw new ApiError(403, "Your account has been suspended. Please contact support.", [], "", {
        code: "ACCOUNT_SUSPENDED",
      });
    }
    throw new ApiError(403, "Your app license is currently inactive.", [], "", {
      code: "ACCOUNT_INACTIVE",
    });
  }

  const deviceMeta = extractDeviceMeta(req);
  const deviceResult = appKeyDoc.registerOrUpdateDevice(deviceMeta, {
    replaceDeviceId: replaceDeviceId || null,
  });

  if (!deviceResult.allowed) {
    const deviceChallengeToken = createDeviceChallengeToken(user, appKeyDoc, deviceMeta);
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

  await appKeyDoc.save();
  const account = await buildAppAccountPayload(appKeyDoc, user, deviceMeta);

  return new ApiResponse(200, true, "Login successful", {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      role: user.role,
    },
    apiKey: appKeyDoc.key,
    account,
    devices: deviceResult.devices,
    maxDevices: deviceResult.maxDevices,
  }).send(res);
});

export const appKeyDirectLogin = asyncHandler(async (req, res) => {
  const { apiKey, appKey, key, replaceDeviceId } = req.body;
  const rawKey = (apiKey || appKey || key || req.header("x-api-key") || req.header("x-app-id") || "")
    .toString()
    .trim();

  if (!rawKey) {
    throw new ApiError(400, "App Key / License Key is required");
  }

  const appKeyDoc = await AppKey.findOne({ key: rawKey }).populate(
    "userId",
    "name email avatar role isDisabled isVerified"
  );

  if (!appKeyDoc) {
    throw new ApiError(404, "Invalid App Key. Please check your key and try again.", [], "", {
      code: "INVALID_APP_KEY",
    });
  }

  const user = appKeyDoc.userId;
  if (user?.isDisabled) {
    throw new ApiError(403, "Your account has been disabled. Please contact support.", [], "", {
      code: "ACCOUNT_DISABLED",
    });
  }

  if (!appKeyDoc.isValid()) {
    if (appKeyDoc.status === "suspended") {
      throw new ApiError(403, "Your account has been suspended. Please contact support.", [], "", {
        code: "ACCOUNT_SUSPENDED",
      });
    }
    throw new ApiError(403, "Your app license is not active.", [], "", {
      code: "ACCOUNT_INACTIVE",
    });
  }

  const deviceMeta = extractDeviceMeta(req);
  const deviceResult = appKeyDoc.registerOrUpdateDevice(deviceMeta, {
    replaceDeviceId: replaceDeviceId || null,
  });

  if (!deviceResult.allowed) {
    const deviceChallengeToken = createDeviceChallengeToken(
      user || { _id: appKeyDoc.userId },
      appKeyDoc,
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

  await appKeyDoc.save();
  const account = await buildAppAccountPayload(appKeyDoc, user, deviceMeta);

  return new ApiResponse(200, true, "Login successful", {
    user: {
      _id: user?._id || appKeyDoc.userId,
      name: user?.name || appKeyDoc.username || "User",
      email: user?.email || appKeyDoc.username,
      avatar: user?.avatar || null,
      role: user?.role || "user",
    },
    apiKey: appKeyDoc.key,
    account,
    devices: deviceResult.devices,
    maxDevices: deviceResult.maxDevices,
  }).send(res);
});

export const verifyGoogle = asyncHandler(async (req, res) => {
  const user = req.user;
  const { replaceDeviceId } = req.body || {};
  const appKeyDoc = await findOrCreateAppKey(user);

  if (!appKeyDoc.isValid()) {
    if (appKeyDoc.status === "suspended") {
      throw new ApiError(403, "Your account has been suspended. Please contact support.", [], "", {
        code: "ACCOUNT_SUSPENDED",
      });
    }
    throw new ApiError(403, "Your app license is currently inactive.", [], "", {
      code: "ACCOUNT_INACTIVE",
    });
  }

  const deviceMeta = extractDeviceMeta(req);
  const deviceResult = appKeyDoc.registerOrUpdateDevice(deviceMeta, {
    replaceDeviceId: replaceDeviceId || null,
  });

  if (!deviceResult.allowed) {
    const deviceChallengeToken = createDeviceChallengeToken(user, appKeyDoc, deviceMeta);
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

  await appKeyDoc.save();
  const account = await buildAppAccountPayload(appKeyDoc, user, deviceMeta);

  return new ApiResponse(200, true, "Login successful", {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      role: user.role,
    },
    apiKey: appKeyDoc.key,
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

  if (decoded.purpose !== "device_replace" || !decoded.appKey) {
    throw new ApiError(401, "Invalid device challenge token");
  }

  const appKeyDoc = await AppKey.findOne({ key: decoded.appKey }).populate(
    "userId",
    "name email avatar role isDisabled"
  );

  if (!appKeyDoc) {
    throw new ApiError(404, "Account license not found");
  }

  const user = appKeyDoc.userId;
  if (user?.isDisabled || appKeyDoc.status === "suspended" || !appKeyDoc.isActive) {
    throw new ApiError(403, "Account is suspended or disabled", [], "", {
      code: "ACCOUNT_SUSPENDED",
    });
  }

  const deviceMeta = extractDeviceMeta(req);
  const deviceResult = appKeyDoc.registerOrUpdateDevice(deviceMeta, {
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

  await appKeyDoc.save();
  const account = await buildAppAccountPayload(appKeyDoc, user, deviceMeta);

  return new ApiResponse(200, true, "Device activated and login successful", {
    user: {
      _id: user?._id || appKeyDoc.userId,
      name: user?.name || appKeyDoc.username || "User",
      email: user?.email || appKeyDoc.username,
      avatar: user?.avatar || null,
      role: user?.role || "user",
    },
    apiKey: appKeyDoc.key,
    account,
    devices: deviceResult.devices,
    maxDevices: deviceResult.maxDevices,
  }).send(res);
});

export const appUserLogout = asyncHandler(async (req, res) => {
  const key =
    req.header("x-app-id") ||
    req.header("x-api-key") ||
    req.body?.apiKey ||
    req.body?.key;
  const deviceMeta = extractDeviceMeta(req);
  const releaseDevice = req.body?.releaseDevice !== false;

  if (key && deviceMeta.deviceId && releaseDevice) {
    const appKeyDoc = await AppKey.findOne({ key });
    if (appKeyDoc) {
      appKeyDoc.removeDevice(deviceMeta.deviceId);
      await appKeyDoc.save();
    }
  }

  return new ApiResponse(200, true, "Logged out successfully").send(res);
});

const findOrCreateAppKey = async (user) => {
  let appKey = await AppKey.findOne({ userId: user._id });

  if (!appKey) {
    const today = new Date().toISOString().split("T")[0];
    appKey = await AppKey.create({
      userId: user._id,
      username: user.email,
      key: generateAppKey(),
      plan: { type: PLAN_TYPES.FREE },
      credit: 10,
      lastCreditRefresh: today,
      monthlyProcess: new Map([[today.substring(0, 7), 0]]),
      dailyProcess: new Map([[today, 0]]),
    });
  }

  return appKey;
};
