import { AppUser } from "../models/appUser.model.js";
import { AppPayment } from "../models/appPayment.model.js";
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

  const [appUser, user, paymentStats] = await Promise.all([
    AppUser.findOne({ userId }).select(
      "key plan monthlyProcess dailyProcess totalProcess credit status isActive expiresAt allowedDevices devices maxDevices"
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
            { $limit: 5 },
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
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const totalSpent = paymentStats[0]?.totalSpent[0]?.total || 0;
  const recentPayments = paymentStats[0]?.recent || [];

  const monthlyProcess = appUser?.monthlyProcess || new Map();
  const dailyProcess = appUser?.dailyProcess || new Map();

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

  const remainingDays = appUser?.expiresAt
    ? Math.max(0, Math.ceil((new Date(appUser.expiresAt) - now) / (1000 * 60 * 60 * 24)))
    : null;

  const creditValue = appUser?.credit === Infinity ? null : appUser?.credit ?? 0;

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
    plan: appUser?.plan || { type: "free" },
    credit: creditValue,
    remainingDays,
    totalSpent,
    totalProcess: appUser?.totalProcess || 0,
    todayProcess: dailyProcess.get(todayStr) || 0,
    currentMonthProcess: monthlyProcess.get(currentMonthKey) || 0,
    last6MonthProcess,
    last7DaysProcess,
    recentHistory: recentPayments,
    appUser: {
      exists: !!appUser,
      key: appUser?.key || null,
      totalProcess: appUser?.totalProcess || 0,
      todayUsage: dailyProcess.get(todayStr) || 0,
      thisMonthUsage: monthlyProcess.get(currentMonthKey) || 0,
      last6MonthProcess,
      last7DaysProcess,
      creditRemaining: creditValue,
      planType: appUser?.plan?.type || "free",
      planId: appUser?.plan?.id || null,
      expiresAt: appUser?.expiresAt || null,
      daysLeft: remainingDays,
      isSuspended: appUser?.status === "suspended",
      isManuallyDisabled: appUser ? !appUser.isActive : false,
      allowedDevices: appUser?.allowedDevices || [],
      devices: appUser?.devices || [],
      maxDevices: appUser?.maxDevices || 2,
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

  const appUser = await AppUser.findOne({ userId: user._id }).select(
    "key plan credit status expiresAt isActive totalProcess"
  );

  const userObj = user.toObject();
  const appUserObj = appUser
    ? {
        ...appUser.toObject(),
        credit: appUser.credit === Infinity ? null : appUser.credit,
      }
    : null;

  return new ApiResponse(200, true, "Profile retrieved successfully", {
    ...userObj,
    user: userObj,
    appUser: appUserObj,
  }).send(res);
});
