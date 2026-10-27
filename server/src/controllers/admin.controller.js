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

  const [paymentStats, appKeyStats, userStats, referralStats, orderStats] = await Promise.all([
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
            { $limit: 5 },
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
  ]);

  const revData = paymentStats[0]?.revenue[0] || { total: 0, currentMonth: 0, lastMonth: 0 };
  const monthlyRevenueMap = { ...monthlyKeys };
  (paymentStats[0]?.monthlyRevenue || []).forEach((item) => {
    if (monthlyRevenueMap[item._id] !== undefined) {
      monthlyRevenueMap[item._id] = item.amount;
    }
  });

  const responseData = {
    revenue: {
      total: revData.total,
      currentMonth: revData.currentMonth,
      lastMonth: revData.lastMonth,
      monthlyBreakdown: monthlyRevenueMap,
    },
    users: userStats[0]?.counts[0] || { total: 0, verified: 0, newThisMonth: 0 },
    appKeys: appKeyStats[0]?.counts[0] || { total: 0, active: 0, activePremium: 0 },
    processes: appKeyStats[0]?.totalProcesses[0] || { total: 0, totalFailed: 0 },
    recentPayments: paymentStats[0]?.recent || [],
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
  } else if (status === "disabled") {
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

  return new ApiResponse(200, true, "Users retrieved successfully", {
    users,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  }).send(res);
});

export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

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
  const { page = 1, limit = 10 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const [referrals, total] = await Promise.all([
    Referral.find()
      .populate("referrer", "name email")
      .sort({ availableBalance: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Referral.countDocuments(),
  ]);

  return new ApiResponse(200, true, "Referrals retrieved", {
    referrals,
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
