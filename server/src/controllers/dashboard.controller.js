import { ApiKey } from "../models/appApiKey.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import dayjs from "dayjs";

// GET /overview
export const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [apiKey, user, payments] = await Promise.all([
    ApiKey.findOne({ userId }),
    User.findById(userId),
    AppPayment.find({ userId }).sort({ createdAt: -1 }),
  ]);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const now = new Date();
  const todayStr = dayjs(now).format("YYYY-MM-DD");
  const currentMonthKey = dayjs(now).format("YYYY-MM");

  // Payments
  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

  const last5Payments = payments.slice(0, 5).map((p) => ({
    id: p._id,
    trxID: p.trxID,
    plan: p.plan,
    amount: p.amount,
    createdAt: p.createdAt,
  }));

  // Monthly and daily processing maps
  const monthlyProcess = apiKey?.monthlyProcess || new Map();
  const dailyProcess = apiKey?.dailyProcess || new Map();

  // Last 6 months usage
  const last6MonthProcess = Array.from({ length: 6 })
    .map((_, i) => {
      const d = dayjs(now).subtract(i, "month").format("YYYY-MM");
      return { month: d, count: monthlyProcess.get(d) || 0 };
    })
    .reverse();

  // Last 7 days usage
  const last7DaysProcess = Array.from({ length: 7 })
    .map((_, i) => {
      const d = dayjs(now).subtract(i, "day").format("YYYY-MM-DD");
      return { day: d, count: dailyProcess.get(d) || 0 };
    })
    .reverse();

  const planType = apiKey?.plan?.type || "free";
  const planId = apiKey?.plan?.id || null;
  const expiresAt = apiKey?.expiresAt || null;
  const daysLeft = expiresAt
    ? Math.max(0, dayjs(expiresAt).diff(dayjs(), "day"))
    : null;

  const overview = {
    user: {
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      loginProvider: user.loginProvider,
    },
    apiKey: {
      exists: !!apiKey,
      totalProcess: apiKey?.totalProcess || 0,
      todayUsage: dailyProcess.get(todayStr) || 0,
      thisMonthUsage: monthlyProcess.get(currentMonthKey) || 0,
      last6MonthProcess,
      last7DaysProcess,
      creditRemaining:
        planType === "subscription" ? Infinity : apiKey?.credit || 0,
      webCreditRemaining: user.token?.available || 0,
      planType,
      planId,
      expiresAt,
      daysLeft,
      isSuspended: apiKey?.status === "suspended" || false,
      isManuallyDisabled: apiKey?.isActive === false || false,
    },
    payments: {
      totalSpent,
      last5Payments,
    },
  };

  return new ApiResponse(
    200,
    true,
    "Overview fetched successfully",
    overview
  ).send(res);
});
