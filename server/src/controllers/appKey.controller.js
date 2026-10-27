import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { AiAPI } from "../models/aiApiKey.model.js";
import { AppKey } from "../models/appKey.model.js";
import { ApiUsageLog } from "../models/apiUsageLog.model.js";
import config from "../config/index.js";
import { generateAppKey, compareVersions } from "../utils/index.js";
import { PLAN_TYPES } from "../constants/index.js";

export { generateAppKey };

export const createAppKey = asyncHandler(async (req, res) => {
  const { username, expiryDays = 3, plan = PLAN_TYPES.FREE, initialCredit } = req.body;

  if (!username) {
    throw new ApiError(400, "Username (email) is required.");
  }

  const user = await User.findOne({ email: username.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "No user found with the provided email.");
  }

  const userId = user._id;

  const existingAppKey = await AppKey.findOne({ userId });
  if (existingAppKey) {
    throw new ApiError(400, "This user already has an API key.");
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
    credit = 0;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays, 10));
    expiryDate.setHours(23, 59, 59, 999);
    expiresAt = expiryDate;
  }

  const newAppKey = new AppKey({
    userId,
    username,
    key: generateAppKey(),
    expiresAt,
    plan: planObject,
    credit,
    lastCreditRefresh: today,
    monthlyProcess: new Map([[today.substring(0, 7), 0]]),
    dailyProcess: new Map([[today, 0]]),
  });

  await newAppKey.save();

  return new ApiResponse(201, true, "App user created successfully.", {
    appKey: newAppKey.key,
    expiresAt: newAppKey.expiresAt,
    plan: newAppKey.plan,
    username,
    isActive: newAppKey.isActive,
    credit: newAppKey.credit,
  }).send(res);
});

export const updateAppKey = asyncHandler(async (req, res) => {
  const { username, plan, expiryDays, credit } = req.body;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  if (!plan && !expiryDays && credit === undefined) {
    throw new ApiError(400, "At least one of plan, expiryDays, or credit is required");
  }

  const appKey = await AppKey.findOne({ username });
  if (!appKey) {
    throw new ApiError(404, "API key not found");
  }

  if (plan) {
    const planObj = typeof plan === "object" ? plan : { type: plan };
    appKey.plan = planObj;
  }

  if (expiryDays !== undefined) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays, 10));
    expiryDate.setHours(23, 59, 59, 999);
    appKey.expiresAt = expiryDate;
  }

  if (credit !== undefined) {
    appKey.credit = parseInt(credit, 10);
  }

  await appKey.save();

  return new ApiResponse(200, true, "API key updated successfully", {
    appKey,
  }).send(res);
});

export const deleteAppKey = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  const appKey = await AppKey.findOneAndDelete({ username });
  if (!appKey) {
    throw new ApiError(404, "API key not found");
  }

  return new ApiResponse(200, true, "API key deleted successfully").send(res);
});

export const resetDevice = asyncHandler(async (req, res) => {
  const { key } = req.body;

  if (!key) {
    throw new ApiError(400, "API key is required.");
  }

  const appKey = await AppKey.findOne({ key });
  if (!appKey) {
    throw new ApiError(404, "API key not found.");
  }

  appKey.allowedDevices = [];
  await appKey.save();

  return new ApiResponse(200, true, "Device ID reset successfully.").send(res);
});

export const updateAppKeyStatus = asyncHandler(async (req, res) => {
  const { key, mode } = req.body;

  if (!key || !mode) {
    throw new ApiError(400, "API key and mode are required.");
  }

  const appKey = await AppKey.findOne({ key });
  if (!appKey) {
    throw new ApiError(404, "API key not found.");
  }

  if (mode === "suspend") {
    if (appKey.status === "suspended") {
      throw new ApiError(400, "API key is already suspended.");
    }
    appKey.status = "suspended";
    appKey.suspendedAt = new Date();
    await appKey.save();
    return new ApiResponse(200, true, "API key suspended successfully.").send(res);
  }

  if (mode === "reactivate") {
    if (appKey.status !== "suspended") {
      throw new ApiError(400, "API key is not suspended.");
    }
    appKey.status = "active";
    appKey.suspendedAt = null;
    await appKey.save();
    return new ApiResponse(200, true, "API key reactivated successfully.").send(res);
  }

  throw new ApiError(400, "Invalid mode. Use 'suspend' or 'reactivate'.");
});

export const addCredits = asyncHandler(async (req, res) => {
  const { key, credits } = req.body;

  if (!key || credits === undefined) {
    throw new ApiError(400, "API key and credits are required.");
  }

  const appKey = await AppKey.findOne({ key });
  if (!appKey) {
    throw new ApiError(404, "API key not found.");
  }

  appKey.credit += parseInt(credits, 10);
  await appKey.save();

  return new ApiResponse(
    200,
    true,
    `${credits} credits added successfully. New balance: ${appKey.credit}`
  ).send(res);
});

export const getUserDetailsByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;

  if (!key) {
    throw new ApiError(400, "API key is required");
  }

  const appKey = await AppKey.findOne({ key })
    .populate("userId", "name email role createdAt")
    .exec();

  if (!appKey) {
    throw new ApiError(404, "Invalid API key");
  }

  const user = appKey.userId;

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
    typeof appKey.calculateCredit === "function"
      ? appKey.calculateCredit()
      : appKey.credit;

  const isValid =
    typeof appKey.isValid === "function" ? appKey.isValid() : appKey.isActive;

  const monthlyUsage = {};
  if (appKey.monthlyProcess && appKey.monthlyProcess.size > 0) {
    appKey.monthlyProcess.forEach((count, month) => {
      monthlyUsage[month] = count;
    });
  }

  const data = {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    appKey: {
      ...appKey.toObject(),
      remainingCredit,
      isValid,
      monthlyUsage,
    },
    payments: formattedPayments,
  };

  return new ApiResponse(200, true, "User details fetched successfully", data).send(res);
});

export const validateAppKey = asyncHandler(async (req, res) => {
  const key = req.header("x-api-key");
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
    throw new ApiError(400, "API key is required in headers.");
  }

  if (!deviceId) {
    throw new ApiError(400, "Device ID is required in headers.");
  }

  const count = parseInt(processCount, 10);
  if (isNaN(count) || count < 1) {
    throw new ApiError(400, "Valid process count is required (must be a positive number).");
  }

  const appKey = await AppKey.findOne({ key });
  if (!appKey) {
    throw new ApiError(404, "API key not found.");
  }

  if (!appKey.isValid()) {
    if (appKey.status === "suspended") {
      throw new ApiError(403, "Account has been suspended.");
    }
    throw new ApiError(403, "API key is not valid or active.");
  }

  if (!appKey.allowedDevices.includes(deviceId)) {
    if (appKey.allowedDevices.length >= 2) {
      throw new ApiError(
        403,
        "This account is already used on two devices. No more devices allowed."
      );
    }
    appKey.allowedDevices.push(deviceId);
    await appKey.save();
  }

  if (!appKey.canProcess(count)) {
    const limit = appKey.plan.type === PLAN_TYPES.FREE ? 5 : appKey.credit;
    throw new ApiError(429, `You need ${count} credits but have ${limit} remaining.`);
  }

  const now = new Date();
  const expiresIn =
    (appKey.plan.type === PLAN_TYPES.CREDIT || appKey.plan.type === PLAN_TYPES.SUBSCRIPTION) &&
    appKey.expiresAt
      ? Math.max(0, Math.floor((appKey.expiresAt - now) / (1000 * 60 * 60 * 24)))
      : null;

  const aiApiSecret = appKey.plan.type === PLAN_TYPES.CREDIT ? config.encoderKey : null;

  return new ApiResponse(200, true, "API key is valid and process allowed.", {
    username: appKey.username,
    plan: appKey.plan,
    totalProcess: appKey.totalProcess,
    expiresAt:
      appKey.plan.type === PLAN_TYPES.CREDIT || appKey.plan.type === PLAN_TYPES.SUBSCRIPTION
        ? appKey.expiresAt
        : null,
    expiresIn,
    aiApiSecret,
    deviceId,
    remainingCredit: appKey.credit,
  }).send(res);
});

export const getAppKeyStats = asyncHandler(async (req, res) => {
  const key = req.header("x-api-key");

  if (!key) {
    throw new ApiError(400, "Key is required.");
  }

  const appKey = await AppKey.findOne({ key }).populate("userId", "name email");
  if (!appKey) {
    throw new ApiError(404, "Key not found.");
  }

  const isValid = appKey.isValid();
  await appKey.save();

  const now = new Date();
  const expiresIn =
    (appKey.plan.type === PLAN_TYPES.CREDIT || appKey.plan.type === PLAN_TYPES.SUBSCRIPTION) &&
    appKey.expiresAt
      ? Math.max(0, Math.floor((appKey.expiresAt - now) / (1000 * 60 * 60 * 24)))
      : null;

  const encryptedKeyDoc = await AiAPI.findOne({ isActive: true });
  const aiApiKey =
    appKey.plan.type === PLAN_TYPES.CREDIT && encryptedKeyDoc ? encryptedKeyDoc.ai_api_key : null;

  const remainingCredit = appKey.calculateCredit();

  return new ApiResponse(200, true, "User stats retrieved successfully", {
    plan: appKey.plan,
    username: appKey.username,
    status: appKey.status,
    isValid,
    expiresAt:
      appKey.plan.type === PLAN_TYPES.CREDIT || appKey.plan.type === PLAN_TYPES.SUBSCRIPTION
        ? appKey.expiresAt
        : null,
    expiresIn,
    credit: remainingCredit,
    totalProcess: appKey.totalProcess,
    aiApiKey,
    user: {
      name: appKey.userId?.name,
      email: appKey.userId?.email,
    },
  }).send(res);
});

export const processApiUsage = asyncHandler(async (req, res) => {
  const key = req.header("x-api-key");
  const { processCount, processFileCount, failedCount, failedErrors } = req.body;

  if (!key) throw new ApiError(400, "API key is required in headers.");

  const appKey = await AppKey.findOne({ key });
  if (!appKey) throw new ApiError(404, "API key not found.");

  const creditUsed = parseInt(processCount, 10) || 0;
  const fileCount = parseInt(processFileCount, 10) || 0;
  const failed = parseInt(failedCount, 10) || 0;
  const errorMsg = failedErrors || "";

  if (!appKey.isValid()) {
    if (failed > 0) {
      await logFailedProcess(appKey, failed, errorMsg);
    }
    throw new ApiError(403, "API key is not valid or active.");
  }

  if (creditUsed > 0) {
    try {
      await appKey.useCredit(creditUsed, fileCount);
    } catch (error) {
      await logFailedProcess(appKey, failed > 0 ? failed : 1, error.message);
      throw new ApiError(429, error.message);
    }
  }

  if (failed > 0) {
    await logFailedProcess(appKey, failed, errorMsg);
  }

  // Update normalized usage ledger
  const today = new Date().toISOString().split("T")[0];
  try {
    await ApiUsageLog.updateOne(
      { appKeyId: appKey._id, date: today },
      {
        $setOnInsert: { userId: appKey.userId, date: today },
        $inc: { processCount: creditUsed, fileCount, failedCount: failed },
        $push: errorMsg ? { errors: errorMsg } : undefined,
      },
      { upsert: true }
    );
  } catch (err) {
    // Non-blocking for client
    console.error("Failed to update ApiUsageLog:", err.message);
  }

  return new ApiResponse(200, true, "Usage updated successfully", {
    plan: appKey.plan,
    remainingCredit: appKey.calculateCredit(),
    totalProcess: appKey.totalProcess,
    dailyProcess: Object.fromEntries(appKey.dailyProcess || new Map()),
    monthlyProcess: Object.fromEntries(appKey.monthlyProcess || new Map()),
    totalFailedProcess: appKey.totalFailedProcess,
    failedProcess: Object.fromEntries(appKey.failedProcess || new Map()),
  }).send(res);
});

async function logFailedProcess(appKey, count, errorMessage) {
  const dayKey = new Date().toISOString().split("T")[0];

  if (!appKey.failedProcess) {
    appKey.failedProcess = new Map();
  }

  const dayData = appKey.failedProcess.get(dayKey) || {
    count: 0,
    errorMessages: [],
  };

  dayData.count += count;
  appKey.totalFailedProcess = (appKey.totalFailedProcess || 0) + count;

  if (errorMessage && errorMessage.trim()) {
    const errorList = errorMessage
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    dayData.errorMessages.push(...errorList);
  }

  appKey.failedProcess.set(dayKey, dayData);
  cleanupFailedData(appKey);
  await appKey.save();
}

function cleanupFailedData(appKey) {
  if (!appKey.failedProcess) return;
  const now = new Date();
  const recentDays = new Set();

  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    recentDays.add(d.toISOString().split("T")[0]);
  }

  for (const key of appKey.failedProcess.keys()) {
    if (!recentDays.has(key)) {
      appKey.failedProcess.delete(key);
    }
  }
}
