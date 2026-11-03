import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { AiAPI } from "../models/aiApiKey.model.js";
import { AppId, AppUser } from "../models/appId.model.js";
import { ApiUsageLog } from "../models/apiUsageLog.model.js";
import config from "../config/index.js";
import { generateAppId, generateAppKey, compareVersions } from "../utils/index.js";
import { PLAN_TYPES } from "../constants/index.js";

export { generateAppId, generateAppKey };

/**
 * CREATE a new App ID for an existing registered user
 */
export const createAppId = asyncHandler(async (req, res) => {
  const { username, expiryDays = 3, plan = PLAN_TYPES.FREE, initialCredit } = req.body;

  if (!username) {
    throw new ApiError(400, "Username (email) is required.");
  }

  const user = await User.findOne({ email: username.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "No user found with the provided email.");
  }

  const userId = user._id;

  const existingApp = await AppId.findOne({ userId });
  if (existingApp) {
    throw new ApiError(400, "This user already has an App ID.");
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

  const newAppId = new AppId({
    userId,
    username: username.toLowerCase(),
    key: generateAppId(),
    plan: planObject,
    expiresAt,
    credit,
    isActive: true,
    status: "active",
    lastCreditRefresh: today,
    monthlyProcess: new Map([[today.substring(0, 7), 0]]),
    dailyProcess: new Map([[today, 0]]),
  });

  await newAppId.save();

  return new ApiResponse(201, true, "App user created successfully.", {
    appId: newAppId.key,
    appKey: newAppId.key, // Backward compatibility
    expiresAt: newAppId.expiresAt,
    plan: newAppId.plan,
    username,
    isActive: newAppId.isActive,
    credit: newAppId.credit,
  }).send(res);
});

export const createAppKey = createAppId;

/**
 * UPDATE an existing App ID's plan, credits, or expiry
 */
export const updateAppId = asyncHandler(async (req, res) => {
  const { username, plan, expiryDays, credit } = req.body;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  if (!plan && !expiryDays && credit === undefined) {
    throw new ApiError(400, "At least one of plan, expiryDays, or credit is required");
  }

  const appDoc = await AppId.findOne({ username });
  if (!appDoc) {
    throw new ApiError(404, "App ID not found");
  }

  if (plan) {
    const planObj = typeof plan === "object" ? plan : { type: plan };
    appDoc.plan = planObj;
  }

  if (expiryDays !== undefined) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays, 10));
    expiryDate.setHours(23, 59, 59, 999);
    appDoc.expiresAt = expiryDate;
  }

  if (credit !== undefined) {
    appDoc.credit = parseInt(credit, 10);
  }

  await appDoc.save();

  return new ApiResponse(200, true, "App ID updated successfully", {
    appId: appDoc.key,
    appKey: appDoc.key,
    appDoc,
  }).send(res);
});

export const updateAppKey = updateAppId;

/**
 * DELETE an App ID by username
 */
export const deleteAppId = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  const appDoc = await AppId.findOneAndDelete({ username });
  if (!appDoc) {
    throw new ApiError(404, "App ID not found");
  }

  return new ApiResponse(200, true, "App ID deleted successfully").send(res);
});

export const deleteAppKey = deleteAppId;

/**
 * RESET allowed device bindings for an App ID
 */
export const resetDevice = asyncHandler(async (req, res) => {
  const { key, appId } = req.body;
  const targetId = appId || key;

  if (!targetId) {
    throw new ApiError(400, "App ID is required.");
  }

  const appDoc = await AppId.findOne({ key: targetId });
  if (!appDoc) {
    throw new ApiError(404, "App ID not found.");
  }

  appDoc.allowedDevices = [];
  await appDoc.save();

  return new ApiResponse(200, true, "Device ID reset successfully.").send(res);
});

/**
 * SUSPEND or REACTIVATE an App ID
 */
export const updateAppIdStatus = asyncHandler(async (req, res) => {
  const { key, appId, mode } = req.body;
  const targetId = appId || key;

  if (!targetId || !mode) {
    throw new ApiError(400, "App ID and mode are required.");
  }

  const appDoc = await AppId.findOne({ key: targetId });
  if (!appDoc) {
    throw new ApiError(404, "App ID not found.");
  }

  if (mode === "suspend") {
    if (appDoc.status === "suspended") {
      throw new ApiError(400, "App ID is already suspended.");
    }
    appDoc.status = "suspended";
    appDoc.suspendedAt = new Date();
    await appDoc.save();
    return new ApiResponse(200, true, "App ID suspended successfully.").send(res);
  }

  if (mode === "reactivate") {
    if (appDoc.status !== "suspended") {
      throw new ApiError(400, "App ID is not suspended.");
    }
    appDoc.status = "active";
    appDoc.suspendedAt = null;
    await appDoc.save();
    return new ApiResponse(200, true, "App ID reactivated successfully.").send(res);
  }

  throw new ApiError(400, "Invalid mode. Use 'suspend' or 'reactivate'.");
});

export const updateAppKeyStatus = updateAppIdStatus;

/**
 * ADD CREDITS to an App ID
 */
export const addCredits = asyncHandler(async (req, res) => {
  const { key, appId, credits } = req.body;
  const targetId = appId || key;

  if (!targetId || credits === undefined) {
    throw new ApiError(400, "App ID and credits are required.");
  }

  const appDoc = await AppId.findOne({ key: targetId });
  if (!appDoc) {
    throw new ApiError(404, "App ID not found.");
  }

  appDoc.credit += parseInt(credits, 10);
  await appDoc.save();

  return new ApiResponse(
    200,
    true,
    `${credits} credits added successfully. New balance: ${appDoc.credit}`
  ).send(res);
});

/**
 * GET user and App ID details by App ID (key)
 */
export const getUserDetailsByAppId = asyncHandler(async (req, res) => {
  const targetId = req.params.appId || req.params.key;

  if (!targetId) {
    throw new ApiError(400, "App ID is required");
  }

  const appDoc = await AppId.findOne({ key: targetId })
    .populate("userId", "name email role createdAt")
    .exec();

  if (!appDoc) {
    throw new ApiError(404, "Invalid App ID");
  }

  const user = appDoc.userId;

  const payments = await AppPayment.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .select("trxID plan amount createdAt")
    .lean();

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
    remainingCredit,
    isValid,
    monthlyUsage,
  };

  const data = {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    appId: appData,
    appKey: appData, // Backward compatibility
    payments: formattedPayments,
  };

  return new ApiResponse(200, true, "User details fetched successfully", data).send(res);
});

export const getUserDetailsByKey = getUserDetailsByAppId;

/**
 * VALIDATE an App ID and check processing permissions (from Desktop App)
 */
export const validateAppId = asyncHandler(async (req, res) => {
  const key = req.header("x-app-id") || req.header("x-api-key");
  const deviceId = req.header("x-device-id");
  const version = req.header("x-app-version");

  if (!version) {
    throw new ApiError(426, "Please update your app. A new version is available.");
  }

  if (compareVersions(version, config.minimumRequiredAppVersion) < 0) {
    throw new ApiError(426, "Please update your app. A new version is available.");
  }

  const { processCount = 1 } = req.body;

  if (!key) {
    throw new ApiError(400, "App ID is required in headers.");
  }

  if (!deviceId) {
    throw new ApiError(400, "Device ID is required in headers.");
  }

  const count = parseInt(processCount, 10);
  if (isNaN(count) || count < 1) {
    throw new ApiError(400, "Valid process count is required (must be a positive number).");
  }

  const appDoc = await AppId.findOne({ key });
  if (!appDoc) {
    throw new ApiError(404, "App ID not found.");
  }

  if (!appDoc.isValid()) {
    if (appDoc.status === "suspended") {
      throw new ApiError(403, "Account has been suspended.");
    }
    throw new ApiError(403, "App ID is not valid or active.");
  }

  if (!appDoc.allowedDevices.includes(deviceId)) {
    if (appDoc.allowedDevices.length >= 2) {
      throw new ApiError(
        403,
        "This account is already used on two devices. No more devices allowed."
      );
    }
    appDoc.allowedDevices.push(deviceId);
    await appDoc.save();
  }

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

  const aiApiSecret = appDoc.plan.type === PLAN_TYPES.CREDIT ? config.encoderKey : null;

  return new ApiResponse(200, true, "App ID is valid and process allowed.", {
    appId: appDoc.key,
    username: appDoc.username,
    plan: appDoc.plan,
    totalProcess: appDoc.totalProcess,
    expiresAt:
      appDoc.plan.type === PLAN_TYPES.CREDIT || appDoc.plan.type === PLAN_TYPES.SUBSCRIPTION
        ? appDoc.expiresAt
        : null,
    expiresIn,
    aiApiSecret,
    deviceId,
    remainingCredit: appDoc.credit,
  }).send(res);
});

export const validateAppKey = validateAppId;

/**
 * GET current stats for an App ID (from Desktop App)
 */
export const getAppIdStats = asyncHandler(async (req, res) => {
  const key = req.header("x-app-id") || req.header("x-api-key");

  if (!key) {
    throw new ApiError(400, "App ID is required.");
  }

  const appDoc = await AppId.findOne({ key }).populate("userId", "name email");
  if (!appDoc) {
    throw new ApiError(404, "App ID not found.");
  }

  const isValid = appDoc.isValid();
  await appDoc.save();

  const now = new Date();
  const expiresIn =
    (appDoc.plan.type === PLAN_TYPES.CREDIT || appDoc.plan.type === PLAN_TYPES.SUBSCRIPTION) &&
    appDoc.expiresAt
      ? Math.max(0, Math.floor((appDoc.expiresAt - now) / (1000 * 60 * 60 * 24)))
      : null;

  const encryptedKeyDoc = await AiAPI.findOne({ isActive: true });
  const aiApiKey =
    appDoc.plan.type === PLAN_TYPES.CREDIT && encryptedKeyDoc ? encryptedKeyDoc.ai_api_key : null;

  const remainingCredit = appDoc.calculateCredit();

  return new ApiResponse(200, true, "User stats retrieved successfully", {
    appId: appDoc.key,
    plan: appDoc.plan,
    username: appDoc.username,
    status: appDoc.status,
    isValid,
    expiresAt:
      appDoc.plan.type === PLAN_TYPES.CREDIT || appDoc.plan.type === PLAN_TYPES.SUBSCRIPTION
        ? appDoc.expiresAt
        : null,
    expiresIn,
    credit: remainingCredit,
    totalProcess: appDoc.totalProcess,
    aiApiKey,
    user: {
      name: appDoc.userId?.name,
      email: appDoc.userId?.email,
    },
  }).send(res);
});

export const getAppKeyStats = getAppIdStats;

/**
 * PROCESS usage accounting for an App ID (from Desktop App)
 */
export const processAppUsage = asyncHandler(async (req, res) => {
  const key = req.header("x-app-id") || req.header("x-api-key");
  const { processCount, processFileCount, failedCount, failedErrors } = req.body;

  if (!key) throw new ApiError(400, "App ID is required in headers.");

  const appDoc = await AppId.findOne({ key });
  if (!appDoc) throw new ApiError(404, "App ID not found.");

  const creditUsed = parseInt(processCount, 10) || 0;
  const fileCount = parseInt(processFileCount, 10) || 0;
  const failed = parseInt(failedCount, 10) || 0;
  const errorMsg = failedErrors || "";

  if (!appDoc.isValid()) {
    if (failed > 0) {
      await logFailedProcess(appDoc, failed, errorMsg);
    }
    throw new ApiError(403, "App ID is not valid or active.");
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
    await ApiUsageLog.updateOne(
      { appKeyId: appDoc._id, date: today },
      {
        $setOnInsert: { userId: appDoc.userId, date: today },
        $inc: { processCount: creditUsed, fileCount, failedCount: failed },
        $push: errorMsg ? { errors: errorMsg } : undefined,
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("Failed to update ApiUsageLog:", err.message);
  }

  return new ApiResponse(200, true, "Usage updated successfully", {
    appId: appDoc.key,
    plan: appDoc.plan,
    remainingCredit: appDoc.calculateCredit(),
    totalProcess: appDoc.totalProcess,
    dailyProcess: Object.fromEntries(appDoc.dailyProcess || new Map()),
    monthlyProcess: Object.fromEntries(appDoc.monthlyProcess || new Map()),
    totalFailedProcess: appDoc.totalFailedProcess,
    failedProcess: Object.fromEntries(appDoc.failedProcess || new Map()),
  }).send(res);
});

export const processApiUsage = processAppUsage;

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
