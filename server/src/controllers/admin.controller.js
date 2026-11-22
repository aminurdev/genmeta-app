import mongoose from "mongoose";
import { AppUser } from "../models/appUser.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { ApiUsageLog } from "../models/apiUsageLog.model.js";
import { User } from "../models/user.model.js";
import { Session } from "../models/session.model.js";
import { Referral } from "../models/referral.model.js";
import { ReferralWithdrawal } from "../models/referralWithdrawal.model.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PLAN_TYPES, USER_ROLES, WITHDRAWAL_STATUS } from "../constants/index.js";

const toUtcDateKey = (date) => new Date(date).toISOString().split("T")[0];
const toUtcMonthKey = (date) => new Date(date).toISOString().slice(0, 7);

function calcGrowthPercentage(current, previous) {
  if (previous > 0) {
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }
  return current > 0 ? 100 : 0;
}

export const getAdminDashboardStats = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

  const now = new Date();
  const isExplicitRefresh =
    req.query.refresh === "true" || req.query.refresh === "1";

  // On explicit refresh, reconcile active paid accounts whose plan expired or ran out of credits
  let syncedExpiredPlans = 0;
  if (isExplicitRefresh) {
    const stalePaidUsers = await AppUser.find({
      isActive: true,
      status: "active",
      $or: [
        { "plan.type": PLAN_TYPES.SUBSCRIPTION, expiresAt: { $lte: now } },
        { "plan.type": PLAN_TYPES.CREDIT, expiresAt: { $lte: now } },
        { "plan.type": PLAN_TYPES.CREDIT, credit: { $lte: 0 } },
      ],
    });

    if (stalePaidUsers.length > 0) {
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
      syncedExpiredPlans = stalePaidUsers.length;
    }
  }

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
      .select("userId username key plan totalProcess totalFailedProcess status")
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
    key: item.key || null,
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
  const { page = 1, limit = 10, search = "", role, status, plan } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (role) {
    filter.role = role;
  }

  // If filtering by plan, status, or searching by AppUser key/username
  const appUserQuery = {};
  let hasAppUserConstraint = false;

  if (plan && plan !== "all") {
    appUserQuery["plan.type"] = plan;
    hasAppUserConstraint = true;
  }

  if (status === "active") {
    appUserQuery.status = "active";
  } else if (status === "disabled" || status === "suspended") {
    appUserQuery.status = "suspended";
    hasAppUserConstraint = true;
  }

  if (search) {
    const matchingAppUsers = await AppUser.find({
      $or: [
        { username: { $regex: search, $options: "i" } },
        { key: { $regex: search, $options: "i" } },
      ],
    })
      .select("userId")
      .lean();
    const matchedIds = matchingAppUsers.map((a) => a.userId);

    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      ...(matchedIds.length > 0 ? [{ _id: { $in: matchedIds } }] : []),
    ];
  }

  if (hasAppUserConstraint) {
    const constrainedAppUsers = await AppUser.find(appUserQuery).select("userId").lean();
    const constrainedUserIds = constrainedAppUsers.map((a) => a.userId);
    if (plan === "free" && (!status || status === "active")) {
      // Include users who don't have a paid AppUser record yet
      const nonFreeUsers = await AppUser.find({
        $or: [
          { "plan.type": { $ne: "free" } },
          ...(status === "active" ? [{ status: "suspended" }] : []),
        ],
      })
        .select("userId")
        .lean();
      filter._id = { $nin: nonFreeUsers.map((a) => a.userId) };
    } else if (status === "suspended" && (!plan || plan === "all")) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { isDisabled: true },
            { _id: { $in: constrainedUserIds } },
          ],
        },
      ];
    } else {
      filter._id = { $in: constrainedUserIds };
    }
  } else if (status === "active") {
    const suspendedAppUsers = await AppUser.find({ status: "suspended" }).select("userId").lean();
    filter.isDisabled = false;
    if (suspendedAppUsers.length > 0) {
      filter._id = { $nin: suspendedAppUsers.map((a) => a.userId) };
    }
  }

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

  const enrichedUsers = users.map((u) => {
    const appUserDoc = appUserMap.get(u._id.toString());
    return {
      ...u,
      username: appUserDoc?.username || u.email,
      key: appUserDoc?.key || null,
      plan: appUserDoc?.plan || { type: "free", name: "Free" },
      credit:
        appUserDoc?.credit === Infinity
          ? null
          : appUserDoc?.credit ?? 5,
      status: appUserDoc?.status || (u.isDisabled ? "suspended" : "active"),
      allowedDevices: appUserDoc?.allowedDevices || [],
      devices: appUserDoc?.devices || [],
      maxDevices: appUserDoc?.maxDevices || 2,
      totalProcess: appUserDoc?.totalProcess || 0,
      expiresAt: appUserDoc?.expiresAt || null,
    };
  });

  return new ApiResponse(200, true, "Users retrieved successfully", {
    users: enrichedUsers,
    total,
    totalPages: Math.ceil(total / limitNum),
    page: pageNum,
    limit: limitNum,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  }).send(res);
});

export const getUserStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [userCounts, appUserCounts, dailyNewUsers, planDistribution, roleStats] = await Promise.all([
    User.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                activeUsers: { $sum: { $cond: [{ $eq: ["$isDisabled", false] }, 1, 0] } },
                suspendedUsers: { $sum: { $cond: [{ $eq: ["$isDisabled", true] }, 1, 0] } },
                verifiedUsers: { $sum: { $cond: ["$isVerified", 1, 0] } },
                newUsers24h: { $sum: { $cond: [{ $gte: ["$createdAt", yesterday] }, 1, 0] } },
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
          totalProcesses: { $sum: "$totalProcess" },
        },
      },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]),
    AppUser.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$plan.type", "free"] },
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

  const u = userCounts[0]?.totals[0] || {
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    verifiedUsers: 0,
    newUsers24h: 0,
  };

  const a = appUserCounts[0] || { totalAppUsers: 0, totalProcesses: 0 };
  const totalProcesses = a.totalProcesses || 0;
  const avgProcessesPerUser = u.totalUsers > 0 ? totalProcesses / u.totalUsers : 0;

  const usersByPlan = {};
  planDistribution.forEach((p) => {
    usersByPlan[p._id] = p.count;
  });

  const stats = {
    totalUsers: u.totalUsers,
    activeUsers: u.activeUsers,
    suspendedUsers: u.suspendedUsers,
    verifiedUsers: u.verifiedUsers,
    dailyNewUsers:
      dailyNewUsers.length > 0
        ? dailyNewUsers
        : [{ date: new Date().toISOString().split("T")[0], count: u.newUsers24h }],
    totalProcesses,
    avgProcessesPerUser,
    usersByPlan,
    roleDistribution: roleStats,
  };

  return new ApiResponse(200, true, "User statistics retrieved", stats).send(res);
});

export const getPaymentsHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", startDate, endDate, status } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  if (status) {
    query.status = { $regex: new RegExp(`^${status}$`, "i") };
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    query.$or = [
      { trxID: { $regex: search, $options: "i" } },
      { paymentID: { $regex: search, $options: "i" } },
      { userId: { $in: userIds } },
    ];
  }

  const [payments, total] = await Promise.all([
    AppPayment.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AppPayment.countDocuments(query),
  ]);

  const transformedPayments = payments.map((p) => {
    const userObj = p.userId && typeof p.userId === "object" ? p.userId : null;
    return {
      _id: p._id,
      user: {
        _id: userObj?._id?.toString() || p.userId?.toString() || "N/A",
        name: userObj?.name || "Unknown User",
        email: userObj?.email || "N/A",
      },
      userId: p.userId,
      paymentID: p.paymentID,
      trxID: p.trxID,
      plan: p.plan,
      amount: p.amount,
      currency: p.currency || "BDT",
      gateway: p.gateway,
      status: p.status || "Completed",
      transactionStatus: p.status || "Completed",
      paymentDetails: p.paymentDetails,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  const totalPages = Math.ceil(total / limitNum);

  return new ApiResponse(200, true, "Payments history retrieved", {
    payments: transformedPayments,
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
  }).send(res);
});

export const downloadPaymentsHistory = asyncHandler(async (req, res) => {
  const payments = await AppPayment.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .lean();

  let csv = "ID,User Name,User Email,Amount,TrxID,PaymentID,Plan Name,Plan Type,Gateway,Created At\n";

  for (const p of payments) {
    const userName = (p.userId?.name || "").replace(/"/g, '""');
    const userEmail = (p.userId?.email || "").replace(/"/g, '""');
    const planName = (p.plan?.name || "").replace(/"/g, '""');
    const planType = (p.plan?.type || "").replace(/"/g, '""');
    const date = new Date(p.createdAt).toISOString();

    csv += `"${p._id}","${userName}","${userEmail}",${p.amount},"${p.trxID}","${p.paymentID}","${planName}","${planType}","${p.gateway || "bkash"}","${date}"\n`;
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="payments_history.csv"');
  return res.status(200).send(csv);
});

export const getAllReferrals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (search) {
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");
    const userIds = matchingUsers.map((u) => u._id);
    filter.$or = [
      { referrer: { $in: userIds } },
      { referralCode: { $regex: search, $options: "i" } },
    ];
  }

  const [referrals, total] = await Promise.all([
    Referral.find(filter)
      .populate("referrer", "name email")
      .sort({ availableBalance: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Referral.countDocuments(filter),
  ]);

  const transformedReferrals = referrals.map((r) => {
    const totalEarned = (r.earnedHistory || []).reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );
    const pendingWithdrawals = (r.withdrawHistory || []).filter(
      (w) => w.status === WITHDRAWAL_STATUS.PENDING
    ).length;
    const referredCount = Array.isArray(r.referredUsers)
      ? r.referredUsers.length
      : 0;

    return {
      _id: r._id,
      referrer: r.referrer || { name: "Unknown User", email: "N/A" },
      referralCode: r.referralCode,
      referredCount,
      totalEarned,
      availableBalance: r.availableBalance || 0,
      pendingWithdrawals,
      withdrawAccount: r.withdrawAccount || null,
      earnedHistory: r.earnedHistory || [],
      withdrawHistory: r.withdrawHistory || [],
      createdAt: r.createdAt,
    };
  });

  return new ApiResponse(200, true, "Referrals retrieved", {
    referrals: transformedReferrals,
    total,
    totalPages: Math.ceil(total / limitNum),
    page: pageNum,
    limit: limitNum,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  }).send(res);
});

export const getReferralByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const referral = await Referral.findOne({ referrer: userId })
    .populate("referrer", "name email")
    .populate("referredUsers", "name email createdAt")
    .populate("earnedHistory.user", "name email");

  if (!referral) {
    throw new ApiError(404, "Referral record not found for this user");
  }

  return new ApiResponse(200, true, "Referral details retrieved", referral).send(res);
});

export const updateWithdrawal = asyncHandler(async (req, res) => {
  const { userId, withdrawalId } = req.params;
  const { status, trx, notes } = req.body;

  if (!status || !Object.values(WITHDRAWAL_STATUS).includes(status)) {
    throw new ApiError(400, "Invalid withdrawal status");
  }

  const referral = await Referral.findOne({ referrer: userId });
  if (!referral) {
    throw new ApiError(404, "Referral record not found");
  }

  const withdrawal = referral.withdrawHistory.id(withdrawalId);
  if (!withdrawal) {
    throw new ApiError(404, "Withdrawal request not found");
  }

  const previousStatus = withdrawal.status;
  withdrawal.status = status;
  if (trx) withdrawal.trx = trx;
  withdrawal.issuedAt = new Date();

  // If rejected from pending, refund balance atomically
  if (status === WITHDRAWAL_STATUS.REJECTED && previousStatus === WITHDRAWAL_STATUS.PENDING) {
    referral.availableBalance += withdrawal.amount;
  }

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
          status,
          trx: trx || null,
          notes: notes || null,
          issuedAt: new Date(),
        },
      }
    );
  } catch {
    // Non-blocking
  }

  return new ApiResponse(200, true, "Withdrawal updated successfully", {
    withdrawal,
    availableBalance: referral.availableBalance,
  }).send(res);
});

/**
 * @desc Get high-level system infrastructure & governance overview (SuperAdmin only)
 */
export const getSuperAdminSystemOverview = asyncHandler(async (req, res) => {
  const [roleCounts, disabledCount, totalAppUsers, appUserAgg] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    User.countDocuments({ isDisabled: true }),
    AppUser.countDocuments(),
    AppUser.aggregate([{ $group: { _id: null, totalProcesses: { $sum: "$totalProcess" } } }]),
  ]);

  const roleMap = { user: 0, admin: 0, superAdmin: 0 };
  roleCounts.forEach((r) => {
    if (r._id && roleMap[r._id] !== undefined) {
      roleMap[r._id] = r.count;
    }
  });

  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const systemHealth = {
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    platform: process.platform,
    uptimeSeconds,
    uptimeHuman: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`,
    memory: {
      rssMB: Math.round(memory.rss / (1024 * 1024)),
      heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
      heapTotalMB: Math.round(memory.heapTotal / (1024 * 1024)),
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
      totalProcesses: appUserAgg[0]?.totalProcesses || 0,
    },
  };

  return new ApiResponse(200, true, "SuperAdmin system overview fetched successfully", systemHealth).send(res);
});

/**
 * @desc List all staff accounts (Admins & SuperAdmins)
 */
export const getAdminList = asyncHandler(async (req, res) => {
  const staff = await User.find({
    role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] },
  })
    .select("-password -refreshToken -verificationToken")
    .sort({ role: 1, createdAt: -1 });

  return new ApiResponse(200, true, "Staff accounts retrieved successfully", {
    staff,
    total: staff.length,
  }).send(res);
});

/**
 * @desc Promote / Demote user role (SuperAdmin only)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  if (!userId || !role) {
    throw new ApiError(400, "User ID and target role are required");
  }

  const validRoles = [USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, `Invalid role. Allowed roles: ${validRoles.join(", ")}`);
  }

  // Prevent superAdmin from demoting themselves
  if (req.user._id.toString() === userId.toString() && role !== USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(400, "You cannot demote your own SuperAdmin account");
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new ApiError(404, "Target user not found");
  }

  // If demoting another superAdmin, check that there is at least one other superAdmin remaining
  if (targetUser.role === USER_ROLES.SUPER_ADMIN && role !== USER_ROLES.SUPER_ADMIN) {
    const superAdminCount = await User.countDocuments({ role: USER_ROLES.SUPER_ADMIN });
    if (superAdminCount <= 1) {
      throw new ApiError(400, "Cannot demote the last remaining SuperAdmin");
    }
  }

  targetUser.role = role;
  await targetUser.save();

  return new ApiResponse(200, true, `User role successfully updated to ${role}`, {
    userId: targetUser._id,
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
  }).send(res);
});

/**
 * @desc Toggle user disabled / banned status (SuperAdmin only)
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId, isDisabled } = req.body;

  if (!userId || typeof isDisabled !== "boolean") {
    throw new ApiError(400, "User ID and boolean isDisabled status are required");
  }

  // Prevent self-disable
  if (req.user._id.toString() === userId.toString()) {
    throw new ApiError(400, "You cannot disable your own account");
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new ApiError(404, "Target user not found");
  }

  targetUser.isDisabled = isDisabled;
  await targetUser.save();

  if (isDisabled) {
    await Session.updateMany(
      { userId: targetUser._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "user_disabled" } }
    );
  }

  return new ApiResponse(
    200,
    true,
    `User account successfully ${isDisabled ? "disabled" : "enabled"}`,
    {
      userId: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
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
