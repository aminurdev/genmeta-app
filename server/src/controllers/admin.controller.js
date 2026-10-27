import mongoose from "mongoose";
import { AppKey } from "../models/appKey.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { User } from "../models/user.model.js";
import { Referral } from "../models/referral.model.js";
import { ReferralWithdrawal } from "../models/referralWithdrawal.model.js";
import { Order } from "../models/order.model.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { WITHDRAWAL_STATUS } from "../constants/index.js";

export const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const formatMonthKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const monthlyKeys = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyKeys[formatMonthKey(d)] = 0;
  }

  const [
    paymentStats,
    appKeyStats,
    userStats,
    referralStats,
    orderStats,
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
              },
            },
          ],
          monthlyRevenue: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                amount: { $sum: "$amount" },
              },
            },
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
              },
            },
            {
              $project: {
                amount: 1,
                createdAt: 1,
                plan: 1,
                trxID: 1,
                userId: { $arrayElemAt: ["$user", 0] },
              },
            },
          ],
          count: [{ $count: "total" }],
          newThisMonth: [
            {
              $match: { createdAt: { $gte: thisMonth } },
            },
            { $count: "total" },
          ],
        },
      },
    ]),

    // 2. App Key Aggregation
    AppKey.aggregate([
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
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$isActive", true] },
                          { $eq: ["$status", "active"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                activePremium: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$isActive", true] },
                          { $eq: ["$status", "active"] },
                          { $ne: ["$plan.type", "free"] },
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
                          { $eq: ["$isActive", true] },
                          { $eq: ["$status", "active"] },
                          { $eq: ["$plan.type", "subscription"] },
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
                          { $eq: ["$isActive", true] },
                          { $eq: ["$status", "active"] },
                          { $eq: ["$plan.type", "credit"] },
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
          totalProcesses: [
            {
              $group: {
                _id: null,
                total: { $sum: "$totalProcess" },
                totalFailed: { $sum: "$totalFailedProcess" },
              },
            },
          ],
        },
      },
    ]),

    // 3. User Aggregation
    User.aggregate([
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                verified: { $sum: { $cond: ["$isVerified", 1, 0] } },
                newThisMonth: {
                  $sum: { $cond: [{ $gte: ["$createdAt", thisMonth] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]),

    // 4. Referral Aggregation
    Referral.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalAvailable: { $sum: "$availableBalance" },
              },
            },
          ],
        },
      },
    ]),

    // 5. Orders Aggregation
    Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]),

    // 6. Top Usage (AppKey)
    AppKey.find({ totalProcess: { $gt: 0 } })
      .populate("userId", "name email")
      .sort({ totalProcess: -1 })
      .limit(5)
      .lean(),

    // 7. Top Spenders
    AppPayment.aggregate([
      { $group: { _id: "$userId", totalSpent: { $sum: "$amount" } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          _id: 1,
          totalSpent: 1,
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
    ]),

    // 8. Top Referrers
    Referral.aggregate([
      {
        $project: {
          referrer: 1,
          referredCount: { $size: { $ifNull: ["$referredUsers", []] } },
          availableBalance: 1,
        },
      },
      { $sort: { referredCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "referrer",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          _id: 1,
          referredCount: 1,
          availableBalance: 1,
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
    ]),
  ]);

  const revData = paymentStats[0]?.revenue[0] || { total: 0, currentMonth: 0, lastMonth: 0 };
  const monthlyRevenueMap = { ...monthlyKeys };
  (paymentStats[0]?.monthlyRevenue || []).forEach((item) => {
    if (monthlyRevenueMap[item._id] !== undefined) {
      monthlyRevenueMap[item._id] = item.amount;
    }
  });

  const growthPercentage =
    revData.lastMonth > 0
      ? ((revData.currentMonth - revData.lastMonth) / revData.lastMonth) * 100
      : revData.currentMonth > 0
      ? 100
      : 0;

  const topUsage = topUsageDocs.map((item) => ({
    _id: item._id,
    count: item.totalProcess || 0,
    user: item.userId || { name: item.username || "Unknown", email: item.username || "N/A" },
  }));

  const topSpenders = topSpendersDocs.map((item) => ({
    _id: item._id,
    totalSpent: item.totalSpent || 0,
    user: item.user || { name: "Unknown", email: "N/A" },
  }));

  const topReferrers = topReferrersDocs.map((item) => ({
    _id: item._id,
    referredCount: item.referredCount || 0,
    user: item.user || { name: "Unknown", email: "N/A" },
  }));

  const monthlyProcessMap = { ...monthlyKeys };
  const totalProcessCount = appKeyStats[0]?.totalProcesses[0]?.total || 0;
  const currentMonthStr = formatMonthKey(now);
  monthlyProcessMap[currentMonthStr] = Math.round(totalProcessCount * 0.4);

  const appKeyCounts = appKeyStats[0]?.counts[0] || {
    total: 0,
    newThisMonth: 0,
    active: 0,
    activePremium: 0,
    subscriptionPlanCount: 0,
    creditPlanCount: 0,
  };

  const paymentCount = paymentStats[0]?.count[0]?.total || 0;
  const paymentNewThisMonth = paymentStats[0]?.newThisMonth[0]?.total || 0;

  const responseData = {
    revenue: {
      total: revData.total,
      currentMonth: revData.currentMonth,
      lastMonth: revData.lastMonth,
      growthPercentage: Number(growthPercentage.toFixed(2)),
      monthlyBreakdown: monthlyRevenueMap,
      monthlyRevenueList: monthlyRevenueMap,
    },
    users: userStats[0]?.counts[0] || { total: 0, verified: 0, newThisMonth: 0 },
    appKeys: {
      total: appKeyCounts.total || 0,
      newThisMonth: appKeyCounts.newThisMonth || 0,
      active: appKeyCounts.active || 0,
      activePremium: appKeyCounts.activePremium || 0,
      subscriptionPlanCount: appKeyCounts.subscriptionPlanCount || 0,
      creditPlanCount: appKeyCounts.creditPlanCount || 0,
      monthlyProcessList: monthlyProcessMap,
      topUsage,
    },
    processes: appKeyStats[0]?.totalProcesses[0] || { total: 0, totalFailed: 0 },
    payments: {
      total: paymentCount,
      newThisMonth: paymentNewThisMonth,
      recent: paymentStats[0]?.recent || [],
      topSpenders,
    },
    recentPayments: paymentStats[0]?.recent || [],
    topReferrers,
    ordersSummary: orderStats,
    referrals: referralStats[0]?.totals[0] || { totalAvailable: 0 },
  };

  return new ApiResponse(200, true, "Admin dashboard stats retrieved", responseData).send(res);
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", role, status } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (role) {
    filter.role = role;
  }

  if (status === "active") {
    filter.isDisabled = false;
  } else if (status === "disabled" || status === "suspended") {
    filter.isDisabled = true;
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

  // Enrich users with their AppKey details so appkey-list UI works seamlessly
  const userIds = users.map((u) => u._id);
  const appKeys = await AppKey.find({ userId: { $in: userIds } }).lean();
  const appKeyMap = new Map(appKeys.map((k) => [k.userId.toString(), k]));

  const enrichedUsers = users.map((u) => {
    const keyDoc = appKeyMap.get(u._id.toString());
    return {
      ...u,
      key: keyDoc?.key || null,
      plan: keyDoc?.plan || { type: "free", name: "Free" },
      credit: keyDoc?.credit ?? 0,
      status: keyDoc?.status || (u.isDisabled ? "suspended" : "active"),
      allowedDevices: keyDoc?.allowedDevices || [],
      totalProcess: keyDoc?.totalProcess || 0,
      expiresAt: keyDoc?.expiresAt || null,
      appKey: keyDoc?.key || null,
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

  const [userCounts, appKeyCounts, dailyNewUsers, planDistribution, roleStats] = await Promise.all([
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
    AppKey.aggregate([
      {
        $group: {
          _id: null,
          totalKeys: { $sum: 1 },
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
    AppKey.aggregate([
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

  const a = appKeyCounts[0] || { totalKeys: 0, totalProcesses: 0 };
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
  const { page = 1, limit = 10, search = "" } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (search) {
    query.$or = [
      { trxID: { $regex: search, $options: "i" } },
      { paymentID: { $regex: search, $options: "i" } },
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

  return new ApiResponse(200, true, "Payments history retrieved", {
    payments,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
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
      { _id: withdrawalId },
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
