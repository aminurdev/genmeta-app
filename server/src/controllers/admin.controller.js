import mongoose from "mongoose";
import { AppUser } from "../models/appUser.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { User } from "../models/user.model.js";
import { Session } from "../models/session.model.js";
import { Referral } from "../models/referral.model.js";
import { ReferralWithdrawal } from "../models/referralWithdrawal.model.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { USER_ROLES, WITHDRAWAL_STATUS } from "../constants/index.js";

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
    appUserStats,
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

    // 5. Top Usage (AppUser)
    AppUser.find({ totalProcess: { $gt: 0 } })
      .populate("userId", "name email")
      .sort({ totalProcess: -1 })
      .limit(5)
      .lean(),

    // 6. Top Spenders
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

    // 7. Top Referrers
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
  const totalProcessCount = appUserStats[0]?.totalProcesses[0]?.total || 0;
  const currentMonthStr = formatMonthKey(now);
  monthlyProcessMap[currentMonthStr] = Math.round(totalProcessCount * 0.4);

  const appUserCounts = appUserStats[0]?.counts[0] || {
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
    appUsers: {
      total: appUserCounts.total || 0,
      newThisMonth: appUserCounts.newThisMonth || 0,
      active: appUserCounts.active || 0,
      activePremium: appUserCounts.activePremium || 0,
      subscriptionPlanCount: appUserCounts.subscriptionPlanCount || 0,
      creditPlanCount: appUserCounts.creditPlanCount || 0,
      monthlyProcessList: monthlyProcessMap,
      topUsage,
    },
    processes: appUserStats[0]?.totalProcesses[0] || { total: 0, totalFailed: 0 },
    payments: {
      total: paymentCount,
      newThisMonth: paymentNewThisMonth,
      recent: paymentStats[0]?.recent || [],
      topSpenders,
    },
    recentPayments: paymentStats[0]?.recent || [],
    topReferrers,
    referrals: referralStats[0]?.totals[0] || { totalAvailable: 0 },
  };

  return new ApiResponse(200, true, "Admin dashboard stats retrieved", responseData).send(res);
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
