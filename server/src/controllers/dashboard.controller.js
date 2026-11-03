import { AppKey } from "../models/appKey.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import dayjs from "dayjs";
import ApiError from "../utils/api.error.js";

export const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const todayStr = dayjs(now).format("YYYY-MM-DD");
  const currentMonthKey = dayjs(now).format("YYYY-MM");

  const [appKey, user, paymentStats, orders] = await Promise.all([
    AppKey.findOne({ userId }).select(
      "key plan monthlyProcess dailyProcess totalProcess credit status isActive expiresAt"
    ),
    User.findById(userId).select("name email isVerified loginProvider avatar role createdAt"),
    AppPayment.aggregate([
      { $match: { userId } },
      {
        $facet: {
          totalSpent: [
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
              },
            },
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 1,
                trxID: 1,
                plan: 1,
                amount: 1,
                status: 1,
                createdAt: 1,
                source: { $literal: "payment" },
              },
            },
          ],
        },
      },
    ]),
    Order.find({ userId, status: "completed" })
      .select("planSnapshot amount status createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const totalSpentFromPayments = paymentStats[0]?.totalSpent[0]?.total || 0;
  const recentPayments = paymentStats[0]?.recent || [];

  const recentOrders = orders.map((order) => ({
    _id: order._id,
    trxID: order._id.toString().slice(-10),
    plan: {
      name: order.planSnapshot?.name || "Unknown",
      type: order.planSnapshot?.type || "N/A",
    },
    amount: order.amount,
    status: order.status,
    createdAt: order.createdAt,
    source: "order",
  }));

  const combinedHistory = [...recentPayments, ...recentOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const totalSpentFromOrders = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
  const totalSpent = totalSpentFromPayments + totalSpentFromOrders;

  const monthlyProcess = appKey?.monthlyProcess || new Map();
  const dailyProcess = appKey?.dailyProcess || new Map();

  const last6MonthProcess = Array.from({ length: 6 })
    .map((_, i) => {
      const d = dayjs(now).subtract(i, "month").format("YYYY-MM");
      return { month: d, count: monthlyProcess.get(d) || 0 };
    })
    .reverse();

  const last7DaysProcess = Array.from({ length: 7 })
    .map((_, i) => {
      const d = dayjs(now).subtract(i, "day").format("YYYY-MM-DD");
      return { date: d, count: dailyProcess.get(d) || 0 };
    })
    .reverse();

  const remainingDays = appKey?.expiresAt
    ? Math.max(0, Math.ceil((new Date(appKey.expiresAt) - now) / (1000 * 60 * 60 * 24)))
    : null;

  return new ApiResponse(200, true, "Overview data retrieved", {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    },
    plan: appKey?.plan || { type: "free" },
    credit: appKey?.credit || 0,
    remainingDays,
    totalSpent,
    totalProcess: appKey?.totalProcess || 0,
    todayProcess: dailyProcess.get(todayStr) || 0,
    currentMonthProcess: monthlyProcess.get(currentMonthKey) || 0,
    last6MonthProcess,
    last7DaysProcess,
    recentHistory: combinedHistory,
    // App ID / License Information
    appId: {
      exists: !!appKey,
      id: appKey?.key || null,
      key: appKey?.key || null,
      totalProcess: appKey?.totalProcess || 0,
      todayUsage: dailyProcess.get(todayStr) || 0,
      thisMonthUsage: monthlyProcess.get(currentMonthKey) || 0,
      last6MonthProcess,
      last7DaysProcess,
      creditRemaining: appKey?.credit ?? 0,
      planType: appKey?.plan?.type || "free",
      planId: appKey?.plan?.id || null,
      expiresAt: appKey?.expiresAt || null,
      daysLeft: remainingDays,
      isSuspended: appKey?.status === "suspended",
      isManuallyDisabled: appKey ? !appKey.isActive : false,
    },
    // Backward compatibility object
    appKey: {
      exists: !!appKey,
      key: appKey?.key || null,
      totalProcess: appKey?.totalProcess || 0,
      todayUsage: dailyProcess.get(todayStr) || 0,
      thisMonthUsage: monthlyProcess.get(currentMonthKey) || 0,
      last6MonthProcess,
      last7DaysProcess,
      creditRemaining: appKey?.credit ?? 0,
      planType: appKey?.plan?.type || "free",
      planId: appKey?.plan?.id || null,
      expiresAt: appKey?.expiresAt || null,
      daysLeft: remainingDays,
      isSuspended: appKey?.status === "suspended",
      isManuallyDisabled: appKey ? !appKey.isActive : false,
    },
    payments: {
      totalSpent,
      last5Payments: recentPayments.map((p) => ({
        id: p._id,
        trxID: p.trxID,
        plan: {
          id: p.plan?._id || "",
          type: p.plan?.type || "subscription",
        },
        amount: p.amount,
        createdAt: p.createdAt,
      })),
    },
  }).send(res);
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password -refreshToken -verificationToken")
    .populate("referred", "referralCode");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const appKey = await AppKey.findOne({ userId: user._id }).select(
    "key plan credit status expiresAt isActive totalProcess"
  );

  const userObj = user.toObject();

  return new ApiResponse(200, true, "Profile retrieved successfully", {
    ...userObj,
    user: userObj,
    appId: appKey,
    appKey,
  }).send(res);
});
