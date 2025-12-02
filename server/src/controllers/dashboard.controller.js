import { AppKey } from "../models/appKey.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import dayjs from "dayjs";

// GET /overview
export const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const todayStr = dayjs(now).format("YYYY-MM-DD");
  const currentMonthKey = dayjs(now).format("YYYY-MM");

  // Parallel queries - optimized
  const [appKey, user, paymentStats] = await Promise.all([
    AppKey.findOne({ userId }).select(
      "plan monthlyProcess dailyProcess totalProcess credit status isActive expiresAt"
    ),
    User.findById(userId).select("name email isVerified loginProvider"),
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
          last5: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                trxID: 1,
                plan: 1,
                amount: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]),
  ]);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Extract payment stats
  const totalSpent = paymentStats[0]?.totalSpent[0]?.total || 0;
  const last5Payments = paymentStats[0]?.last5 || [];

  // Monthly and daily processing maps
  const monthlyProcess = appKey?.monthlyProcess || new Map();
  const dailyProcess = appKey?.dailyProcess || new Map();

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

  const planType = appKey?.plan?.type || "free";
  const planId = appKey?.plan?.id || null;
  const expiresAt = appKey?.expiresAt || null;
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
    appKey: {
      exists: !!appKey,
      totalProcess: appKey?.totalProcess || 0,
      todayUsage: dailyProcess.get(todayStr) || 0,
      thisMonthUsage: monthlyProcess.get(currentMonthKey) || 0,
      last6MonthProcess,
      last7DaysProcess,
      creditRemaining:
        planType === "subscription" ? Infinity : appKey?.credit || 0,
      planType,
      planId,
      expiresAt,
      daysLeft,
      isSuspended: appKey?.status === "suspended" || false,
      isManuallyDisabled: appKey?.isActive === false || false,
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

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [user, appKeyData] = await Promise.all([
    User.findById(userId).select("-password -__v"),
    AppKey.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: "apppricings",
          let: { planId: "$plan.id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$_id" }, { $toString: "$$planId" }],
                },
              },
            },
            { $project: { name: 1 } },
          ],
          as: "planInfo",
        },
      },
      {
        $project: {
          plan: 1,
          totalProcess: 1,
          credit: 1,
          isActive: 1,
          status: 1,
          expiresAt: 1,
          planName: {
            $arrayElemAt: ["$planInfo.name", 0],
          },
        },
      },
    ]),
  ]);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const appKey = appKeyData[0] || null;

  const profile = {
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    loginProvider: user.loginProvider,
    isVerified: user.isVerified,
    isDisabled: user.isDisabled,
    createdAt: user.createdAt,
    role: user.role,
    appKey: appKey
      ? {
          plan: {
            ...appKey.plan,
            name: appKey.planName,
          },
          totalProcess: appKey.totalProcess,
          credit:
            appKey.plan?.type === "subscription" ? Infinity : appKey.credit,
          isActive: appKey.isActive,
          status: appKey.status,
          expiresAt: appKey.expiresAt,
        }
      : null,
  };

  return new ApiResponse(
    200,
    true,
    "Profile fetched successfully",
    profile
  ).send(res);
});
