import mongoose from "mongoose";
import { AppUser } from "../models/appUser.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { AppPricing } from "../models/appPricing.model.js";
import { ApiUsageLog } from "../models/apiUsageLog.model.js";
import { User } from "../models/user.model.js";
import { Session } from "../models/session.model.js";
import { Referral } from "../models/referral.model.js";
import { ReferralWithdrawal } from "../models/referralWithdrawal.model.js";
import { BackupLog } from "../models/backupLog.model.js";
import { AiAPI } from "../models/aiApiKey.model.js";
import backupService from "../services/backup.service.js";
import schedulerService from "../services/scheduler.service.js";
import notificationService from "../services/notification/notification.service.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  PLAN_TYPES,
  USER_ROLES,
  WITHDRAWAL_STATUS,
} from "../constants/index.js";

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toUtcDateKey = (date) => new Date(date).toISOString().split("T")[0];
const toUtcMonthKey = (date) => new Date(date).toISOString().slice(0, 7);

function calcGrowthPercentage(current, previous) {
  if (previous > 0) {
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }
  return current > 0 ? 100 : 0;
}

async function reconcileExpiredPaidAppUsers(now = new Date()) {
  const stalePaidUsers = await AppUser.find({
    isActive: true,
    status: "active",
    $or: [
      { "plan.type": PLAN_TYPES.SUBSCRIPTION, expiresAt: { $lte: now } },
      { "plan.type": PLAN_TYPES.CREDIT, expiresAt: { $lte: now } },
      { "plan.type": PLAN_TYPES.CREDIT, credit: { $lte: 0 } },
    ],
  });

  if (stalePaidUsers.length === 0) {
    return 0;
  }

  await Promise.all(
    stalePaidUsers.map(async (doc) => {
      const reason =
        doc.plan?.type === PLAN_TYPES.SUBSCRIPTION
          ? "subscription_expired_refresh"
          : doc.expiresAt && now >= doc.expiresAt
          ? "credit_plan_expired_refresh"
          : "zero_credit_refresh";
      doc.downgradeToPlan(PLAN_TYPES.FREE, reason);
      await doc.save();
    })
  );

  return stalePaidUsers.length;
}

export const getAdminDashboardStats = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  const now = new Date();
  const isExplicitRefresh =
    req.query.refresh === "true" || req.query.refresh === "1";

  // On explicit refresh, reconcile active paid accounts whose plan expired or ran out of credits
  const syncedExpiredPlans = isExplicitRefresh
    ? await reconcileExpiredPaidAppUsers(now)
    : 0;

  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const thisMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const lastMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
  );
  const sevenDaysStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6)
  );
  const sixMonthsStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)
  );

  const last7DateKeys = Array.from({ length: 7 }, (_, i) =>
    toUtcDateKey(
      new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (6 - i))
      )
    )
  );

  const last6MonthKeys = Array.from({ length: 6 }, (_, i) =>
    toUtcMonthKey(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1))
    )
  );

  const isActiveAppUserExpr = {
    $and: [{ $eq: ["$isActive", true] }, { $eq: ["$status", "active"] }],
  };
  const hasExpiredDateExpr = {
    $and: [
      { $eq: [{ $type: "$expiresAt" }, "date"] },
      { $lte: ["$expiresAt", now] },
    ],
  };
  const isNotExpiredExpr = {
    $or: [
      { $ne: [{ $type: "$expiresAt" }, "date"] },
      { $gt: ["$expiresAt", now] },
    ],
  };

  const [
    paymentStats,
    appUserStats,
    usageLogStats,
    userStats,
    referralStats,
    topUsageDocs,
    topSpendersDocs,
    topReferrersDocs,
  ] = await Promise.all([
    // 1. Payments Aggregation
    AppPayment.aggregate([
      {
        $facet: {
          revenue: [
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
                today: {
                  $sum: {
                    $cond: [{ $gte: ["$createdAt", todayStart] }, "$amount", 0],
                  },
                },
                currentMonth: {
                  $sum: {
                    $cond: [{ $gte: ["$createdAt", thisMonth] }, "$amount", 0],
                  },
                },
                lastMonth: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ["$createdAt", lastMonth] },
                          { $lt: ["$createdAt", thisMonth] },
                        ],
                      },
                      "$amount",
                      0,
                    ],
                  },
                },
                avgOrderValue: { $avg: "$amount" },
                totalCount: { $sum: 1 },
                todayCount: {
                  $sum: {
                    $cond: [{ $gte: ["$createdAt", todayStart] }, 1, 0],
                  },
                },
                newThisMonth: {
                  $sum: {
                    $cond: [{ $gte: ["$createdAt", thisMonth] }, 1, 0],
                  },
                },
                lastMonthCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ["$createdAt", lastMonth] },
                          { $lt: ["$createdAt", thisMonth] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          monthlyRevenue: [
            { $match: { createdAt: { $gte: sixMonthsStart } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                amount: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ],
          dailyRevenue: [
            { $match: { createdAt: { $gte: sevenDaysStart } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                amount: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ],
          byPlanType: [
            {
              $group: {
                _id: { $ifNull: ["$plan.type", "other"] },
                amount: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "users",
                let: { uid: "$userId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
                  { $project: { _id: 1, name: 1, email: 1, avatar: 1 } },
                ],
                as: "user",
              },
            },
            {
              $project: {
                _id: 1,
                amount: 1,
                currency: 1,
                gateway: 1,
                status: 1,
                createdAt: 1,
                plan: 1,
                trxID: 1,
                paymentID: 1,
                userId: { $arrayElemAt: ["$user", 0] },
              },
            },
          ],
        },
      },
    ]),

    // 2. App User Aggregation
    AppUser.aggregate([
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                newThisMonth: {
                  $sum: { $cond: [{ $gte: ["$createdAt", thisMonth] }, 1, 0] },
                },
                active: {
                  $sum: { $cond: [isActiveAppUserExpr, 1, 0] },
                },
                suspended: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $eq: ["$status", "suspended"] },
                          { $eq: ["$isActive", false] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                subscriptionPlanCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          isActiveAppUserExpr,
                          { $eq: ["$plan.type", PLAN_TYPES.SUBSCRIPTION] },
                          isNotExpiredExpr,
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                creditPlanCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          isActiveAppUserExpr,
                          { $eq: ["$plan.type", PLAN_TYPES.CREDIT] },
                          isNotExpiredExpr,
                          { $gt: ["$credit", 0] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                freePlanCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          isActiveAppUserExpr,
                          { $eq: ["$plan.type", PLAN_TYPES.FREE] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                expiredPendingDowngrade: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          isActiveAppUserExpr,
                          {
                            $or: [
                              {
                                $and: [
                                  { $eq: ["$plan.type", PLAN_TYPES.SUBSCRIPTION] },
                                  hasExpiredDateExpr,
                                ],
                              },
                              {
                                $and: [
                                  { $eq: ["$plan.type", PLAN_TYPES.CREDIT] },
                                  {
                                    $or: [
                                      hasExpiredDateExpr,
                                      { $lte: ["$credit", 0] },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                totalDevices: {
                  $sum: {
                    $max: [
                      { $cond: [{ $isArray: "$devices" }, { $size: "$devices" }, 0] },
                      {
                        $cond: [
                          { $isArray: "$allowedDevices" },
                          { $size: "$allowedDevices" },
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
            },
          ],
          totalProcesses: [
            {
              $group: {
                _id: null,
                total: { $sum: { $ifNull: ["$totalProcess", 0] } },
                totalFailed: { $sum: { $ifNull: ["$totalFailedProcess", 0] } },
              },
            },
          ],
          monthlyProcesses: [
            {
              $project: {
                entries: {
                  $cond: [
                    { $eq: [{ $type: "$monthlyProcess" }, "object"] },
                    { $objectToArray: "$monthlyProcess" },
                    [],
                  ],
                },
              },
            },
            { $unwind: "$entries" },
            { $match: { "entries.k": { $in: last6MonthKeys } } },
            {
              $group: {
                _id: "$entries.k",
                count: {
                  $sum: {
                    $cond: [{ $isNumber: "$entries.v" }, "$entries.v", 0],
                  },
                },
              },
            },
          ],
          dailyProcesses: [
            {
              $project: {
                entries: {
                  $cond: [
                    { $eq: [{ $type: "$dailyProcess" }, "object"] },
                    { $objectToArray: "$dailyProcess" },
                    [],
                  ],
                },
              },
            },
            { $unwind: "$entries" },
            { $match: { "entries.k": { $in: last7DateKeys } } },
            {
              $group: {
                _id: "$entries.k",
                count: {
                  $sum: {
                    $cond: [{ $isNumber: "$entries.v" }, "$entries.v", 0],
                  },
                },
              },
            },
          ],
        },
      },
    ]),

    // 3. Normalized Usage Log Aggregation
    ApiUsageLog.aggregate([
      {
        $facet: {
          daily: [
            { $match: { date: { $in: last7DateKeys } } },
            {
              $group: {
                _id: "$date",
                count: {
                  $sum: {
                    $cond: [
                      { $gt: ["$fileCount", 0] },
                      "$fileCount",
                      { $ifNull: ["$processCount", 0] },
                    ],
                  },
                },
                failed: { $sum: { $ifNull: ["$failedCount", 0] } },
              },
            },
          ],
          monthly: [
            { $match: { date: { $gte: `${last6MonthKeys[0]}-01` } } },
            {
              $group: {
                _id: { $substrBytes: ["$date", 0, 7] },
                count: {
                  $sum: {
                    $cond: [
                      { $gt: ["$fileCount", 0] },
                      "$fileCount",
                      { $ifNull: ["$processCount", 0] },
                    ],
                  },
                },
                failed: { $sum: { $ifNull: ["$failedCount", 0] } },
              },
            },
          ],
        },
      },
    ]),

    // 4. User Aggregation
    User.aggregate([
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                verified: { $sum: { $cond: ["$isVerified", 1, 0] } },
                unverified: { $sum: { $cond: ["$isVerified", 0, 1] } },
                disabled: { $sum: { $cond: ["$isDisabled", 1, 0] } },
                newToday: {
                  $sum: { $cond: [{ $gte: ["$createdAt", todayStart] }, 1, 0] },
                },
                newThisMonth: {
                  $sum: { $cond: [{ $gte: ["$createdAt", thisMonth] }, 1, 0] },
                },
                newLastMonth: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ["$createdAt", lastMonth] },
                          { $lt: ["$createdAt", thisMonth] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]),

    // 5. Referral Aggregation
    Referral.aggregate([
      {
        $facet: {
          totals: [
            {
              $project: {
                availableBalance: { $ifNull: ["$availableBalance", 0] },
                referredCount: {
                  $cond: [
                    { $isArray: "$referredUsers" },
                    { $size: "$referredUsers" },
                    0,
                  ],
                },
                earnedAmount: {
                  $reduce: {
                    input: {
                      $cond: [
                        { $isArray: "$earnedHistory" },
                        "$earnedHistory",
                        [],
                      ],
                    },
                    initialValue: 0,
                    in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
                  },
                },
                pendingWithdrawalsList: {
                  $filter: {
                    input: {
                      $cond: [
                        { $isArray: "$withdrawHistory" },
                        "$withdrawHistory",
                        [],
                      ],
                    },
                    as: "w",
                    cond: { $eq: ["$$w.status", WITHDRAWAL_STATUS.PENDING] },
                  },
                },
                completedWithdrawalsList: {
                  $filter: {
                    input: {
                      $cond: [
                        { $isArray: "$withdrawHistory" },
                        "$withdrawHistory",
                        [],
                      ],
                    },
                    as: "w",
                    cond: { $eq: ["$$w.status", WITHDRAWAL_STATUS.COMPLETED] },
                  },
                },
              },
            },
            {
              $group: {
                _id: null,
                totalReferrers: { $sum: 1 },
                totalReferredUsers: { $sum: "$referredCount" },
                totalAvailable: { $sum: "$availableBalance" },
                totalEarned: { $sum: "$earnedAmount" },
                pendingWithdrawalsCount: {
                  $sum: { $size: "$pendingWithdrawalsList" },
                },
                pendingWithdrawalsAmount: {
                  $sum: {
                    $reduce: {
                      input: "$pendingWithdrawalsList",
                      initialValue: 0,
                      in: {
                        $add: ["$$value", { $ifNull: ["$$this.amount", 0] }],
                      },
                    },
                  },
                },
                completedWithdrawalsAmount: {
                  $sum: {
                    $reduce: {
                      input: "$completedWithdrawalsList",
                      initialValue: 0,
                      in: {
                        $add: ["$$value", { $ifNull: ["$$this.amount", 0] }],
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ]),

    // 6. Top Usage (AppUser)
    AppUser.find({ totalProcess: { $gt: 0 } })
      .select("userId username plan totalProcess totalFailedProcess status")
      .populate("userId", "name email avatar")
      .sort({ totalProcess: -1 })
      .limit(5)
      .lean(),

    // 7. Top Spenders
    AppPayment.aggregate([
      {
        $group: {
          _id: "$userId",
          totalSpent: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
          lastPaymentAt: { $max: "$createdAt" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          let: { uid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
            { $project: { _id: 1, name: 1, email: 1, avatar: 1 } },
          ],
          as: "user",
        },
      },
      {
        $project: {
          _id: 1,
          totalSpent: 1,
          paymentCount: 1,
          lastPaymentAt: 1,
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
    ]),

    // 8. Top Referrers
    Referral.aggregate([
      {
        $project: {
          referrer: 1,
          referralCode: 1,
          referredCount: {
            $cond: [
              { $isArray: "$referredUsers" },
              { $size: "$referredUsers" },
              0,
            ],
          },
          availableBalance: { $ifNull: ["$availableBalance", 0] },
          totalEarned: {
            $reduce: {
              input: {
                $cond: [
                  { $isArray: "$earnedHistory" },
                  "$earnedHistory",
                  [],
                ],
              },
              initialValue: 0,
              in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
            },
          },
        },
      },
      {
        $match: {
          $or: [{ referredCount: { $gt: 0 } }, { totalEarned: { $gt: 0 } }],
        },
      },
      { $sort: { referredCount: -1, totalEarned: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          let: { uid: "$referrer" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
            { $project: { _id: 1, name: 1, email: 1, avatar: 1 } },
          ],
          as: "user",
        },
      },
      {
        $project: {
          _id: 1,
          referrer: 1,
          referralCode: 1,
          referredCount: 1,
          availableBalance: 1,
          totalEarned: 1,
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
    ]),
  ]);

  // Normalize payment stats
  const paymentFacet = paymentStats[0] || {};
  const revData = paymentFacet.revenue?.[0] || {
    total: 0,
    today: 0,
    currentMonth: 0,
    lastMonth: 0,
    avgOrderValue: 0,
    totalCount: 0,
    todayCount: 0,
    newThisMonth: 0,
    lastMonthCount: 0,
  };

  const monthlyRevenueRows = new Map(
    (paymentFacet.monthlyRevenue || []).map((item) => [
      item._id,
      { amount: item.amount || 0, count: item.count || 0 },
    ])
  );
  const dailyRevenueRows = new Map(
    (paymentFacet.dailyRevenue || []).map((item) => [
      item._id,
      { amount: item.amount || 0, count: item.count || 0 },
    ])
  );

  const monthlyRevenueMap = {};
  const last6MonthRevenue = last6MonthKeys.map((month) => {
    const entry = monthlyRevenueRows.get(month) || { amount: 0, count: 0 };
    monthlyRevenueMap[month] = entry.amount;
    return { month, amount: entry.amount, count: entry.count };
  });

  const last7DaysRevenue = last7DateKeys.map((date) => {
    const entry = dailyRevenueRows.get(date) || { amount: 0, count: 0 };
    return { date, amount: entry.amount, count: entry.count };
  });

  const byPlanType = {
    subscription: { amount: 0, count: 0 },
    credit: { amount: 0, count: 0 },
    other: { amount: 0, count: 0 },
  };
  for (const row of paymentFacet.byPlanType || []) {
    const key =
      row._id === PLAN_TYPES.SUBSCRIPTION || row._id === PLAN_TYPES.CREDIT
        ? row._id
        : "other";
    byPlanType[key].amount += row.amount || 0;
    byPlanType[key].count += row.count || 0;
  }

  const recentPayments = (paymentFacet.recent || []).map((item) => ({
    _id: item._id,
    trxID: item.trxID || "",
    paymentID: item.paymentID || "",
    amount: item.amount || 0,
    currency: item.currency || "BDT",
    gateway: item.gateway || "paystation",
    status: item.status || "Completed",
    plan: {
      id: item.plan?.id || "",
      name: item.plan?.name || item.plan?.type || "Standard",
      type: item.plan?.type || "subscription",
    },
    createdAt: item.createdAt,
    userId: item.userId || {
      _id: "",
      name: "Unknown User",
      email: "N/A",
      avatar: null,
    },
  }));

  // Normalize process time-series by combining AppUser maps & ApiUsageLog aggregations
  const appUserFacet = appUserStats[0] || {};
  const usageFacet = usageLogStats[0] || {};

  const appMonthlyMap = new Map(
    (appUserFacet.monthlyProcesses || []).map((row) => [row._id, row.count || 0])
  );
  const logMonthlyMap = new Map(
    (usageFacet.monthly || []).map((row) => [
      row._id,
      { count: row.count || 0, failed: row.failed || 0 },
    ])
  );

  const monthlyProcessMap = {};
  const last6MonthProcess = last6MonthKeys.map((month) => {
    const logEntry = logMonthlyMap.get(month) || { count: 0, failed: 0 };
    const count = Math.max(appMonthlyMap.get(month) || 0, logEntry.count);
    monthlyProcessMap[month] = count;
    return { month, count, failed: logEntry.failed };
  });

  const appDailyMap = new Map(
    (appUserFacet.dailyProcesses || []).map((row) => [row._id, row.count || 0])
  );
  const logDailyMap = new Map(
    (usageFacet.daily || []).map((row) => [
      row._id,
      { count: row.count || 0, failed: row.failed || 0 },
    ])
  );

  const last7DaysProcess = last7DateKeys.map((date) => {
    const logEntry = logDailyMap.get(date) || { count: 0, failed: 0 };
    const count = Math.max(appDailyMap.get(date) || 0, logEntry.count);
    return { date, count, failed: logEntry.failed };
  });

  const todayProcesses = last7DaysProcess[last7DaysProcess.length - 1]?.count || 0;
  const currentMonthProcesses =
    last6MonthProcess[last6MonthProcess.length - 1]?.count || 0;
  const lastMonthProcesses =
    last6MonthProcess.length >= 2
      ? last6MonthProcess[last6MonthProcess.length - 2].count
      : 0;

  const totalProcessStats = appUserFacet.totalProcesses?.[0] || {
    total: 0,
    totalFailed: 0,
  };
  const totalProcessedCount = totalProcessStats.total || 0;
  const totalFailedCount = totalProcessStats.totalFailed || 0;
  const totalAttempted = totalProcessedCount + totalFailedCount;
  const processSuccessRate =
    totalAttempted > 0
      ? Number(((totalProcessedCount / totalAttempted) * 100).toFixed(1))
      : 100;

  // Normalize user counts
  const userCounts = userStats[0]?.counts?.[0] || {
    total: 0,
    verified: 0,
    unverified: 0,
    disabled: 0,
    newToday: 0,
    newThisMonth: 0,
    newLastMonth: 0,
  };
  const userVerificationRate =
    userCounts.total > 0
      ? Number(((userCounts.verified / userCounts.total) * 100).toFixed(1))
      : 0;

  // Normalize app user counts
  const appUserCounts = appUserFacet.counts?.[0] || {
    total: 0,
    newThisMonth: 0,
    active: 0,
    suspended: 0,
    subscriptionPlanCount: 0,
    creditPlanCount: 0,
    freePlanCount: 0,
    expiredPendingDowngrade: 0,
    totalDevices: 0,
  };
  const activePremium =
    (appUserCounts.subscriptionPlanCount || 0) +
    (appUserCounts.creditPlanCount || 0);
  const appConversionRate =
    appUserCounts.active > 0
      ? Number(((activePremium / appUserCounts.active) * 100).toFixed(1))
      : 0;

  // Normalize leaderboards
  const topUsage = topUsageDocs.map((item) => ({
    _id: item._id,
    userId:
      item.userId?._id?.toString() ||
      (typeof item.userId === "string"
        ? item.userId
        : item.userId?.toString?.() || ""),
    planType: item.plan?.type || PLAN_TYPES.FREE,
    count: item.totalProcess || 0,
    failedCount: item.totalFailedProcess || 0,
    user: item.userId || {
      _id: "",
      name: item.username || "Unknown",
      email: item.username || "N/A",
      avatar: null,
    },
  }));

  const topSpenders = topSpendersDocs.map((item) => ({
    _id: item._id,
    totalSpent: item.totalSpent || 0,
    paymentCount: item.paymentCount || 0,
    lastPaymentAt: item.lastPaymentAt || null,
    user: item.user || {
      _id: item._id?.toString() || "",
      name: "Unknown",
      email: "N/A",
      avatar: null,
    },
  }));

  const topReferrers = topReferrersDocs.map((item) => ({
    _id: item._id,
    userId: item.referrer ? item.referrer.toString() : "",
    referralCode: item.referralCode || "",
    referredCount: item.referredCount || 0,
    totalEarned: item.totalEarned || 0,
    availableBalance: item.availableBalance || 0,
    user: item.user || {
      _id: item.referrer?.toString() || "",
      name: "Unknown",
      email: "N/A",
      avatar: null,
    },
  }));

  const referralTotals = referralStats[0]?.totals?.[0] || {
    totalReferrers: 0,
    totalReferredUsers: 0,
    totalAvailable: 0,
    totalEarned: 0,
    pendingWithdrawalsCount: 0,
    pendingWithdrawalsAmount: 0,
    completedWithdrawalsAmount: 0,
  };

  const responseData = {
    revenue: {
      total: revData.total || 0,
      today: revData.today || 0,
      currentMonth: revData.currentMonth || 0,
      lastMonth: revData.lastMonth || 0,
      avgOrderValue: Number((revData.avgOrderValue || 0).toFixed(2)),
      growthPercentage: calcGrowthPercentage(
        revData.currentMonth || 0,
        revData.lastMonth || 0
      ),
      monthlyBreakdown: monthlyRevenueMap,
      monthlyRevenueList: monthlyRevenueMap,
      last6MonthRevenue,
      last7DaysRevenue,
      byPlanType,
    },
    users: {
      total: userCounts.total || 0,
      verified: userCounts.verified || 0,
      unverified: userCounts.unverified || 0,
      disabled: userCounts.disabled || 0,
      newToday: userCounts.newToday || 0,
      newThisMonth: userCounts.newThisMonth || 0,
      newLastMonth: userCounts.newLastMonth || 0,
      growthPercentage: calcGrowthPercentage(
        userCounts.newThisMonth || 0,
        userCounts.newLastMonth || 0
      ),
      verificationRate: userVerificationRate,
    },
    appUsers: {
      total: appUserCounts.total || 0,
      newThisMonth: appUserCounts.newThisMonth || 0,
      active: appUserCounts.active || 0,
      suspended: appUserCounts.suspended || 0,
      activePremium,
      subscriptionPlanCount: appUserCounts.subscriptionPlanCount || 0,
      creditPlanCount: appUserCounts.creditPlanCount || 0,
      freePlanCount: appUserCounts.freePlanCount || 0,
      expiredPendingDowngrade: appUserCounts.expiredPendingDowngrade || 0,
      totalDevices: appUserCounts.totalDevices || 0,
      conversionRate: appConversionRate,
      monthlyProcessList: monthlyProcessMap,
      last6MonthProcess,
      last7DaysProcess,
      topUsage,
    },
    processes: {
      total: totalProcessedCount,
      totalFailed: totalFailedCount,
      today: todayProcesses,
      currentMonth: currentMonthProcesses,
      lastMonth: lastMonthProcesses,
      growthPercentage: calcGrowthPercentage(
        currentMonthProcesses,
        lastMonthProcesses
      ),
      successRate: processSuccessRate,
    },
    payments: {
      total: revData.totalCount || 0,
      today: revData.todayCount || 0,
      newThisMonth: revData.newThisMonth || 0,
      lastMonth: revData.lastMonthCount || 0,
      recent: recentPayments,
      topSpenders,
    },
    recentPayments,
    topReferrers,
    referrals: referralTotals,
    meta: {
      generatedAt: now.toISOString(),
      refreshed: isExplicitRefresh,
      syncedExpiredPlans,
    },
  };

  return new ApiResponse(
    200,
    true,
    "Admin dashboard stats retrieved",
    responseData
  ).send(res);
});

export const getAllUsers = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  const {
    page = 1,
    limit = 10,
    search = "",
    role,
    status,
    plan,
    verified,
  } = req.query;

  const now = new Date();
  const isExplicitRefresh =
    req.query.refresh === "true" || req.query.refresh === "1";

  const syncedExpiredPlans = isExplicitRefresh
    ? await reconcileExpiredPaidAppUsers(now)
    : 0;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const andConditions = [];

  if (role && role !== "all") {
    andConditions.push({ role });
  }

  if (verified === "verified") {
    andConditions.push({ isVerified: true });
  } else if (verified === "unverified") {
    andConditions.push({ isVerified: false });
  }

  const trimmedSearch = String(search || "").trim();
  if (trimmedSearch) {
    const matchingAppUsers = await AppUser.find({
      username: { $regex: trimmedSearch, $options: "i" },
    })
      .select("userId")
      .lean();
    const matchedIds = matchingAppUsers.map((a) => a.userId);

    andConditions.push({
      $or: [
        { name: { $regex: trimmedSearch, $options: "i" } },
        { email: { $regex: trimmedSearch, $options: "i" } },
        ...(matchedIds.length > 0 ? [{ _id: { $in: matchedIds } }] : []),
      ],
    });
  }

  if (plan && plan !== "all") {
    if (plan === PLAN_TYPES.FREE) {
      const paidAppUsers = await AppUser.find({
        "plan.type": { $in: [PLAN_TYPES.CREDIT, PLAN_TYPES.SUBSCRIPTION] },
      })
        .select("userId")
        .lean();
      const paidUserIds = paidAppUsers.map((a) => a.userId);
      if (paidUserIds.length > 0) {
        andConditions.push({ _id: { $nin: paidUserIds } });
      }
    } else {
      const planAppUsers = await AppUser.find({ "plan.type": plan })
        .select("userId")
        .lean();
      andConditions.push({
        _id: { $in: planAppUsers.map((a) => a.userId) },
      });
    }
  }

  if (status === "active") {
    const suspendedAppUsers = await AppUser.find({
      $or: [{ status: "suspended" }, { isActive: false }],
    })
      .select("userId")
      .lean();
    andConditions.push({ isDisabled: false });
    if (suspendedAppUsers.length > 0) {
      andConditions.push({
        _id: { $nin: suspendedAppUsers.map((a) => a.userId) },
      });
    }
  } else if (status === "disabled" || status === "suspended") {
    const suspendedAppUsers = await AppUser.find({
      $or: [{ status: "suspended" }, { isActive: false }],
    })
      .select("userId")
      .lean();
    const suspendedIds = suspendedAppUsers.map((a) => a.userId);
    andConditions.push({
      $or: [
        { isDisabled: true },
        ...(suspendedIds.length > 0 ? [{ _id: { $in: suspendedIds } }] : []),
      ],
    });
  }

  const filter = andConditions.length > 0 ? { $and: andConditions } : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken -verificationToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
  ]);

  const userIds = users.map((u) => u._id);
  const appUsers = await AppUser.find({ userId: { $in: userIds } }).lean();
  const appUserMap = new Map(appUsers.map((k) => [k.userId.toString(), k]));

  // Batch resolve plan names from AppPricing where plan.name is missing
  const planIdsToResolve = [
    ...new Set(
      appUsers
        .map((a) => a.plan?.id)
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    ),
  ];
  const pricingDocs =
    planIdsToResolve.length > 0
      ? await AppPricing.find({ _id: { $in: planIdsToResolve } })
          .select("name")
          .lean()
      : [];
  const pricingNameMap = new Map(
    pricingDocs.map((p) => [p._id.toString(), p.name])
  );

  const enrichedUsers = users.map((u) => {
    const appUserDoc = appUserMap.get(u._id.toString());
    const planType = appUserDoc?.plan?.type || PLAN_TYPES.FREE;
    const planId = appUserDoc?.plan?.id || null;
    const resolvedPlanName =
      appUserDoc?.plan?.name ||
      (planId && pricingNameMap.get(planId.toString())) ||
      (planType === PLAN_TYPES.SUBSCRIPTION
        ? "Subscription"
        : planType === PLAN_TYPES.CREDIT
        ? "Credit Pack"
        : "Free Tier");

    const devicesArr = Array.isArray(appUserDoc?.devices) ? appUserDoc.devices : [];
    const allowedDevicesArr = Array.isArray(appUserDoc?.allowedDevices)
      ? appUserDoc.allowedDevices
      : [];
    const devicesCount = Math.max(devicesArr.length, allowedDevicesArr.length);

    const isPaidPlan =
      planType === PLAN_TYPES.SUBSCRIPTION || planType === PLAN_TYPES.CREDIT;
    const isExpired = Boolean(
      isPaidPlan &&
        ((appUserDoc?.expiresAt && new Date(appUserDoc.expiresAt) <= now) ||
          (planType === PLAN_TYPES.CREDIT && (appUserDoc?.credit ?? 0) <= 0))
    );

    const effectiveStatus =
      appUserDoc?.status === "suspended" ||
      appUserDoc?.isActive === false ||
      u.isDisabled
        ? "suspended"
        : "active";

    return {
      ...u,
      userId: u._id.toString(),
      appUserId: appUserDoc?._id?.toString() || null,
      hasAppUser: Boolean(appUserDoc),
      username: appUserDoc?.username || u.email,
      plan: {
        type: planType,
        id: planId,
        name: resolvedPlanName,
      },
      credit:
        planType === PLAN_TYPES.SUBSCRIPTION ||
        appUserDoc?.credit === Infinity
          ? null
          : appUserDoc?.credit ?? 5,
      isActive: appUserDoc ? Boolean(appUserDoc.isActive) : !u.isDisabled,
      status: effectiveStatus,
      suspendedAt: appUserDoc?.suspendedAt || null,
      allowedDevices: allowedDevicesArr,
      devices: devicesArr,
      devicesCount,
      maxDevices: appUserDoc?.maxDevices || 2,
      totalProcess: appUserDoc?.totalProcess || 0,
      totalFailedProcess: appUserDoc?.totalFailedProcess || 0,
      expiresAt: appUserDoc?.expiresAt || null,
      isExpired,
      appCreatedAt: appUserDoc?.createdAt || null,
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / limitNum));

  return new ApiResponse(200, true, "Users retrieved successfully", {
    users: enrichedUsers,
    total,
    currentPage: pageNum,
    totalPages,
    page: pageNum,
    limit: limitNum,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    meta: {
      generatedAt: now.toISOString(),
      refreshed: isExplicitRefresh,
      syncedExpiredPlans,
    },
  }).send(res);
});

export const getUserStats = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  const now = new Date();
  const isExplicitRefresh =
    req.query.refresh === "true" || req.query.refresh === "1";

  const syncedExpiredPlans = isExplicitRefresh
    ? await reconcileExpiredPaidAppUsers(now)
    : 0;

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const sevenDaysStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6)
  );

  const last7DateKeys = Array.from({ length: 7 }, (_, i) =>
    toUtcDateKey(
      new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (6 - i))
      )
    )
  );

  const isActiveAppUserExpr = {
    $and: [{ $eq: ["$isActive", true] }, { $eq: ["$status", "active"] }],
  };
  const hasExpiredDateExpr = {
    $and: [
      { $eq: [{ $type: "$expiresAt" }, "date"] },
      { $lte: ["$expiresAt", now] },
    ],
  };
  const isNotExpiredExpr = {
    $or: [
      { $ne: [{ $type: "$expiresAt" }, "date"] },
      { $gt: ["$expiresAt", now] },
    ],
  };

  const [userCounts, appUserCounts, dailyNewUsersRaw, roleStats] =
    await Promise.all([
      User.aggregate([
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalUsers: { $sum: 1 },
                  activeUsers: {
                    $sum: { $cond: [{ $eq: ["$isDisabled", false] }, 1, 0] },
                  },
                  suspendedUsers: {
                    $sum: { $cond: [{ $eq: ["$isDisabled", true] }, 1, 0] },
                  },
                  verifiedUsers: {
                    $sum: { $cond: ["$isVerified", 1, 0] },
                  },
                  unverifiedUsers: {
                    $sum: { $cond: ["$isVerified", 0, 1] },
                  },
                  newUsers24h: {
                    $sum: { $cond: [{ $gte: ["$createdAt", yesterday] }, 1, 0] },
                  },
                  newUsers7d: {
                    $sum: {
                      $cond: [{ $gte: ["$createdAt", sevenDaysStart] }, 1, 0],
                    },
                  },
                  newUsersThisMonth: {
                    $sum: {
                      $cond: [{ $gte: ["$createdAt", thisMonthStart] }, 1, 0],
                    },
                  },
                },
              },
            ],
          },
        },
      ]),
      AppUser.aggregate([
        {
          $group: {
            _id: null,
            totalAppUsers: { $sum: 1 },
            activeAppUsers: {
              $sum: { $cond: [isActiveAppUserExpr, 1, 0] },
            },
            suspendedAppUsers: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$status", "suspended"] },
                      { $eq: ["$isActive", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            subscriptionCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      isActiveAppUserExpr,
                      { $eq: ["$plan.type", PLAN_TYPES.SUBSCRIPTION] },
                      isNotExpiredExpr,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            creditCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      isActiveAppUserExpr,
                      { $eq: ["$plan.type", PLAN_TYPES.CREDIT] },
                      isNotExpiredExpr,
                      { $gt: ["$credit", 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            freeCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      isActiveAppUserExpr,
                      { $eq: ["$plan.type", PLAN_TYPES.FREE] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            expiredPendingDowngrade: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      isActiveAppUserExpr,
                      {
                        $or: [
                          {
                            $and: [
                              { $eq: ["$plan.type", PLAN_TYPES.SUBSCRIPTION] },
                              hasExpiredDateExpr,
                            ],
                          },
                          {
                            $and: [
                              { $eq: ["$plan.type", PLAN_TYPES.CREDIT] },
                              {
                                $or: [
                                  hasExpiredDateExpr,
                                  { $lte: ["$credit", 0] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalDevices: {
              $sum: {
                $max: [
                  { $cond: [{ $isArray: "$devices" }, { $size: "$devices" }, 0] },
                  {
                    $cond: [
                      { $isArray: "$allowedDevices" },
                      { $size: "$allowedDevices" },
                      0,
                    ],
                  },
                ],
              },
            },
            totalProcesses: { $sum: { $ifNull: ["$totalProcess", 0] } },
            totalFailedProcesses: {
              $sum: { $ifNull: ["$totalFailedProcess", 0] },
            },
          },
        },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysStart } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  const u = userCounts[0]?.totals?.[0] || {
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    newUsers24h: 0,
    newUsers7d: 0,
    newUsersThisMonth: 0,
  };

  const a = appUserCounts[0] || {
    totalAppUsers: 0,
    activeAppUsers: 0,
    suspendedAppUsers: 0,
    subscriptionCount: 0,
    creditCount: 0,
    freeCount: 0,
    expiredPendingDowngrade: 0,
    totalDevices: 0,
    totalProcesses: 0,
    totalFailedProcesses: 0,
  };

  const dailyCountMap = new Map(
    (dailyNewUsersRaw || []).map((row) => [row._id, row.count || 0])
  );
  const dailyNewUsers = last7DateKeys.map((date) => ({
    date,
    count: dailyCountMap.get(date) || 0,
  }));

  const totalProcesses = a.totalProcesses || 0;
  const totalFailedProcesses = a.totalFailedProcesses || 0;
  const totalAttempts = totalProcesses + totalFailedProcesses;
  const processSuccessRate =
    totalAttempts > 0
      ? Number(((totalProcesses / totalAttempts) * 100).toFixed(1))
      : 100;

  const avgProcessesPerUser =
    u.totalUsers > 0 ? Number((totalProcesses / u.totalUsers).toFixed(1)) : 0;

  const activePremiumUsers =
    (a.subscriptionCount || 0) + (a.creditCount || 0);
  const uninitializedUsers = Math.max(0, u.totalUsers - (a.totalAppUsers || 0));

  const usersByPlan = {
    subscription: a.subscriptionCount || 0,
    credit: a.creditCount || 0,
    free: a.freeCount || 0,
    uninitialized: uninitializedUsers,
  };

  const stats = {
    totalUsers: u.totalUsers,
    activeUsers: u.activeUsers,
    suspendedUsers: u.suspendedUsers,
    verifiedUsers: u.verifiedUsers,
    unverifiedUsers: u.unverifiedUsers,
    newUsers24h: u.newUsers24h,
    newUsers7d: u.newUsers7d,
    newUsersThisMonth: u.newUsersThisMonth,
    totalAppUsers: a.totalAppUsers,
    activeAppUsers: a.activeAppUsers,
    suspendedAppUsers: a.suspendedAppUsers,
    activePremiumUsers,
    expiredPendingDowngrade: a.expiredPendingDowngrade,
    totalDevices: a.totalDevices,
    uninitializedUsers,
    dailyNewUsers,
    totalProcesses,
    totalFailedProcesses,
    avgProcessesPerUser,
    processSuccessRate,
    usersByPlan,
    roleDistribution: roleStats,
    meta: {
      generatedAt: now.toISOString(),
      refreshed: isExplicitRefresh,
      syncedExpiredPlans,
    },
  };

  return new ApiResponse(200, true, "User statistics retrieved", stats).send(
    res
  );
});

function parseInclusiveEndDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(raw) ||
    (date.getUTCHours() === 0 &&
      date.getUTCMinutes() === 0 &&
      date.getUTCSeconds() === 0 &&
      date.getUTCMilliseconds() === 0)
  ) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

function escapeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

async function buildPaymentsFilterQuery({
  search = "",
  status,
  planType,
  gateway,
  startDate,
  endDate,
} = {}) {
  const query = {};

  if (status && status !== "all") {
    query.status = { $regex: new RegExp(`^${escapeRegex(status)}$`, "i") };
  }

  if (planType && planType !== "all") {
    query["plan.type"] = {
      $regex: new RegExp(`^${escapeRegex(planType)}$`, "i"),
    };
  }

  if (gateway && gateway !== "all") {
    query.gateway = { $regex: new RegExp(`^${escapeRegex(gateway)}$`, "i") };
  }

  const parsedStart = startDate ? new Date(startDate) : null;
  const parsedEnd = endDate ? parseInclusiveEndDate(endDate) : null;
  if (
    (parsedStart && !Number.isNaN(parsedStart.getTime())) ||
    (parsedEnd && !Number.isNaN(parsedEnd.getTime()))
  ) {
    query.createdAt = {};
    if (parsedStart && !Number.isNaN(parsedStart.getTime())) {
      query.createdAt.$gte = parsedStart;
    }
    if (parsedEnd && !Number.isNaN(parsedEnd.getTime())) {
      query.createdAt.$lte = parsedEnd;
    }
  }

  const trimmedSearch = String(search || "").trim();
  if (trimmedSearch) {
    const safeSearch = escapeRegex(trimmedSearch);
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ],
    })
      .select("_id")
      .lean();
    const userIds = matchingUsers.map((u) => u._id);

    const orClauses = [
      { trxID: { $regex: safeSearch, $options: "i" } },
      { paymentID: { $regex: safeSearch, $options: "i" } },
      { "plan.name": { $regex: safeSearch, $options: "i" } },
      { paymentMethod: { $regex: safeSearch, $options: "i" } },
      { gateway: { $regex: safeSearch, $options: "i" } },
    ];
    if (userIds.length > 0) {
      orClauses.push({ userId: { $in: userIds } });
    }
    query.$or = orClauses;
  }

  return query;
}

const ALLOWED_PAYMENT_SORT_FIELDS = new Set([
  "createdAt",
  "amount",
  "status",
  "gateway",
]);

export const getPaymentsHistory = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  const {
    page = 1,
    limit = 10,
    search = "",
    startDate,
    endDate,
    status = "all",
    planType = "all",
    gateway = "all",
    sortBy = "createdAt",
    sortOrder = "desc",
    refresh,
  } = req.query;

  const now = new Date();
  const isExplicitRefresh = refresh === "true" || refresh === "1";

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;
  const safeSortBy = ALLOWED_PAYMENT_SORT_FIELDS.has(String(sortBy))
    ? String(sortBy)
    : "createdAt";
  const sortDir = sortOrder === "asc" ? 1 : -1;

  const query = await buildPaymentsFilterQuery({
    search,
    status,
    planType,
    gateway,
    startDate,
    endDate,
  });

  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const thisMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  const [payments, total, filteredAgg, summaryAgg] = await Promise.all([
    AppPayment.find(query)
      .populate("userId", "name email avatar")
      .sort({ [safeSortBy]: sortDir, _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AppPayment.countDocuments(query),
    AppPayment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
          totalCount: { $sum: 1 },
        },
      },
    ]),
    AppPayment.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: { $ifNull: ["$amount", 0] } },
                totalPayments: { $sum: 1 },
                todayRevenue: {
                  $sum: {
                    $cond: [
                      { $gte: ["$createdAt", todayStart] },
                      { $ifNull: ["$amount", 0] },
                      0,
                    ],
                  },
                },
                todayCount: {
                  $sum: {
                    $cond: [{ $gte: ["$createdAt", todayStart] }, 1, 0],
                  },
                },
                thisMonthRevenue: {
                  $sum: {
                    $cond: [
                      { $gte: ["$createdAt", thisMonthStart] },
                      { $ifNull: ["$amount", 0] },
                      0,
                    ],
                  },
                },
                thisMonthCount: {
                  $sum: {
                    $cond: [{ $gte: ["$createdAt", thisMonthStart] }, 1, 0],
                  },
                },
              },
            },
          ],
          byPlanType: [
            {
              $group: {
                _id: { $toLower: { $ifNull: ["$plan.type", "other"] } },
                amount: { $sum: { $ifNull: ["$amount", 0] } },
                count: { $sum: 1 },
              },
            },
          ],
          byGateway: [
            {
              $group: {
                _id: { $toLower: { $ifNull: ["$gateway", "paystation"] } },
                amount: { $sum: { $ifNull: ["$amount", 0] } },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]),
  ]);

  const transformedPayments = payments.map((p) => {
    const userObj = p.userId && typeof p.userId === "object" ? p.userId : null;
    return {
      _id: p._id,
      user: {
        _id: userObj?._id?.toString() || p.userId?.toString() || "N/A",
        name: userObj?.name || "Unknown User",
        email: userObj?.email || "N/A",
        avatar: userObj?.avatar || null,
      },
      userId: p.userId,
      paymentID: p.paymentID,
      trxID: p.trxID,
      plan: p.plan,
      amount: p.amount,
      currency: p.currency || "BDT",
      gateway: p.gateway || "paystation",
      paymentMethod:
        p.paymentMethod || p.paymentDetails?.paymentMethod || null,
      transactionId: p.transactionId || null,
      status: p.status || "Completed",
      transactionStatus: p.status || "Completed",
      paymentDetails: p.paymentDetails || null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  const totalsRow = summaryAgg[0]?.totals?.[0] || {
    totalRevenue: 0,
    totalPayments: 0,
    todayRevenue: 0,
    todayCount: 0,
    thisMonthRevenue: 0,
    thisMonthCount: 0,
  };

  const planBucket = {
    subscription: { amount: 0, count: 0 },
    credit: { amount: 0, count: 0 },
    other: { amount: 0, count: 0 },
  };
  for (const row of summaryAgg[0]?.byPlanType || []) {
    if (row._id === "subscription") {
      planBucket.subscription = { amount: row.amount || 0, count: row.count || 0 };
    } else if (row._id === "credit") {
      planBucket.credit = { amount: row.amount || 0, count: row.count || 0 };
    } else {
      planBucket.other.amount += row.amount || 0;
      planBucket.other.count += row.count || 0;
    }
  }

  const gatewayBucket = {
    paystation: { amount: 0, count: 0 },
    bkash: { amount: 0, count: 0 },
    manual: { amount: 0, count: 0 },
  };
  for (const row of summaryAgg[0]?.byGateway || []) {
    if (row._id === "paystation" || row._id === "bkash" || row._id === "manual") {
      gatewayBucket[row._id] = { amount: row.amount || 0, count: row.count || 0 };
    }
  }

  const totalPayments = totalsRow.totalPayments || 0;
  const totalRevenue = totalsRow.totalRevenue || 0;
  const summary = {
    totalRevenue,
    totalPayments,
    todayRevenue: totalsRow.todayRevenue || 0,
    todayCount: totalsRow.todayCount || 0,
    thisMonthRevenue: totalsRow.thisMonthRevenue || 0,
    thisMonthCount: totalsRow.thisMonthCount || 0,
    avgOrderValue:
      totalPayments > 0 ? Number((totalRevenue / totalPayments).toFixed(2)) : 0,
    byPlanType: planBucket,
    byGateway: gatewayBucket,
  };

  const filteredSummary = {
    totalAmount: filteredAgg[0]?.totalAmount || 0,
    totalCount: filteredAgg[0]?.totalCount || 0,
  };

  const totalPages = Math.ceil(total / limitNum);

  return new ApiResponse(200, true, "Payments history retrieved", {
    payments: transformedPayments,
    summary,
    filteredSummary,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    meta: {
      generatedAt: now.toISOString(),
      refreshed: isExplicitRefresh,
    },
  }).send(res);
});

export const downloadPaymentsHistory = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  const {
    search = "",
    startDate,
    endDate,
    status = "all",
    planType = "all",
    gateway = "all",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = await buildPaymentsFilterQuery({
    search,
    status,
    planType,
    gateway,
    startDate,
    endDate,
  });

  const safeSortBy = ALLOWED_PAYMENT_SORT_FIELDS.has(String(sortBy))
    ? String(sortBy)
    : "createdAt";
  const sortDir = sortOrder === "asc" ? 1 : -1;

  const payments = await AppPayment.find(query)
    .populate("userId", "name email")
    .sort({ [safeSortBy]: sortDir, _id: -1 })
    .lean();

  const header = [
    "ID",
    "Date",
    "User Name",
    "User Email",
    "Amount",
    "Currency",
    "Plan Name",
    "Plan Type",
    "Gateway",
    "Payment Method",
    "Status",
    "TrxID",
    "PaymentID",
  ].join(",");

  const rows = [header];

  for (const p of payments) {
    const userObj = p.userId && typeof p.userId === "object" ? p.userId : null;
    const method =
      p.paymentMethod || p.paymentDetails?.paymentMethod || "";
    const date = p.createdAt ? new Date(p.createdAt).toISOString() : "";

    rows.push(
      [
        escapeCsvCell(p._id),
        escapeCsvCell(date),
        escapeCsvCell(userObj?.name || "Unknown User"),
        escapeCsvCell(userObj?.email || "N/A"),
        escapeCsvCell(p.amount ?? 0),
        escapeCsvCell(p.currency || "BDT"),
        escapeCsvCell(p.plan?.name || ""),
        escapeCsvCell(p.plan?.type || ""),
        escapeCsvCell(p.gateway || "paystation"),
        escapeCsvCell(method),
        escapeCsvCell(p.status || "Completed"),
        escapeCsvCell(p.trxID || ""),
        escapeCsvCell(p.paymentID || ""),
      ].join(",")
    );
  }

  const csv = "\uFEFF" + rows.join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="payments_history.csv"'
  );
  return res.status(200).send(csv);
});

export const getAllReferrals = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  const {
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    sortBy = "pending",
    sortOrder = "desc",
    refresh,
  } = req.query;

  const now = new Date();
  const isExplicitRefresh = refresh === "true" || refresh === "1";

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;
  const sortDir = sortOrder === "asc" ? 1 : -1;

  const filter = {};
  const trimmedSearch = String(search || "").trim();
  if (trimmedSearch) {
    const safeSearch = escapeRegex(trimmedSearch);
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ],
    })
      .select("_id")
      .lean();
    const userIds = matchingUsers.map((u) => u._id);
    filter.$or = [
      ...(userIds.length > 0 ? [{ referrer: { $in: userIds } }] : []),
      { referralCode: { $regex: safeSearch, $options: "i" } },
      { withdrawAccount: { $regex: safeSearch, $options: "i" } },
    ];
  }

  if (status === "pending") {
    filter["withdrawHistory.status"] = WITHDRAWAL_STATUS.PENDING;
  } else if (status === "has_balance") {
    filter.availableBalance = { $gt: 0 };
  } else if (status === "has_referrals") {
    filter["referredUsers.0"] = { $exists: true };
  }

  let sortStage = {
    pendingWithdrawals: sortDir,
    pendingWithdrawalAmount: sortDir,
    availableBalance: -1,
    createdAt: -1,
  };
  if (sortBy === "balance") {
    sortStage = { availableBalance: sortDir, totalEarned: -1, createdAt: -1 };
  } else if (sortBy === "earned") {
    sortStage = { totalEarned: sortDir, availableBalance: -1, createdAt: -1 };
  } else if (sortBy === "referred") {
    sortStage = { referredCount: sortDir, totalEarned: -1, createdAt: -1 };
  } else if (sortBy === "recent") {
    sortStage = { createdAt: sortDir };
  }

  const [listFacetResult, summaryAgg] = await Promise.all([
    Referral.aggregate([
      { $match: filter },
      {
        $addFields: {
          referredCount: {
            $cond: [
              { $isArray: "$referredUsers" },
              { $size: "$referredUsers" },
              0,
            ],
          },
          totalEarned: {
            $reduce: {
              input: {
                $cond: [
                  { $isArray: "$earnedHistory" },
                  "$earnedHistory",
                  [],
                ],
              },
              initialValue: 0,
              in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
            },
          },
          convertedUserIds: {
            $setUnion: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: {
                        $cond: [
                          { $isArray: "$earnedHistory" },
                          "$earnedHistory",
                          [],
                        ],
                      },
                      as: "e",
                      cond: { $ne: ["$$e.user", null] },
                    },
                  },
                  as: "e",
                  in: "$$e.user",
                },
              },
              [],
            ],
          },
          pendingWithdrawalsList: {
            $filter: {
              input: {
                $cond: [
                  { $isArray: "$withdrawHistory" },
                  "$withdrawHistory",
                  [],
                ],
              },
              as: "w",
              cond: { $eq: ["$$w.status", WITHDRAWAL_STATUS.PENDING] },
            },
          },
          completedWithdrawalsList: {
            $filter: {
              input: {
                $cond: [
                  { $isArray: "$withdrawHistory" },
                  "$withdrawHistory",
                  [],
                ],
              },
              as: "w",
              cond: { $eq: ["$$w.status", WITHDRAWAL_STATUS.COMPLETED] },
            },
          },
        },
      },
      {
        $addFields: {
          convertedCount: { $size: "$convertedUserIds" },
          pendingWithdrawals: { $size: "$pendingWithdrawalsList" },
          pendingWithdrawalAmount: {
            $reduce: {
              input: "$pendingWithdrawalsList",
              initialValue: 0,
              in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
            },
          },
          totalWithdrawn: {
            $reduce: {
              input: "$completedWithdrawalsList",
              initialValue: 0,
              in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
            },
          },
          latestPendingAt: {
            $max: {
              $map: {
                input: "$pendingWithdrawalsList",
                as: "pw",
                in: { $ifNull: ["$$pw.requestedAt", "$$pw.createdAt"] },
              },
            },
          },
        },
      },
      { $sort: sortStage },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limitNum },
            {
              $lookup: {
                from: "users",
                let: { uid: "$referrer" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
                  { $project: { _id: 1, name: 1, email: 1, avatar: 1 } },
                ],
                as: "referrerUser",
              },
            },
            {
              $unwind: {
                path: "$referrerUser",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                referrer: {
                  _id: { $ifNull: ["$referrerUser._id", "$referrer"] },
                  name: { $ifNull: ["$referrerUser.name", "Unknown User"] },
                  email: { $ifNull: ["$referrerUser.email", "N/A"] },
                  avatar: { $ifNull: ["$referrerUser.avatar", null] },
                },
                referralCode: 1,
                referredCount: 1,
                convertedCount: 1,
                totalEarned: 1,
                totalWithdrawn: 1,
                availableBalance: { $ifNull: ["$availableBalance", 0] },
                pendingWithdrawals: 1,
                pendingWithdrawalAmount: 1,
                latestPendingAt: { $ifNull: ["$latestPendingAt", null] },
                withdrawAccount: { $ifNull: ["$withdrawAccount", null] },
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]),
    Referral.aggregate([
      {
        $project: {
          availableBalance: { $ifNull: ["$availableBalance", 0] },
          referredCount: {
            $cond: [
              { $isArray: "$referredUsers" },
              { $size: "$referredUsers" },
              0,
            ],
          },
          totalEarned: {
            $reduce: {
              input: {
                $cond: [
                  { $isArray: "$earnedHistory" },
                  "$earnedHistory",
                  [],
                ],
              },
              initialValue: 0,
              in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
            },
          },
          pendingList: {
            $filter: {
              input: {
                $cond: [
                  { $isArray: "$withdrawHistory" },
                  "$withdrawHistory",
                  [],
                ],
              },
              as: "w",
              cond: { $eq: ["$$w.status", WITHDRAWAL_STATUS.PENDING] },
            },
          },
          completedList: {
            $filter: {
              input: {
                $cond: [
                  { $isArray: "$withdrawHistory" },
                  "$withdrawHistory",
                  [],
                ],
              },
              as: "w",
              cond: { $eq: ["$$w.status", WITHDRAWAL_STATUS.COMPLETED] },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalReferrers: { $sum: 1 },
          totalReferredUsers: { $sum: "$referredCount" },
          totalEarned: { $sum: "$totalEarned" },
          totalAvailable: { $sum: "$availableBalance" },
          referrersWithPending: {
            $sum: {
              $cond: [{ $gt: [{ $size: "$pendingList" }, 0] }, 1, 0],
            },
          },
          pendingWithdrawalsCount: { $sum: { $size: "$pendingList" } },
          pendingWithdrawalsAmount: {
            $sum: {
              $reduce: {
                input: "$pendingList",
                initialValue: 0,
                in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
              },
            },
          },
          completedWithdrawalsCount: { $sum: { $size: "$completedList" } },
          completedWithdrawalsAmount: {
            $sum: {
              $reduce: {
                input: "$completedList",
                initialValue: 0,
                in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] },
              },
            },
          },
        },
      },
    ]),
  ]);

  const items = listFacetResult[0]?.items || [];
  const total = listFacetResult[0]?.totalCount?.[0]?.count || 0;
  const totalPages = Math.ceil(total / limitNum);

  const summary = summaryAgg[0]
    ? {
        totalReferrers: summaryAgg[0].totalReferrers || 0,
        totalReferredUsers: summaryAgg[0].totalReferredUsers || 0,
        totalEarned: summaryAgg[0].totalEarned || 0,
        totalAvailable: summaryAgg[0].totalAvailable || 0,
        pendingWithdrawalsCount: summaryAgg[0].pendingWithdrawalsCount || 0,
        pendingWithdrawalsAmount: summaryAgg[0].pendingWithdrawalsAmount || 0,
        completedWithdrawalsCount: summaryAgg[0].completedWithdrawalsCount || 0,
        completedWithdrawalsAmount: summaryAgg[0].completedWithdrawalsAmount || 0,
        referrersWithPending: summaryAgg[0].referrersWithPending || 0,
      }
    : {
        totalReferrers: 0,
        totalReferredUsers: 0,
        totalEarned: 0,
        totalAvailable: 0,
        pendingWithdrawalsCount: 0,
        pendingWithdrawalsAmount: 0,
        completedWithdrawalsCount: 0,
        completedWithdrawalsAmount: 0,
        referrersWithPending: 0,
      };

  return new ApiResponse(200, true, "Referrals retrieved", {
    referrals: items,
    summary,
    total,
    totalPages,
    page: pageNum,
    limit: limitNum,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    meta: {
      generatedAt: now.toISOString(),
      refreshed: isExplicitRefresh,
    },
  }).send(res);
});

export const getReferralByUserId = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  const now = new Date();
  const isExplicitRefresh =
    req.query.refresh === "true" || req.query.refresh === "1";

  const referral = await Referral.findOne({ referrer: userId })
    .populate("referrer", "name email avatar isVerified isDisabled createdAt")
    .populate("referredUsers", "name email avatar createdAt")
    .populate("earnedHistory.user", "name email avatar")
    .lean();

  if (!referral) {
    throw new ApiError(404, "Referral record not found for this user");
  }

  const ledgerWithdrawals = await ReferralWithdrawal.find({
    referralId: referral._id,
  })
    .select("_id amount status withdrawAccount trx notes requestedAt issuedAt createdAt")
    .lean();

  const ledgerById = new Map(
    ledgerWithdrawals.map((item) => [String(item._id), item])
  );

  // Track earnings contributed per referred user
  const earnedByUserMap = new Map();
  let totalEarned = 0;
  const rawEarnedHistory = Array.isArray(referral.earnedHistory)
    ? referral.earnedHistory
    : [];

  for (const item of rawEarnedHistory) {
    const amt = Number(item.amount) || 0;
    totalEarned += amt;
    const uid =
      item.user && typeof item.user === "object"
        ? String(item.user._id)
        : item.user
        ? String(item.user)
        : null;
    if (uid) {
      earnedByUserMap.set(uid, (earnedByUserMap.get(uid) || 0) + amt);
    }
  }

  const earnedHistory = rawEarnedHistory
    .map((item) => {
      const u =
        item.user && typeof item.user === "object" ? item.user : null;
      return {
        _id: String(item._id),
        user: u
          ? {
              _id: String(u._id),
              name: u.name || "Unknown User",
              email: u.email || "N/A",
              avatar: u.avatar || null,
            }
          : {
              _id: item.user ? String(item.user) : "",
              name: "Unknown User",
              email: "N/A",
              avatar: null,
            },
        amount: Number(item.amount) || 0,
        createdAt: item.createdAt,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

  const rawReferredUsers = Array.isArray(referral.referredUsers)
    ? referral.referredUsers
    : [];
  const referredUsers = rawReferredUsers
    .map((u) => {
      const obj = u && typeof u === "object" ? u : { _id: u };
      const uid = String(obj._id || "");
      const earnedAmount = earnedByUserMap.get(uid) || 0;
      return {
        _id: uid,
        name: obj.name || "Unknown User",
        email: obj.email || "N/A",
        avatar: obj.avatar || null,
        createdAt: obj.createdAt || null,
        hasConverted: earnedAmount > 0,
        earnedAmount,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

  const rawWithdrawHistory = Array.isArray(referral.withdrawHistory)
    ? referral.withdrawHistory
    : [];

  let totalWithdrawn = 0;
  let pendingWithdrawalsCount = 0;
  let pendingWithdrawalsAmount = 0;
  let completedWithdrawalsCount = 0;
  let rejectedWithdrawalsCount = 0;

  const withdrawHistory = rawWithdrawHistory
    .map((w) => {
      const amt = Number(w.amount) || 0;
      if (w.status === WITHDRAWAL_STATUS.COMPLETED) {
        totalWithdrawn += amt;
        completedWithdrawalsCount += 1;
      } else if (w.status === WITHDRAWAL_STATUS.PENDING) {
        pendingWithdrawalsCount += 1;
        pendingWithdrawalsAmount += amt;
      } else if (w.status === WITHDRAWAL_STATUS.REJECTED) {
        rejectedWithdrawalsCount += 1;
      }

      const directLedger = ledgerById.get(String(w._id));
      const fallbackLedger =
        directLedger ||
        ledgerWithdrawals.find(
          (lw) =>
            lw.status === w.status &&
            Number(lw.amount) === amt &&
            Math.abs(
              new Date(lw.requestedAt || lw.createdAt || 0).getTime() -
                new Date(w.requestedAt || w.createdAt || 0).getTime()
            ) < 60000
        );

      return {
        _id: String(w._id),
        amount: amt,
        status: w.status,
        withdrawAccount: w.withdrawAccount,
        trx: w.trx || fallbackLedger?.trx || null,
        notes: w.notes ?? fallbackLedger?.notes ?? null,
        createdAt: w.createdAt,
        requestedAt: w.requestedAt || w.createdAt,
        issuedAt: w.issuedAt || fallbackLedger?.issuedAt || null,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.requestedAt || b.createdAt || 0).getTime() -
        new Date(a.requestedAt || a.createdAt || 0).getTime()
    );

  const referralCount = referredUsers.length;
  const convertedCount = earnedByUserMap.size;
  const conversionRate =
    referralCount > 0
      ? Number(((convertedCount / referralCount) * 100).toFixed(1))
      : 0;

  const referrerObj =
    referral.referrer && typeof referral.referrer === "object"
      ? {
          _id: String(referral.referrer._id),
          name: referral.referrer.name || "Unknown User",
          email: referral.referrer.email || "N/A",
          avatar: referral.referrer.avatar || null,
          isVerified: Boolean(referral.referrer.isVerified),
          isDisabled: Boolean(referral.referrer.isDisabled),
          createdAt: referral.referrer.createdAt || null,
        }
      : {
          _id: String(referral.referrer || userId),
          name: "Unknown User",
          email: "N/A",
          avatar: null,
        };

  return new ApiResponse(200, true, "Referral details retrieved", {
    _id: String(referral._id),
    referrer: referrerObj,
    referralCode: referral.referralCode,
    availableBalance: referral.availableBalance || 0,
    withdrawAccount: referral.withdrawAccount || null,
    referralCount,
    convertedCount,
    conversionRate,
    totalEarned,
    totalWithdrawn,
    pendingWithdrawalsCount,
    pendingWithdrawalsAmount,
    completedWithdrawalsCount,
    rejectedWithdrawalsCount,
    referredUsers,
    earnedHistory,
    withdrawHistory,
    createdAt: referral.createdAt,
    updatedAt: referral.updatedAt,
    meta: {
      generatedAt: now.toISOString(),
      refreshed: isExplicitRefresh,
    },
  }).send(res);
});

export const updateWithdrawal = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  const { userId, withdrawalId } = req.params;
  const { status, trx, notes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(withdrawalId)) {
    throw new ApiError(400, "Invalid user ID or withdrawal ID");
  }

  if (
    !status ||
    ![WITHDRAWAL_STATUS.COMPLETED, WITHDRAWAL_STATUS.REJECTED].includes(status)
  ) {
    throw new ApiError(400, "Status must be either 'completed' or 'rejected'");
  }

  const referral = await Referral.findOne({ referrer: userId });
  if (!referral) {
    throw new ApiError(404, "Referral record not found");
  }

  const withdrawal = referral.withdrawHistory.id(withdrawalId);
  if (!withdrawal) {
    throw new ApiError(404, "Withdrawal request not found");
  }

  if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
    throw new ApiError(
      400,
      `Withdrawal request has already been ${withdrawal.status}`
    );
  }

  const cleanTrx = typeof trx === "string" ? trx.trim() : "";
  const cleanNotes = typeof notes === "string" ? notes.trim() : "";

  if (status === WITHDRAWAL_STATUS.COMPLETED) {
    if (!cleanTrx) {
      throw new ApiError(400, "Transaction ID is required to approve a withdrawal");
    }
    withdrawal.trx = cleanTrx;
    if (cleanNotes) {
      withdrawal.notes = cleanNotes;
    }
  } else if (status === WITHDRAWAL_STATUS.REJECTED) {
    // Support legacy callers passing reason in trx if notes is omitted
    const rejectionReason = cleanNotes || cleanTrx;
    if (!rejectionReason) {
      throw new ApiError(400, "Rejection reason is required to reject a withdrawal");
    }
    withdrawal.notes = rejectionReason;
    withdrawal.trx = null;
    referral.availableBalance += withdrawal.amount;
  }

  withdrawal.status = status;
  withdrawal.issuedAt = new Date();

  await referral.save();

  // Also synchronize in normalized ledger if present
  try {
    await ReferralWithdrawal.updateOne(
      {
        $or: [
          { _id: withdrawalId },
          { referralId: referral._id, status: WITHDRAWAL_STATUS.PENDING, amount: withdrawal.amount },
          { userId: referral.referrer, status: WITHDRAWAL_STATUS.PENDING, amount: withdrawal.amount },
        ],
      },
      {
        $set: {
          status: withdrawal.status,
          trx: withdrawal.trx || null,
          notes: withdrawal.notes || null,
          issuedAt: withdrawal.issuedAt,
          ...(req.user?._id ? { processedBy: req.user._id } : {}),
        },
      }
    );
  } catch {
    // Non-blocking
  }

  notificationService
    .notifyUser({
      recipientId: userId,
      type:
        status === WITHDRAWAL_STATUS.COMPLETED
          ? "referral.withdrawal_completed"
          : "referral.withdrawal_rejected",
      category: NOTIFICATION_CATEGORIES.REFERRAL,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      sendEmail: true,
      title:
        status === WITHDRAWAL_STATUS.COMPLETED
          ? "Referral Withdrawal Approved"
          : "Referral Withdrawal Rejected",
      message:
        status === WITHDRAWAL_STATUS.COMPLETED
          ? `Your referral withdrawal of ৳${Number(withdrawal.amount || 0).toLocaleString("en-US")} has been paid. Transaction ID: ${withdrawal.trx}.`
          : `Your referral withdrawal request of ৳${Number(withdrawal.amount || 0).toLocaleString("en-US")} was rejected (${withdrawal.notes}). The funds have been returned to your available balance.`,
      actionUrl: "/dashboard/referral",
      actionLabel: "View Referral History",
      dedupeKey: `withdrawal_status:${withdrawal._id}:${status}`,
      metadata: {
        withdrawalId: withdrawal._id?.toString(),
        status,
        amount: withdrawal.amount,
        trx: withdrawal.trx || null,
        notes: withdrawal.notes || null,
      },
    })
    .catch(() => {});

  return new ApiResponse(200, true, "Withdrawal updated successfully", {
    withdrawal,
    availableBalance: referral.availableBalance,
  }).send(res);
});

function setSuperAdminNoStoreHeaders(res) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
}

function formatUptimeHuman(uptimeSeconds) {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/**
 * @desc Get high-level system infrastructure & governance overview (SuperAdmin only)
 */
export const getSuperAdminSystemOverview = asyncHandler(async (req, res) => {
  setSuperAdminNoStoreHeaders(res);
  const refreshed = req.query.refresh === "true";
  const now = new Date();

  const [
    roleCounts,
    disabledCount,
    totalAppUsers,
    activeAppUsers,
    appUserAgg,
    activeSessions,
    latestBackupDoc,
    aiApiDocs,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    User.countDocuments({ isDisabled: true }),
    AppUser.countDocuments(),
    AppUser.countDocuments({ isActive: true, status: "active" }),
    AppUser.aggregate([{ $group: { _id: null, totalProcesses: { $sum: "$totalProcess" } } }]),
    Session.countDocuments({ revokedAt: null, expiresAt: { $gt: now } }),
    BackupLog.findOne().sort({ timestamp: -1 }).lean().catch(() => null),
    AiAPI.find().sort({ isActive: -1, updatedAt: -1 }).lean().catch(() => []),
  ]);

  const roleMap = { user: 0, admin: 0, superAdmin: 0 };
  roleCounts.forEach((r) => {
    if (r._id && roleMap[r._id] !== undefined) {
      roleMap[r._id] = r.count;
    }
  });

  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());
  const schedulerStatus = schedulerService.getStatus();
  const backupStatus = backupService.getStatus();

  const lastBackupSnapshot = latestBackupDoc
    ? {
        timestamp:
          latestBackupDoc.timestamp instanceof Date
            ? latestBackupDoc.timestamp.toISOString()
            : latestBackupDoc.timestamp,
        success: Boolean(latestBackupDoc.success),
        duration: latestBackupDoc.duration || "0ms",
        totalDocuments: latestBackupDoc.totalDocuments || 0,
        triggeredBy: latestBackupDoc.triggeredBy || "manual",
      }
    : backupStatus.stats?.lastBackupResult
      ? {
          timestamp: backupStatus.stats.lastBackupResult.timestamp,
          success: Boolean(backupStatus.stats.lastBackupResult.success),
          duration: backupStatus.stats.lastBackupResult.duration || "0ms",
          totalDocuments: backupStatus.stats.lastBackupResult.totalDocuments || 0,
          triggeredBy: backupStatus.stats.lastBackupResult.triggeredBy || "manual",
        }
      : null;

  const systemHealth = {
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    platform: process.platform,
    uptimeSeconds,
    uptimeHuman: formatUptimeHuman(uptimeSeconds),
    memory: {
      rssMB: Math.round(memory.rss / (1024 * 1024)),
      heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
      heapTotalMB: Math.round(memory.heapTotal / (1024 * 1024)),
      externalMB: Math.round(memory.external / (1024 * 1024)),
    },
    database: {
      status: mongoose.connection.readyState === 1 ? "healthy" : "disconnected",
      name: mongoose.connection.name || "mongodb",
    },
    counts: {
      totalUsers: roleMap.user + roleMap.admin + roleMap.superAdmin,
      users: roleMap.user,
      admins: roleMap.admin,
      superAdmins: roleMap.superAdmin,
      disabledUsers: disabledCount,
      totalAppUsers,
      activeAppUsers,
      activeSessions,
      totalProcesses: appUserAgg[0]?.totalProcesses || 0,
    },
    services: {
      scheduler: {
        isRunning: Boolean(schedulerStatus.isRunning),
        nextMaintenanceRun: schedulerStatus.maintenance?.nextRun || null,
        nextBackupRun: schedulerStatus.backup?.nextBackup || null,
        timezone: schedulerStatus.timezone || "UTC",
      },
      backup: {
        isConfigured: Boolean(backupStatus.isConfigured),
        isRunning: Boolean(backupStatus.isRunning),
        targetDatabase: backupStatus.targetDatabase || "backup",
        lastBackup: lastBackupSnapshot,
      },
      aiApi: {
        totalKeys: aiApiDocs.length,
        activeKeys: aiApiDocs.filter((k) => k.isActive).length,
        inactiveKeys: aiApiDocs.filter((k) => !k.isActive).length,
        primaryKeyName: aiApiDocs.find((k) => k.isActive)?.name || null,
        lastUpdatedAt: aiApiDocs[0]?.updatedAt || null,
      },
    },
    meta: {
      generatedAt: now.toISOString(),
      refreshed,
    },
  };

  return new ApiResponse(200, true, "SuperAdmin system overview fetched successfully", systemHealth).send(res);
});

/**
 * @desc List all staff accounts (Admins & SuperAdmins)
 */
export const getAdminList = asyncHandler(async (req, res) => {
  setSuperAdminNoStoreHeaders(res);
  const refreshed = req.query.refresh === "true";

  const staff = await User.find({
    role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] },
  })
    .select("-password -refreshToken -verificationToken")
    .sort({ role: -1, createdAt: -1 })
    .lean();

  const summary = {
    total: staff.length,
    superAdmins: staff.filter((m) => m.role === USER_ROLES.SUPER_ADMIN).length,
    admins: staff.filter((m) => m.role === USER_ROLES.ADMIN).length,
    active: staff.filter((m) => !m.isDisabled).length,
    disabled: staff.filter((m) => m.isDisabled).length,
  };

  return new ApiResponse(200, true, "Staff accounts retrieved successfully", {
    staff,
    total: staff.length,
    summary,
    meta: {
      generatedAt: new Date().toISOString(),
      refreshed,
    },
  }).send(res);
});

/**
 * @desc Promote / Demote user role by userId or email (SuperAdmin only)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  setSuperAdminNoStoreHeaders(res);
  const { userId, email, identifier, role } = req.body;

  const rawIdentifier = String(identifier || userId || email || "").trim();

  if (!rawIdentifier || !role) {
    throw new ApiError(400, "User ID or email and target role are required");
  }

  const validRoles = [USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, `Invalid role. Allowed roles: ${validRoles.join(", ")}`);
  }

  let targetUser = null;
  if (rawIdentifier.includes("@")) {
    targetUser = await User.findOne({ email: rawIdentifier.toLowerCase() });
  } else if (mongoose.Types.ObjectId.isValid(rawIdentifier)) {
    targetUser = await User.findById(rawIdentifier);
  } else {
    throw new ApiError(400, "Please provide a valid User ID or email address");
  }

  if (!targetUser) {
    throw new ApiError(404, "Target user not found");
  }

  // Prevent superAdmin from demoting themselves
  if (req.user._id.toString() === targetUser._id.toString() && role !== USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(400, "You cannot demote your own SuperAdmin account");
  }

  // Protect the last remaining active SuperAdmin
  if (targetUser.role === USER_ROLES.SUPER_ADMIN && role !== USER_ROLES.SUPER_ADMIN) {
    const activeSuperAdminCount = await User.countDocuments({
      role: USER_ROLES.SUPER_ADMIN,
      isDisabled: { $ne: true },
    });
    if (activeSuperAdminCount <= 1) {
      throw new ApiError(400, "Cannot demote the last active SuperAdmin");
    }
  }

  targetUser.role = role;
  await targetUser.save();

  Promise.all([
    notificationService.notifyUser({
      recipientId: targetUser._id,
      recipientEmail: targetUser.email,
      recipientName: targetUser.name,
      type: "security.role_updated",
      category: NOTIFICATION_CATEGORIES.SECURITY,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      forceDeliver: true,
      title: "Account Role Updated",
      message: `Your account role has been updated to "${role}" by an administrator.`,
      actionUrl: role === USER_ROLES.USER ? "/dashboard" : "/admin",
      actionLabel: role === USER_ROLES.USER ? "Open Dashboard" : "Open Admin Console",
      metadata: { role },
    }),
    notificationService.notifyAdmins({
      superAdminOnly: true,
      excludeUserId: req.user._id,
      type: "admin.staff_role_updated",
      category: NOTIFICATION_CATEGORIES.SECURITY,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      title: "Staff Role Updated",
      message: `${req.user?.name || req.user?.email || "A SuperAdmin"} updated ${targetUser.email}'s role to "${role}".`,
      actionUrl: "/admin/super-admin",
      actionLabel: "View Governance",
      actor: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
      metadata: { targetUserId: targetUser._id.toString(), role },
    }),
  ]).catch(() => {});

  return new ApiResponse(200, true, `User role successfully updated to ${role}`, {
    _id: targetUser._id,
    userId: targetUser._id,
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
    isDisabled: targetUser.isDisabled,
    isVerified: targetUser.isVerified,
  }).send(res);
});

/**
 * @desc Toggle user disabled / banned status (SuperAdmin only)
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  setSuperAdminNoStoreHeaders(res);
  const { userId, isDisabled } = req.body;

  if (!userId || typeof isDisabled !== "boolean") {
    throw new ApiError(400, "User ID and boolean isDisabled status are required");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User ID format");
  }

  // Prevent self-disable
  if (req.user._id.toString() === userId.toString()) {
    throw new ApiError(400, "You cannot disable your own account");
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new ApiError(404, "Target user not found");
  }

  if (isDisabled && targetUser.role === USER_ROLES.SUPER_ADMIN) {
    const activeSuperAdminCount = await User.countDocuments({
      role: USER_ROLES.SUPER_ADMIN,
      isDisabled: { $ne: true },
    });
    if (activeSuperAdminCount <= 1) {
      throw new ApiError(400, "Cannot disable the last active SuperAdmin");
    }
  }

  targetUser.isDisabled = isDisabled;
  await targetUser.save();

  if (isDisabled) {
    await Session.updateMany(
      { userId: targetUser._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "user_disabled" } }
    );
  }

  notificationService
    .notifyUser({
      recipientId: targetUser._id,
      recipientEmail: targetUser.email,
      recipientName: targetUser.name,
      type: isDisabled ? "security.account_disabled" : "security.account_enabled",
      category: NOTIFICATION_CATEGORIES.SECURITY,
      priority: NOTIFICATION_PRIORITIES.URGENT,
      forceDeliver: true,
      sendEmail: true,
      title: isDisabled ? "Account Disabled" : "Account Re-enabled",
      message: isDisabled
        ? "Your GenMeta account has been disabled by an administrator. Please contact support@genmeta.app if you believe this is an error."
        : "Your GenMeta account has been re-enabled and is active again.",
      actionUrl: isDisabled ? "/contact" : "/dashboard",
      actionLabel: isDisabled ? "Contact Support" : "Open Dashboard",
    })
    .catch(() => {});

  return new ApiResponse(
    200,
    true,
    `User account successfully ${isDisabled ? "disabled" : "enabled"}`,
    {
      _id: targetUser._id,
      userId: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      isDisabled: targetUser.isDisabled,
    }
  ).send(res);
});

/**
 * @desc Get ONLY pending referral users for the notification panel
 * @route GET /api/v1/admin/notifications/referral-withdrawals
 * @access Private (Admin & SuperAdmin)
 */
export const getPendingWithdrawalNotifications = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  const referralsWithPending = await Referral.find({
    "withdrawHistory.status": WITHDRAWAL_STATUS.PENDING,
  })
    .populate("referrer", "name email avatar")
    .lean();

  const pendingUsers = [];

  for (const ref of referralsWithPending) {
    const referrer = ref.referrer;
    if (!referrer) continue;

    const pendingWithdrawals = (ref.withdrawHistory || []).filter(
      (w) => w.status === WITHDRAWAL_STATUS.PENDING
    );

    if (pendingWithdrawals.length === 0) continue;

    const totalPendingAmount = pendingWithdrawals.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );

    const sortedPending = pendingWithdrawals.sort(
      (a, b) =>
        new Date(b.requestedAt || b.createdAt || 0) -
        new Date(a.requestedAt || a.createdAt || 0)
    );
    const latestPending = sortedPending[0];
    const userIdStr = referrer._id.toString();

    pendingUsers.push({
      id: latestPending._id ? latestPending._id.toString() : userIdStr,
      withdrawalId: latestPending._id ? latestPending._id.toString() : "",
      userId: userIdStr,
      userName: referrer.name || "Referral User",
      userEmail: referrer.email || "",
      userAvatar: referrer.avatar || null,
      amount: totalPendingAmount,
      withdrawAccount: latestPending.withdrawAccount || ref.withdrawAccount || "N/A",
      requestedAt: latestPending.requestedAt || latestPending.createdAt || new Date(),
      status: WITHDRAWAL_STATUS.PENDING,
      pendingCount: pendingWithdrawals.length,
      href: `/admin/referral/${userIdStr}`,
    });
  }

  pendingUsers.sort(
    (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)
  );

  return new ApiResponse(200, true, "Pending referral users retrieved", {
    count: pendingUsers.length,
    notifications: pendingUsers,
  }).send(res);
});
