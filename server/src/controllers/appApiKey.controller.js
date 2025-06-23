import { ApiKey } from "../models/appApiKey.model.js";
import crypto from "crypto";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { AppPayment } from "../models/appPayment.model.js";
import { AiAPI } from "../models/aiApiKey.model.js";
import config from "../config/index.js";

export function generateApiKey() {
  const buffer = crypto.randomBytes(32);
  const timestamp = Date.now().toString();
  const uuid = uuidv4();

  // Combine the random bytes, timestamp, and UUID
  const combined = buffer.toString("hex") + timestamp + uuid;

  // Create a hash of the combined string
  return crypto.createHash("sha256").update(combined).digest("hex");
}

const createApiKey = asyncHandler(async (req, res) => {
  const { username, expiryDays = 3, plan = "free" } = req.body;

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
  const existingApiKey = await ApiKey.findOne({ userId });
  if (existingApiKey) {
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
    // For credit plan, we need to set initial credit amount
    credit = parseInt(req.body.initialCredit) || 0;

    // Only set expiry for credit plan if specified
    if (expiryDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
      expiryDate.setHours(23, 59, 59, 999);
      expiresAt = expiryDate;
    }
  } else if (planType === "subscription") {
    // For subscription plan, always set expiry
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
    expiryDate.setHours(23, 59, 59, 999);
    expiresAt = expiryDate;
  }

  // Create new API key document
  const newApiKey = new ApiKey({
    userId,
    username,
    key: generateApiKey(),
    expiresAt,
    plan: planObject,
    credit,
    lastCreditRefresh: today,
    // Initialize monthly and daily process
    monthlyProcess: new Map([[today.substring(0, 7), 0]]),
    dailyProcess: new Map([[today, 0]]),
  });

  await newApiKey.save();

  return new ApiResponse(201, true, "API key created successfully.", {
    apiKey: newApiKey.key,
    expiresAt: newApiKey.expiresAt,
    plan: newApiKey.plan,
    username,
    isActive: newApiKey.isActive,
    credit: newApiKey.credit,
  }).send(res);
});

const updateApiKey = asyncHandler(async (req, res) => {
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

  const apiKey = await ApiKey.findOne({ username });
  if (!apiKey) {
    throw new ApiError(404, "API key not found");
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
    apiKey.plan = typeof plan === "object" ? plan : { type: plan };

    // If downgrading to free plan, handle accordingly
    if (apiKey.plan.type === "free") {
      apiKey.expiresAt = undefined;
      apiKey.credit = 10;
      apiKey.lastCreditRefresh = new Date().toISOString().split("T")[0];
    }
  }

  // Update expiry date if provided and not a free plan
  if (expiryDays && apiKey.plan.type !== "free") {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));
    expiresAt.setHours(23, 59, 59, 999);
    apiKey.expiresAt = expiresAt;
  }

  // Update credit if provided
  if (credit !== undefined) {
    apiKey.credit = parseInt(credit);
  }

  await apiKey.save();

  return new ApiResponse(200, true, "API key updated successfully", {
    apiKey: apiKey.key,
    expiresAt: apiKey.expiresAt,
    plan: apiKey.plan,
    username: apiKey.username,
    isActive: apiKey.isActive,
    credit: apiKey.credit,
  }).send(res);
});

const deleteApiKey = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  const apiKey = await ApiKey.findOneAndDelete({
    username,
  });

  if (!apiKey) {
    throw new ApiError(404, "API key not found");
  }

  return new ApiResponse(200, true, "API key deleted successfully").send(res);
});

const getAllApiKeys = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const query = {
    $or: [
      { username: { $regex: search, $options: "i" } },
      { key: { $regex: search, $options: "i" } },
    ],
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [apiKeys, total] = await Promise.all([
    ApiKey.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ApiKey.countDocuments(query),
  ]);

  return new ApiResponse(200, true, "API keys retrieved successfully", {
    apiKeys,
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

  const apiKey = await ApiKey.findOne({ key });

  if (!apiKey) {
    throw new ApiError(404, "API key not found.");
  }

  apiKey.deviceId = null;
  await apiKey.save();

  return new ApiResponse(200, true, "Device ID reset successfully.").send(res);
});

const updateApiKeyStatus = asyncHandler(async (req, res) => {
  const { key, mode } = req.body;

  if (!key || !mode) {
    throw new ApiError(400, "API key and mode are required.");
  }

  const apiKey = await ApiKey.findOne({ key });

  if (!apiKey) {
    throw new ApiError(404, "API key not found.");
  }

  if (mode === "suspend") {
    if (apiKey.status === "suspended") {
      throw new ApiError(400, "API key is already suspended.");
    }
    apiKey.status = "suspended";
    apiKey.suspendedAt = new Date();
    await apiKey.save();
    return new ApiResponse(200, true, "API key suspended successfully.").send(
      res
    );
  }

  if (mode === "reactivate") {
    if (apiKey.status !== "suspended") {
      throw new ApiError(400, "API key is not suspended.");
    }
    apiKey.status = "active";
    apiKey.suspendedAt = null;
    await apiKey.save();
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

  const apiKey = await ApiKey.findOne({ key });

  if (!apiKey) {
    throw new ApiError(404, "API key not found.");
  }

  apiKey.credit += parseInt(credits);
  await apiKey.save();

  return new ApiResponse(
    200,
    true,
    `${credits} credits added successfully. New balance: ${apiKey.credit}`
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
    ApiKey.countDocuments(),
    ApiKey.countDocuments({ isActive: true, status: "active" }),
    ApiKey.countDocuments({ status: "suspended" }),
    ApiKey.aggregate([
      {
        $group: {
          _id: "$plan.type",
          count: { $sum: 1 },
        },
      },
    ]),
    ApiKey.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalProcess" },
        },
      },
    ]),
    ApiKey.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: "$totalProcess" },
        },
      },
    ]),
    ApiKey.aggregate([
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

const getPaymentsHistory = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    userId,
    startDate,
    endDate,
  } = req.query;

  const query = {};

  if (search) {
    const userMatch = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    const matchedUserIds = userMatch.map((u) => u._id);

    query.$or = [
      { trxID: { $regex: search, $options: "i" } },
      { paymentID: { $regex: search, $options: "i" } },
      { userId: { $in: matchedUserIds } },
    ];
  }

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    query.userId = userId;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await AppPayment.countDocuments(query);

  const payments = await AppPayment.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate("userId", "name email");

  // Format response data with only key fields
  const formattedPayments = payments.map((payment) => ({
    _id: payment._id,
    user: {
      _id: payment.userId?._id,
      name: payment.userId?.name,
      email: payment.userId?.email,
    },
    paymentID: payment.paymentID,
    trxID: payment.trxID,
    plan: payment.plan,
    amount: payment.amount,
    createdAt: payment.createdAt,
    transactionStatus: payment.paymentDetails?.transactionStatus,
  }));

  return new ApiResponse(200, true, "Payments fetched successfully", {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
    payments: formattedPayments,
  }).send(res);
});

const getUserDetailsByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;

  if (!key) {
    throw new ApiError(400, "API key is required");
  }

  const apiKey = await ApiKey.findOne({ key }).populate(
    "userId",
    "name email role createdAt"
  );

  if (!apiKey) {
    throw new ApiError(404, "Invalid API key");
  }

  // Refresh daily credits for free plan
  apiKey.refreshDailyCredits();
  await apiKey.save();

  const user = apiKey.userId;

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
  const remainingCredit = apiKey.calculateCredit();
  const data = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    apiKey: {
      ...apiKey.toObject(),
      credit: remainingCredit,
      isValid: apiKey.isValid(),
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

const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // === 1. PAYMENTS ===
  const allPayments = await AppPayment.find({});
  const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);

  const currentMonthRevenue = allPayments
    .filter((p) => new Date(p.createdAt) >= thisMonth)
    .reduce((sum, p) => sum + p.amount, 0);

  const lastMonthRevenue = allPayments
    .filter(
      (p) =>
        new Date(p.createdAt) >= lastMonth && new Date(p.createdAt) < thisMonth
    )
    .reduce((sum, p) => sum + p.amount, 0);

  const revenueGrowth =
    lastMonthRevenue === 0
      ? null
      : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

  // === 2. API KEYS ===
  const totalApiKeys = await ApiKey.countDocuments();
  const activeApiKeys = await ApiKey.countDocuments({
    isActive: true,
    status: "active",
  });
  const activePremiumKeys = await ApiKey.countDocuments({
    isActive: true,
    status: "active",
    "plan.type": { $ne: "free" },
    expiresAt: { $gt: now },
  });
  const newApiKeysThisMonth = await ApiKey.countDocuments({
    createdAt: { $gte: thisMonth },
  });

  const apiKeys = await ApiKey.find({});
  const monthlyProcessList = {};
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyProcessList[monthKey] = 0;
  }

  apiKeys.forEach((apiKey) => {
    if (!apiKey.monthlyProcess) return;
    for (const [month, count] of apiKey.monthlyProcess.entries()) {
      if (monthlyProcessList[month] !== undefined) {
        monthlyProcessList[month] += count;
      }
    }
  });

  // === 3. USERS ===
  const totalUsers = await User.countDocuments();
  const newUsersThisMonth = await User.countDocuments({
    createdAt: { $gte: thisMonth },
  });

  // === 4. MONTHLY REVENUE LIST (last 6 months) ===
  const monthlyRevenueList = {};
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenueList[monthKey] = 0;
  }

  allPayments.forEach((payment) => {
    const createdAt = new Date(payment.createdAt);
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyRevenueList[key] !== undefined) {
      monthlyRevenueList[key] += payment.amount;
    }
  });

  // === 5. RECENT 5 PAYMENTS ===
  const recentPayments = await AppPayment.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("userId", "name email")
    .select("amount createdAt userId");

  const monthlyNewPayments = await AppPayment.countDocuments({
    createdAt: { $gte: thisMonth },
  });

  // === 6. RESPONSE ===
  return new ApiResponse(
    200,
    true,
    "Admin dashboard statistics retrieved successfully",
    {
      revenue: {
        total: totalRevenue,
        currentMonth: currentMonthRevenue,
        lastMonth: lastMonthRevenue,
        growthPercentage: revenueGrowth,
        monthlyRevenueList,
      },
      apiKeys: {
        total: totalApiKeys,
        newThisMonth: newApiKeysThisMonth,
        active: activeApiKeys,
        activePremium: activePremiumKeys,
        monthlyProcessList,
      },
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      payments: {
        total: allPayments.length,
        newThisMonth: monthlyNewPayments,
        recent: recentPayments,
      },
    }
  ).send(res);
});

const validateApiKey = asyncHandler(async (req, res) => {
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

  const apiKey = await ApiKey.findOne({ key });

  if (!apiKey) {
    throw new ApiError(404, "API key not found.");
  }

  // Check if API key is valid
  if (!apiKey.isValid()) {
    if (apiKey.status === "suspended") {
      throw new ApiError(403, "Account has been suspended.");
    }
    throw new ApiError(403, "API key is not valid or active.");
  }

  // Set deviceId if not already set
  if (!apiKey.deviceId) {
    apiKey.deviceId = deviceId;
    await apiKey.save();
  } else if (apiKey.deviceId !== deviceId) {
    throw new ApiError(403, "Account is already used on another device.");
  }

  // Check if can process the request
  if (!apiKey.canProcess(count)) {
    const limit = apiKey.plan.type === "free" ? 10 : apiKey.credit;

    throw new ApiError(
      429,
      `You need ${count} credits but have ${limit} remaining.`
    );
  }

  // Calculate expiresIn only for non-free plans
  const now = new Date();
  const expiresIn =
    apiKey.plan.type !== "free" && apiKey.expiresAt
      ? Math.max(
          0,
          Math.floor((apiKey.expiresAt - now) / (1000 * 60 * 60 * 24))
        )
      : null;

  const aiApiSecret =
    apiKey.plan.type === "credit" ? config.geminiEncoderKey : null;

  return new ApiResponse(200, true, "API key is valid and process allowed.", {
    username: apiKey.username,
    plan: apiKey.plan,
    totalProcess: apiKey.totalProcess,
    expiresAt: apiKey.plan.type === "free" ? null : apiKey.expiresAt,
    expiresIn,
    aiApiSecret,
    deviceId: apiKey.deviceId,
    remainingCredit: apiKey.credit,
  }).send(res);
});

const getApiKeyStats = asyncHandler(async (req, res) => {
  const key = req.header("x-api-key");

  if (!key) {
    throw new ApiError(400, "API key is required.");
  }

  const apiKey = await ApiKey.findOne({ key }).populate("userId", "name email");

  if (!apiKey) {
    throw new ApiError(404, "API key not found.");
  }

  // Check if API key is valid and refresh daily credits if needed
  const isValid = apiKey.isValid();
  await apiKey.save();

  // Calculate expiresIn only for non-free plans
  const now = new Date();
  const expiresIn =
    apiKey.plan.type !== "free" && apiKey.expiresAt
      ? Math.max(
          0,
          Math.floor((apiKey.expiresAt - now) / (1000 * 60 * 60 * 24))
        )
      : null;
  const encryptedKey = await AiAPI.findOne();
  const aiApiKey =
    apiKey.plan.type === "credit" ? encryptedKey.ai_api_key : null;

  const remainingCredit = apiKey.calculateCredit();

  return new ApiResponse(200, true, "User stats retrieved successfully", {
    plan: apiKey.plan,
    username: apiKey.username,
    status: apiKey.status,
    isValid,
    expiresAt: apiKey.plan.type === "free" ? null : apiKey.expiresAt,
    expiresIn,
    credit: remainingCredit,
    totalProcess: apiKey.totalProcess,
    aiApiKey,
    user: {
      name: apiKey.userId?.name,
      email: apiKey.userId?.email,
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

  const apiKey = await ApiKey.findOne({ key });

  if (!apiKey) {
    throw new ApiError(404, "API key not found.");
  }

  // Check if API key is valid before processing
  if (!apiKey.isValid()) {
    throw new ApiError(403, "API key is not valid or active.");
  }

  // Try using credit and updating process stats
  try {
    await apiKey.useCredit(count);
  } catch (error) {
    throw new ApiError(429, error.message);
  }

  return new ApiResponse(200, true, "Credits used and processing counted.", {
    plan: apiKey.plan,
    remainingCredit: apiKey.calculateCredit(),
    totalProcess: apiKey.totalProcess,
    dailyProcess: Object.fromEntries(apiKey.dailyProcess),
    monthlyProcess: Object.fromEntries(apiKey.monthlyProcess),
  }).send(res);
});

export {
  getAdminDashboardStats,
  getPaymentsHistory,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  getAllApiKeys,
  validateApiKey,
  getApiKeyStats,
  resetDevice,
  updateApiKeyStatus,
  getStatistics,
  getUserDetailsByKey,
  addCredits,
};
