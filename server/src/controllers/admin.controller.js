import mongoose from "mongoose";
import { AppKey } from "../models/appKey.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppPricing } from "../models/appPricing.model.js";
import { Referral } from "../models/referral.model.js";

const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // === 1. PAYMENTS ===
  const allPayments = await AppPayment.find({});
  const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);

  const currentMonthRevenue = allPayments
    .filter((p) => new Date(p.createdAt) >= thisMonth)
    .reduce((sum, p) => sum + p.amount, 0);

  const lastMonthRevenue = allPayments
    .filter(
      (p) =>
        new Date(p.createdAt) >= lastMonth && new Date(p.createdAt) < thisMonth
    )
    .reduce((sum, p) => sum + p.amount, 0);

  const revenueGrowth =
    lastMonthRevenue === 0
      ? null
      : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

  // === 2. API KEYS ===
  const totalAppKeys = await AppKey.countDocuments();
  const activeAppKeys = await AppKey.countDocuments({
    isActive: true,
    status: "active",
  });
  const newAppKeysThisMonth = await AppKey.countDocuments({
    createdAt: { $gte: thisMonth },
  });

  // 🔍 Active premium keys (not free)
  const activePremiumKeys = await AppKey.find({
    isActive: true,
    status: "active",
    "plan.type": { $ne: "free" },
  });

  const activePremiumCount = activePremiumKeys.length;
  const subscriptionPlanCount = activePremiumKeys.filter(
    (key) => key.plan?.type === "subscription"
  ).length;
  const creditPlanCount = activePremiumKeys.filter(
    (key) => key.plan?.type === "credit"
  ).length;

  const appKeys = await AppKey.find({});
  const monthlyProcessList = {};
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyProcessList[monthKey] = 0;
  }

  appKeys.forEach((appKey) => {
    if (!appKey.monthlyProcess) return;
    for (const [month, count] of appKey.monthlyProcess.entries()) {
      if (monthlyProcessList[month] !== undefined) {
        monthlyProcessList[month] += count;
      }
    }
  });

  // === 3. USERS ===
  const totalUsers = await User.countDocuments();
  const newUsersThisMonth = await User.countDocuments({
    createdAt: { $gte: thisMonth },
  });

  // === 4. MONTHLY REVENUE LIST ===
  const monthlyRevenueList = {};
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenueList[monthKey] = 0;
  }

  allPayments.forEach((payment) => {
    const createdAt = new Date(payment.createdAt);
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyRevenueList[key] !== undefined) {
      monthlyRevenueList[key] += payment.amount;
    }
  });

  // === 5. RECENT PAYMENTS ===
  const recentPayments = await AppPayment.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("userId", "name email")
    .select("amount createdAt userId");

  const monthlyNewPayments = await AppPayment.countDocuments({
    createdAt: { $gte: thisMonth },
  });

  // === 6. RESPONSE ===
  return new ApiResponse(
    200,
    true,
    "Admin dashboard statistics retrieved successfully",
    {
      revenue: {
        total: totalRevenue,
        currentMonth: currentMonthRevenue,
        lastMonth: lastMonthRevenue,
        growthPercentage: revenueGrowth,
        monthlyRevenueList,
      },
      appKeys: {
        total: totalAppKeys,
        newThisMonth: newAppKeysThisMonth,
        active: activeAppKeys,
        activePremium: activePremiumCount,
        subscriptionPlanCount,
        creditPlanCount,
        monthlyProcessList,
      },
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      payments: {
        total: allPayments.length,
        newThisMonth: monthlyNewPayments,
        recent: recentPayments,
      },
    }
  ).send(res);
});

const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 5,
    search = "",
    role,
    status,
    planType,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  try {
    // Input validation
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
    const skip = (pageNumber - 1) * pageSize;

    // Validate sortBy field
    const allowedSortFields = ["createdAt", "name", "email", "role"];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const validSortOrder = ["asc", "desc"].includes(sortOrder)
      ? sortOrder
      : "desc";

    // Build search query
    const searchQuery = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      searchQuery.$or = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ];
    }

    // Add filters
    if (role && ["user", "admin", "superAdmin"].includes(role)) {
      searchQuery.role = role;
    }

    if (status === "active") {
      searchQuery.isDisabled = false;
    } else if (status === "disabled") {
      searchQuery.isDisabled = true;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[validSortBy] = validSortOrder === "desc" ? -1 : 1;

    // Get users with basic aggregation
    const users = await User.aggregate([
      { $match: searchQuery },

      // Get latest app key for each user
      {
        $lookup: {
          from: "appkeys",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$userId", "$$userId"] },
                isActive: true,
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "appKey",
        },
      },

      { $unwind: { path: "$appKey", preserveNullAndEmptyArrays: true } },

      // Get pricing info if available
      {
        $lookup: {
          from: "apppricings",
          let: { planId: "$appKey.plan.id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ["$$planId", null] },
                    { $ne: ["$$planId", ""] },
                    { $eq: [{ $toString: "$_id" }, { $toString: "$$planId" }] },
                  ],
                },
              },
            },
          ],
          as: "planInfo",
        },
      },

      { $unwind: { path: "$planInfo", preserveNullAndEmptyArrays: true } },

      // Filter by plan type if specified
      ...(planType
        ? [
            {
              $match: { "appKey.plan.type": planType },
            },
          ]
        : []),

      // Project fields
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          isDisabled: 1,
          isVerified: 1,
          avatar: 1,
          loginProvider: 1,
          createdAt: 1,
          appKey: 1,
          planInfo: 1,
        },
      },

      { $sort: sortOptions },
      { $skip: skip },
      { $limit: pageSize },
    ]);

    // Get total count
    const totalUsers = await User.countDocuments(searchQuery);

    // Format the response
    const formattedUsers = users.map((user) => {
      const hasAppKey = user.appKey && user.appKey.plan;

      // Calculate credit based on plan type
      let credit = 0;
      let planStatus = "active";

      if (hasAppKey) {
        if (user.appKey.plan.type === "subscription") {
          if (
            user.appKey.expiresAt &&
            new Date() >= new Date(user.appKey.expiresAt)
          ) {
            credit = 0;
            planStatus = "expired";
          } else {
            credit = "unlimited";
            planStatus = "active";
          }
        } else {
          credit = user.appKey.credit || 0;
          planStatus = credit > 0 ? "active" : "depleted";
        }
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified || false,
        avatar: user.avatar || null,
        loginProvider: user.loginProvider || ["email"],
        status: user.isDisabled ? "disabled" : "active",
        createdAt: user.createdAt,

        currentPlan: hasAppKey
          ? {
              id: user.planInfo?._id?.toString() || null,
              name: user.planInfo?.name || `${user.appKey.plan.type} Plan`,
              type: user.appKey.plan.type,
              status: planStatus,
              expiresAt: user.appKey.expiresAt || null,
              basePrice: user.planInfo?.basePrice || null,
              discountPercent: user.planInfo?.discountPercent || 0,
            }
          : null,

        usage: {
          credit: credit,
          totalProcess: user.appKey?.totalProcess || 0,
          lastCreditRefresh: user.appKey?.lastCreditRefresh || null,
        },

        metadata: {
          hasActiveKey: hasAppKey,
          keyStatus: user.appKey?.status || null,
          planActive: user.planInfo?.isActive || false,
        },
      };
    });

    // Calculate pagination
    const pagination = {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalUsers / pageSize),
      totalUsers,
      pageSize,
      hasNextPage: pageNumber < Math.ceil(totalUsers / pageSize),
      hasPreviousPage: pageNumber > 1,
    };

    // Calculate stats
    const stats = {
      totalActiveUsers: formattedUsers.filter((u) => u.status === "active")
        .length,
      totalDisabledUsers: formattedUsers.filter((u) => u.status === "disabled")
        .length,
      totalWithPlans: formattedUsers.filter((u) => u.currentPlan).length,
      totalVerifiedUsers: formattedUsers.filter((u) => u.isVerified).length,
    };

    return new ApiResponse(200, true, "Users retrieved successfully", {
      users: formattedUsers,
      pagination,
      stats,
      filters: {
        search: search || null,
        role: role || null,
        status: status || null,
        planType: planType || null,
        sortBy: validSortBy,
        sortOrder: validSortOrder,
      },
    }).send(res);
  } catch (error) {
    console.error("Error in getAllUsers:", error);

    // More specific error handling
    if (error.name === "CastError") {
      throw new ApiError(400, "Invalid ID format in query parameters");
    }

    if (error.name === "ValidationError") {
      throw new ApiError(400, "Validation error: " + error.message);
    }

    throw new ApiError(500, "Failed to retrieve users: " + error.message);
  }
});

const getUserStats = asyncHandler(async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $facet: {
          totalUsers: [{ $count: "count" }],
          activeUsers: [{ $match: { isDisabled: false } }, { $count: "count" }],
          verifiedUsers: [
            { $match: { isVerified: true } },
            { $count: "count" },
          ],
          roleDistribution: [
            { $group: { _id: "$role", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          loginProviders: [
            { $unwind: "$loginProvider" },
            { $group: { _id: "$loginProvider", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          recentRegistrations: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
                },
              },
            },
            { $count: "count" },
          ],
        },
      },
    ]);

    const totalUsersCount = stats[0]?.totalUsers?.[0]?.count || 0;

    // Get count of unique users with at least one AppKey
    const appUserStats = await AppKey.aggregate([
      { $group: { _id: "$userId" } },
      { $count: "count" },
    ]);

    const appUsersCount = appUserStats[0]?.count || 0;
    const appUsersPercent =
      totalUsersCount > 0
        ? Math.round((appUsersCount / totalUsersCount) * 100)
        : 0;

    const formattedStats = {
      totalUsers: totalUsersCount,
      activeUsers: stats[0].activeUsers[0]?.count || 0,
      verifiedUsers: stats[0].verifiedUsers[0]?.count || 0,
      recentRegistrations: stats[0].recentRegistrations[0]?.count || 0,
      roleDistribution: stats[0].roleDistribution || [],
      loginProviders: stats[0].loginProviders || [],
      appUsers: {
        count: appUsersCount,
        percentage: appUsersPercent,
      },
    };

    return new ApiResponse(
      200,
      true,
      "User statistics retrieved successfully",
      formattedStats
    ).send(res);
  } catch (error) {
    console.error("Error in getUserStats:", error);
    throw new ApiError(500, "Failed to retrieve user statistics", error);
  }
});

const getPaymentsHistory = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    userId,
    startDate,
    endDate,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Search by trxID, paymentID, or user name/email
  if (search) {
    const matchedUsers = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    const userIds = matchedUsers.map((u) => u._id);

    query.$or = [
      { trxID: { $regex: search, $options: "i" } },
      { paymentID: { $regex: search, $options: "i" } },
      { userId: { $in: userIds } },
    ];
  }

  // Filter by userId
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    query.userId = new mongoose.Types.ObjectId(userId);
  }

  // Filter by date range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.max(1, parseInt(limit));
  const skip = (pageNum - 1) * pageSize;

  const total = await AppPayment.countDocuments(query);

  const payments = await AppPayment.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(pageSize)
    .populate("userId", "name email");

  // Collect plan IDs from structured `plan.id`
  const planIds = [
    ...new Set(
      payments
        .map((p) =>
          typeof p.plan === "object" && p.plan?.id ? p.plan.id.toString() : null
        )
        .filter(Boolean)
    ),
  ];

  // Fetch plan details
  const plansMap = new Map();
  if (planIds.length) {
    const plans = await AppPricing.find({ _id: { $in: planIds } }).select(
      "name type"
    );
    plans.forEach((plan) => plansMap.set(plan._id.toString(), plan));
  }

  // Format response
  const formattedPayments = payments.map((p) => {
    let planData = { id: null, name: null, type: null };

    if (p.plan.id === undefined) {
      // Old data, just a string
      planData.name = p.plan;
    } else if (p.plan.id) {
      const found = plansMap.get(p.plan?.id?.toString());
      planData = {
        id: p.plan?.id || null,
        name: found?.name || p.plan?.name || null,
        type: found?.type || p.plan?.type || null,
      };
    }

    return {
      _id: p._id,
      user: {
        _id: p.userId?._id,
        name: p.userId?.name,
        email: p.userId?.email,
      },
      paymentID: p.paymentID,
      trxID: p.trxID,
      plan: planData,
      amount: p.amount,
      createdAt: p.createdAt,
      transactionStatus: p.paymentDetails?.transactionStatus || "unknown",
    };
  });

  return new ApiResponse(200, true, "Payments fetched successfully", {
    total,
    page: pageNum,
    limit: pageSize,
    totalPages: Math.ceil(total / pageSize),
    payments: formattedPayments,
  }).send(res);
});

const downloadPaymentsHistory = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let filter = {};

  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    filter.createdAt = { $gte: firstDay, $lte: lastDay };
  }

  const payments = await AppPayment.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        name: "$user.name",
        email: "$user.email",
        paymentNumber: "$paymentDetails.customerMsisdn",
        paymentCreatedAt: "$createdAt",
        paymentExecuteTime: "$paymentDetails.paymentExecuteTime",
        amount: "$paymentDetails.amount",
        trxID: "$paymentDetails.trxID",
        paymentID: "$paymentDetails.paymentID",
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  // Format the paymentCreatedAt to readable format
  const formattedPayments = payments.map((payment) => {
    if (payment.paymentCreatedAt) {
      const date = new Date(payment.paymentCreatedAt);

      // Format to "Aug 01, 2025 04:56 PM"
      const options = {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };

      payment.paymentCreatedAt = date.toLocaleDateString("en-US", options);
    }
    return payment;
  });

  return new ApiResponse(
    200,
    true,
    "Payments history downloaded successfully",
    formattedPayments
  ).send(res);
});

const getAllReferrals = asyncHandler(async (req, res) => {
  const referrals = await Referral.find()
    .populate("referrer", "name email") // get user info
    .lean();

  const data = referrals.map((ref) => {
    const totalEarned = ref.earnedHistory.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );

    const pendingWithdrawals = ref.withdrawHistory.filter(
      (w) => w.status === "pending"
    ).length;

    return {
      referrer: ref.referrer,
      referralCode: ref.referralCode,
      referredCount: ref.referredUsers?.length || 0,
      totalEarned,
      availableBalance: ref.availableBalance,
      withdrawAccount: ref.withdrawAccount,
      pendingWithdrawals,
    };
  });

  return new ApiResponse(
    200,
    true,
    "All referral records retrieved",
    data
  ).send(res);
});

const getReferralByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const referral = await Referral.findOne({ referrer: userId })
    .populate("referrer", "name email")
    .populate("referredUsers", "name email")
    .populate("earnedHistory.user", "name email")
    .lean();

  if (!referral) {
    throw new ApiError(404, "Referral record not found for this user");
  }

  // Total earned
  const totalEarned = referral.earnedHistory.reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );

  const data = {
    referrer: referral.referrer,
    referralCode: referral.referralCode,
    availableBalance: referral.availableBalance,
    withdrawAccount: referral.withdrawAccount,
    referralCount: referral.referredUsers?.length || 0,
    totalEarned,
    referredUsers: referral.referredUsers,
    earnedHistory: referral.earnedHistory,
    withdrawHistory: referral.withdrawHistory,
  };

  return new ApiResponse(200, true, "Referral details retrieved", data).send(
    res
  );
});

const updateWithdrawal = asyncHandler(async (req, res) => {
  const { userId, withdrawalId } = req.params;
  const { status, trx } = req.body;

  if (!["completed", "rejected"].includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Must be 'completed' or 'rejected'"
    );
  }

  // Find referral record
  const referral = await Referral.findOne({ referrer: userId });
  if (!referral) {
    throw new ApiError(404, "Referral record not found");
  }

  // Find withdrawal entry
  const withdrawal = referral.withdrawHistory.id(withdrawalId);
  if (!withdrawal) {
    throw new ApiError(404, "Withdrawal request not found");
  }

  if (withdrawal.status !== "pending") {
    throw new ApiError(400, "This withdrawal has already been processed");
  }

  // Update withdrawal status
  withdrawal.status = status;
  if (status === "completed") {
    withdrawal.trx = trx || null; // save transaction ID if provided
    withdrawal.issuedAt = new Date();
  } else if (status === "rejected") {
    // Refund balance to user
    referral.availableBalance += withdrawal.amount;
    withdrawal.issuedAt = new Date();
  }

  await referral.save();

  return new ApiResponse(
    200,
    true,
    `Withdrawal ${status} successfully`,
    withdrawal
  ).send(res);
});

export {
  getAllUsers,
  getUserStats,
  getAdminDashboardStats,
  getPaymentsHistory,
  downloadPaymentsHistory,
  getAllReferrals,
  getReferralByUserId,
  updateWithdrawal,
};
