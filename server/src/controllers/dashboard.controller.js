import { AppKey } from "../models/appKey.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { AppPricing } from "../models/appPricing.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import dayjs from "dayjs";

// GET /overview
export const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [appKey, user, payments] = await Promise.all([
    AppKey.findOne({ userId }),
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

  const [user, appKey] = await Promise.all([
    User.findById(userId).select("-password -__v"),
    AppKey.findOne({ userId }),
  ]);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  let planName = null;

  if (appKey?.plan?.id) {
    const planData = await AppPricing.findById(appKey.plan.id).select("name");
    planName = planData?.name || null;
  }

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
            name: planName,
          },
          totalProcess: appKey.totalProcess,
          credit:
            appKey.plan.type === "subscription" ? Infinity : appKey.credit,
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

// // GET /overview enhanced
// export const getOverview = asyncHandler(async (req, res) => {
//   const userId = req.user._id;

//   const [appKey, user, payments] = await Promise.all([
//     AppKey.findOne({ userId }),
//     User.findById(userId),
//     AppPayment.find({ userId }).sort({ createdAt: -1 }),
//   ]);

//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }

//   const now = new Date();
//   const todayStr = dayjs(now).format("YYYY-MM-DD");
//   const currentMonthKey = dayjs(now).format("YYYY-MM");

//   // Payments
//   const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

//   const last5Payments = payments.slice(0, 5).map((p) => ({
//     id: p._id,
//     trxID: p.trxID,
//     plan: p.plan,
//     amount: p.amount,
//     createdAt: p.createdAt,
//   }));

//   // Monthly and daily processing maps
//   const monthlyProcess = appKey?.monthlyProcess || new Map();
//   const dailyProcess = appKey?.dailyProcess || new Map();

//   // Last 6 months usage
//   const last6MonthProcess = Array.from({ length: 6 })
//     .map((_, i) => {
//       const d = dayjs(now).subtract(i, "month").format("YYYY-MM");
//       return { month: d, count: monthlyProcess.get(d) || 0 };
//     })
//     .reverse();

//   // Last 7 days usage
//   const last7DaysProcess = Array.from({ length: 7 })
//     .map((_, i) => {
//       const d = dayjs(now).subtract(i, "day").format("YYYY-MM-DD");
//       return { day: d, count: dailyProcess.get(d) || 0 };
//     })
//     .reverse();

//   // Plan details and logic
//   let currentPlan = {
//     type: "free",
//     id: null,
//     name: "Free Plan",
//     totalDays: null,
//     daysLeft: null,
//     totalCredits: null,
//     creditsLeft: 0,
//     expiresAt: null,
//   };

//   if (appKey) {
//     const planType = appKey.plan?.type || "free";
//     const planId = appKey.plan?.id || null;
//     const expiresAt = appKey.expiresAt ? dayjs(appKey.expiresAt) : null;

//     currentPlan.type = planType;
//     currentPlan.id = planId;
//     currentPlan.expiresAt = expiresAt?.toDate() || null;
//     currentPlan.creditsLeft = appKey.credit ?? 0;

//     if (planId) {
//       const matchedPlan = await AppPricing.findById(planId).lean();
//       if (matchedPlan) {
//         currentPlan.name = matchedPlan.name;

//         if (planType === "subscription") {
//           currentPlan.totalDays = matchedPlan.planDuration || null;
//           currentPlan.daysLeft = expiresAt
//             ? Math.max(0, expiresAt.diff(dayjs(), "day"))
//             : 0;
//         }

//         if (planType === "credit") {
//           currentPlan.totalCredits = matchedPlan.credit || 0;
//         }
//       }
//     } else if (planType === "free") {
//       currentPlan.name = "Free Plan";
//       currentPlan.creditsLeft = appKey.credit ?? 0;
//     }
//   }

//   const overview = {
//     user: {
//       name: user.name,
//       email: user.email,
//       isVerified: user.isVerified,
//       loginProvider: user.loginProvider,
//     },
//     appKey: {
//       exists: !!appKey,
//       totalProcess: appKey?.totalProcess || 0,
//       todayUsage: dailyProcess.get(todayStr) || 0,
//       thisMonthUsage: monthlyProcess.get(currentMonthKey) || 0,
//       last6MonthProcess,
//       last7DaysProcess,
//       plan: currentPlan,
//       isSuspended: appKey?.status === "suspended" || false,
//       isManuallyDisabled: appKey?.isActive === false || false,
//     },
//     payments: {
//       totalSpent,
//       last5Payments,
//     },
//   };

//   return new ApiResponse(
//     200,
//     true,
//     "Overview fetched successfully",
//     overview
//   ).send(res);
// });
