import crypto from "crypto";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { v4 as uuidv4 } from "uuid";
import { AppPayment } from "../models/appPayment.model.js";
import { AiAPI } from "../models/aiApiKey.model.js";
import config from "../config/index.js";
import { AppKey } from "../models/appKey.model.js";
import { AppPricing } from "../models/appPricing.model.js";

export function generateAppKey() {
  const buffer = crypto.randomBytes(32);
  const timestamp = Date.now().toString();
  const uuid = uuidv4();

  // Combine the random bytes, timestamp, and UUID
  const combined = buffer.toString("hex") + timestamp + uuid;

  // Create a hash of the combined string
  return crypto.createHash("sha256").update(combined).digest("hex");
}

const createAppKey = asyncHandler(async (req, res) => {
  const { username, expiryDays = 3, plan = "free", initialCredit } = req.body;

  if (!username) {
    throw new ApiError(400, "Username (email) is required.");
  }

  // Find user by email
  const user = await User.findOne({ email: username });
  if (!user) {
    throw new ApiError(404, "No user found with the provided email.");
  }

  const userId = user._id;

  // Prevent duplicate API key for user
  const existingAppKey = await AppKey.findOne({ userId });
  if (existingAppKey) {
    throw new ApiError(400, "This user already has an API key.");
  }

  // Normalize plan
  const planObject = typeof plan === "object" ? plan : { type: plan };
  const planType = planObject.type;

  // Validate plan type
  if (!["free", "credit", "subscription"].includes(planType)) {
    throw new ApiError(
      400,
      "Invalid plan type. Must be 'free', 'credit', or 'subscription'."
    );
  }

  // Initialize credit and expiry
  let credit = 0;
  let expiresAt = undefined;
  const today = new Date().toISOString().split("T")[0];

  if (planType === "free") {
    credit = 10;
  } else if (planType === "credit") {
    // For credit plan, use provided initial credit or default to 100
    credit = initialCredit ? parseInt(initialCredit) : 100;

    // Only set expiry for credit plan if specified
    if (expiryDays && parseInt(expiryDays) > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
      expiryDate.setHours(23, 59, 59, 999);
      expiresAt = expiryDate;
    }
  } else if (planType === "subscription") {
    // For subscription plan, set unlimited credit and always set expiry
    credit = 0; // Unlimited for subscription
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
    expiryDate.setHours(23, 59, 59, 999);
    expiresAt = expiryDate;
  }

  // Create new API key document
  const newAppKey = new AppKey({
    userId,
    username,
    key: generateAppKey(),
    expiresAt,
    plan: planObject,
    credit,
    lastCreditRefresh: today,
    // Initialize monthly and daily process
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

const updateAppKey = asyncHandler(async (req, res) => {
  const { username, plan, expiryDays, credit } = req.body;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  if (!plan && !expiryDays && credit === undefined) {
    throw new ApiError(
      400,
      "At least one of plan, expiryDays, or credit is required"
    );
  }

  const appKey = await AppKey.findOne({ username });
  if (!appKey) {
    throw new ApiError(404, "App user not found");
  }

  // Update plan if provided
  if (plan) {
    // Validate plan type
    const planType = typeof plan === "object" ? plan.type : plan;
    if (!["free", "credit", "subscription"].includes(planType)) {
      throw new ApiError(
        400,
        "Invalid plan type. Must be 'free', 'credit', or 'subscription'."
      );
    }

    // Format the plan object correctly
    const newPlan = typeof plan === "object" ? plan : { type: plan };
    const oldPlanType = appKey.plan.type;
    appKey.plan = newPlan;

    // Handle plan-specific logic
    if (newPlan.type === "free") {
      appKey.expiresAt = undefined;
      appKey.credit = 10;
      appKey.lastCreditRefresh = new Date().toISOString().split("T")[0];
    } else if (
      newPlan.type === "subscription" &&
      oldPlanType !== "subscription"
    ) {
      // When upgrading to subscription, set unlimited credit
      appKey.credit = 0;
    } else if (newPlan.type === "credit" && oldPlanType !== "credit") {
      // When changing to credit plan, set default credit if not specified
      if (credit === undefined) {
        appKey.credit = 100;
      }
    }
  }

  // Update expiry date if provided and not a free plan
  if (expiryDays && appKey.plan.type !== "free") {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));
    expiresAt.setHours(23, 59, 59, 999);
    appKey.expiresAt = expiresAt;
  }

  // Update credit if provided (and not subscription plan)
  if (credit !== undefined && appKey.plan.type !== "subscription") {
    appKey.credit = parseInt(credit);
  }

  await appKey.save();

  return new ApiResponse(200, true, "App user updated successfully", {
    appKey: appKey.key,
    expiresAt: appKey.expiresAt,
    plan: appKey.plan,
    username: appKey.username,
    isActive: appKey.isActive,
    credit: appKey.credit,
  }).send(res);
});

const deleteAppKey = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  const appKey = await AppKey.findOneAndDelete({
    username,
  });

  if (!appKey) {
    throw new ApiError(404, "API key not found");
  }

  return new ApiResponse(200, true, "API key deleted successfully").send(res);
});

const getAllAppKeys = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const query = {
    $or: [
      { username: { $regex: search, $options: "i" } },
      { key: { $regex: search, $options: "i" } },
    ],
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [appKeysRaw, total] = await Promise.all([
    AppKey.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    AppKey.countDocuments(query),
  ]);

  // Enrich each appKey with plan.name (if plan.id exists)
  const appKeys = await Promise.all(
    appKeysRaw.map(async (appKey) => {
      const enrichedPlan = { ...appKey.plan };
      if (appKey.plan?.id) {
        const plan = await AppPricing.findById(appKey.plan.id).select("name");
        enrichedPlan.name = plan?.name || null;
      }
      return {
        ...appKey.toObject(),
        plan: enrichedPlan,
      };
    })
  );

  return new ApiResponse(200, true, "API keys retrieved successfully", {
    appKeys,
    total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

const resetDevice = asyncHandler(async (req, res) => {
  const { key } = req.body;

  if (!key) {
    throw new ApiError(400, "API key is required.");
  }

  const appKey = await AppKey.findOne({ key });

  if (!appKey) {
    throw new ApiError(404, "API key not found.");
  }

  appKey.deviceId = null;
  await appKey.save();

  return new ApiResponse(200, true, "Device ID reset successfully.").send(res);
});

const updateAppKeyStatus = asyncHandler(async (req, res) => {
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
    return new ApiResponse(200, true, "API key suspended successfully.").send(
      res
    );
  }

  if (mode === "reactivate") {
    if (appKey.status !== "suspended") {
      throw new ApiError(400, "API key is not suspended.");
    }
    appKey.status = "active";
    appKey.suspendedAt = null;
    await appKey.save();
    return new ApiResponse(200, true, "API key reactivated successfully.").send(
      res
    );
  }

  throw new ApiError(400, "Invalid mode. Use 'suspend' or 'reactivate'.");
});

const addCredits = asyncHandler(async (req, res) => {
  const { key, credits } = req.body;

  if (!key || credits === undefined) {
    throw new ApiError(400, "API key and credits are required.");
  }

  const appKey = await AppKey.findOne({ key });

  if (!appKey) {
    throw new ApiError(404, "API key not found.");
  }

  appKey.credit += parseInt(credits);
  await appKey.save();

  return new ApiResponse(
    200,
    true,
    `${credits} credits added successfully. New balance: ${appKey.credit}`
  ).send(res);
});

const getStatistics = asyncHandler(async (req, res) => {
  const [
    totalKeys,
    activeKeys,
    suspendedKeys,
    keysByPlan,
    totalProcesses,
    avgProcessesPerKey,
    dailyNewKeys,
  ] = await Promise.all([
    AppKey.countDocuments(),
    AppKey.countDocuments({ isActive: true, status: "active" }),
    AppKey.countDocuments({ status: "suspended" }),
    AppKey.aggregate([
      {
        $group: {
          _id: "$plan.type",
          count: { $sum: 1 },
        },
      },
    ]),
    AppKey.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalProcess" },
        },
      },
    ]),
    AppKey.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: "$totalProcess" },
        },
      },
    ]),
    AppKey.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]),
  ]);

  return new ApiResponse(200, true, "Statistics retrieved successfully", {
    totalKeys,
    activeKeys,
    suspendedKeys,
    keysByPlan: keysByPlan.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {}),
    totalProcesses: totalProcesses[0]?.total || 0,
    avgProcessesPerKey: avgProcessesPerKey[0]?.average || 0,
    dailyNewKeys: dailyNewKeys.map(({ _id, count }) => ({
      date: _id,
      count,
    })),
  }).send(res);
});

const getUserDetailsByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;

  if (!key) {
    throw new ApiError(400, "API key is required");
  }

  const appKey = await AppKey.findOne({ key }).populate(
    "userId",
    "name email role createdAt"
  );

  if (!appKey) {
    throw new ApiError(404, "Invalid API key");
  }

  // Refresh daily credits for free plan
  appKey.refreshDailyCredits();
  await appKey.save();

  const user = appKey.userId;

  const payments = await AppPayment.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .select("trxID plan amount createdAt");

  const formattedPayments = payments.map((payment) => ({
    _id: payment._id,
    trxID: payment.trxID,
    plan: payment.plan,
    amount: payment.amount,
    createdAt: payment.createdAt,
  }));

  // Final response
  const remainingCredit = appKey.calculateCredit();
  const data = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    appKey: {
      ...appKey.toObject(),
      credit: remainingCredit,
      isValid: appKey.isValid(),
    },
    payments: formattedPayments,
  };

  return new ApiResponse(
    200,
    true,
    "User details fetched successfully",
    data
  ).send(res);
});

const validateAppKey = asyncHandler(async (req, res) => {
  const key = req.header("x-api-key");
  const deviceId = req.header("x-device-id");
  const { processCount } = req.body;

  if (!key) {
    throw new ApiError(400, "API key is required in headers.");
  }

  if (!deviceId) {
    throw new ApiError(400, "Device ID is required in headers.");
  }

  // Ensure processCount is a valid number
  const count = parseInt(processCount);
  if (isNaN(count) || count < 1) {
    throw new ApiError(
      400,
      "Valid process count is required (must be a positive number)."
    );
  }

  const appKey = await AppKey.findOne({ key });

  if (!appKey) {
    throw new ApiError(404, "API key not found.");
  }

  // Check if API key is valid
  if (!appKey.isValid()) {
    if (appKey.status === "suspended") {
      throw new ApiError(403, "Account has been suspended.");
    }
    throw new ApiError(403, "API key is not valid or active.");
  }

  // Set deviceId if not already set
  if (!appKey.deviceId) {
    appKey.deviceId = deviceId;
    await appKey.save();
  } else if (appKey.deviceId !== deviceId) {
    throw new ApiError(403, "Account is already used on another device.");
  }

  // Check if can process the request
  if (!appKey.canProcess(count)) {
    const limit = appKey.plan.type === "free" ? 10 : appKey.credit;

    throw new ApiError(
      429,
      `You need ${count} credits but have ${limit} remaining.`
    );
  }

  // Calculate expiresIn only for non-free plans
  const now = new Date();
  const expiresIn =
    appKey.plan.type !== "free" && appKey.expiresAt
      ? Math.max(
          0,
          Math.floor((appKey.expiresAt - now) / (1000 * 60 * 60 * 24))
        )
      : null;

  const aiApiSecret = appKey.plan.type === "credit" ? config.encoderKey : null;

  return new ApiResponse(200, true, "API key is valid and process allowed.", {
    username: appKey.username,
    plan: appKey.plan,
    totalProcess: appKey.totalProcess,
    expiresAt: appKey.plan.type === "free" ? null : appKey.expiresAt,
    expiresIn,
    aiApiSecret,
    deviceId: appKey.deviceId,
    remainingCredit: appKey.credit,
  }).send(res);
});

const getAppKeyStats = asyncHandler(async (req, res) => {
  const key = req.header("x-api-key");

  if (!key) {
    throw new ApiError(400, "API key is required.");
  }

  const appKey = await AppKey.findOne({ key }).populate("userId", "name email");

  if (!appKey) {
    throw new ApiError(404, "API key not found.");
  }

  // Check if API key is valid and refresh daily credits if needed
  const isValid = appKey.isValid();
  await appKey.save();

  // Calculate expiresIn only for non-free plans
  const now = new Date();
  const expiresIn =
    appKey.plan.type !== "free" && appKey.expiresAt
      ? Math.max(
          0,
          Math.floor((appKey.expiresAt - now) / (1000 * 60 * 60 * 24))
        )
      : null;
  const encryptedKey = await AiAPI.findOne();
  const aiApiKey =
    appKey.plan.type === "credit" ? encryptedKey.ai_api_key : null;

  const remainingCredit = appKey.calculateCredit();

  return new ApiResponse(200, true, "User stats retrieved successfully", {
    plan: appKey.plan,
    username: appKey.username,
    status: appKey.status,
    isValid,
    expiresAt: appKey.plan.type === "free" ? null : appKey.expiresAt,
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
  const deviceId = req.header("x-device-id");
  const { processCount } = req.body;

  if (!key) {
    throw new ApiError(400, "API key is required in headers.");
  }

  if (!deviceId) {
    throw new ApiError(400, "Device ID is required in headers.");
  }

  const count = parseInt(processCount);
  if (isNaN(count) || count < 1) {
    throw new ApiError(400, "Valid process count is required.");
  }

  const appKey = await AppKey.findOne({ key });

  if (!appKey) {
    throw new ApiError(404, "API key not found.");
  }

  // Check if API key is valid before processing
  if (!appKey.isValid()) {
    throw new ApiError(403, "API key is not valid or active.");
  }

  // Try using credit and updating process stats
  try {
    await appKey.useCredit(count);
  } catch (error) {
    throw new ApiError(429, error.message);
  }

  return new ApiResponse(200, true, "Credits used and processing counted.", {
    plan: appKey.plan,
    remainingCredit: appKey.calculateCredit(),
    totalProcess: appKey.totalProcess,
    dailyProcess: Object.fromEntries(appKey.dailyProcess),
    monthlyProcess: Object.fromEntries(appKey.monthlyProcess),
  }).send(res);
});

export {
  createAppKey,
  updateAppKey,
  deleteAppKey,
  getAllAppKeys,
  validateAppKey,
  getAppKeyStats,
  resetDevice,
  updateAppKeyStatus,
  getStatistics,
  getUserDetailsByKey,
  addCredits,
};
