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

  // Helper to format month key
  const formatMonthKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  // Initialize 6-month keys for aggregation
  const monthlyKeys = {};
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyKeys[formatMonthKey(date)] = 0;
  }

  const currentMonthKey = formatMonthKey(thisMonth);

  // === AGGREGATED QUERIES (Single database round trip) ===
  const [paymentStats, appKeyStats, userStats, referralTop] = await Promise.all(
    [
      // 1. PAYMENT AGGREGATION
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
                      $cond: [
                        { $gte: ["$createdAt", thisMonth] },
                        "$amount",
                        0,
                      ],
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
                  _id: {
                    $dateToString: { format: "%Y-%m", date: "$createdAt" },
                  },
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
                  userId: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: "$user",
                          as: "u",
                          in: {
                            _id: "$$u._id",
                            name: "$$u.name",
                            email: "$$u.email",
                          },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            ],
            count: [{ $count: "total" }],
            monthlyNewPayments: [
              { $match: { createdAt: { $gte: thisMonth } } },
              { $count: "total" },
            ],
            topSpenders: [
              {
                $group: {
                  _id: "$userId",
                  totalSpent: { $sum: "$amount" },
                },
              },
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
                  totalSpent: 1,
                  user: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: "$user",
                          as: "u",
                          in: {
                            _id: "$$u._id",
                            name: "$$u.name",
                            email: "$$u.email",
                          },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            ],
          },
        },
      ]),

      // 2. APP KEY AGGREGATION
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
                  newThisMonth: {
                    $sum: {
                      $cond: [{ $gte: ["$createdAt", thisMonth] }, 1, 0],
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
                  subscriptionPlan: {
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
                  creditPlan: {
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
            monthlyProcess: [
              {
                $match: { monthlyProcess: { $exists: true } },
              },
              {
                $addFields: {
                  monthlyProcessArray: {
                    $objectToArray: "$monthlyProcess",
                  },
                },
              },
              {
                $unwind: "$monthlyProcessArray",
              },
              {
                $group: {
                  _id: "$monthlyProcessArray.k",
                  count: { $sum: "$monthlyProcessArray.v" },
                },
              },
            ],
            topUsage: [
              { $match: { monthlyProcess: { $exists: true } } },
              {
                $addFields: {
                  monthlyProcessArray: { $objectToArray: "$monthlyProcess" },
                },
              },
              { $unwind: "$monthlyProcessArray" },
              { $match: { "monthlyProcessArray.k": currentMonthKey } },
              {
                $group: {
                  _id: "$userId",
                  count: { $sum: "$monthlyProcessArray.v" },
                },
              },
              { $sort: { count: -1 } },
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
                  count: 1,
                  user: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: "$user",
                          as: "u",
                          in: {
                            _id: "$$u._id",
                            name: "$$u.name",
                            email: "$$u.email",
                          },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            ],
          },
        },
      ]),

      // 3. USER AGGREGATION
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            newThisMonth: {
              $sum: {
                $cond: [{ $gte: ["$createdAt", thisMonth] }, 1, 0],
              },
            },
          },
        },
      ]),

      Referral.aggregate([
        {
          $project: { referrer: 1, referredCount: { $size: "$referredUsers" } },
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
            referredCount: 1,
            user: {
              $arrayElemAt: [
                {
                  $map: {
                    input: "$user",
                    as: "u",
                    in: {
                      _id: "$$u._id",
                      name: "$$u.name",
                      email: "$$u.email",
                    },
                  },
                },
                0,
              ],
            },
          },
        },
      ]),
    ]
  );

  // Extract and format results
  const revenueData = paymentStats[0].revenue[0] || {
    total: 0,
    currentMonth: 0,
    lastMonth: 0,
  };

  const revenueGrowth =
    revenueData.lastMonth === 0
      ? null
      : ((revenueData.currentMonth - revenueData.lastMonth) /
          revenueData.lastMonth) *
        100;

  // Format monthly revenue
  const monthlyRevenueList = { ...monthlyKeys };
  paymentStats[0].monthlyRevenue.forEach((item) => {
    if (item._id in monthlyRevenueList) {
      monthlyRevenueList[item._id] = item.amount;
    }
  });

  // Format monthly process list
  const monthlyProcessList = { ...monthlyKeys };
  appKeyStats[0].monthlyProcess.forEach((item) => {
    if (item._id in monthlyProcessList) {
      monthlyProcessList[item._id] = item.count;
    }
  });

  const appKeyCounts = appKeyStats[0].counts[0] || {
    total: 0,
    active: 0,
    newThisMonth: 0,
    activePremium: 0,
    subscriptionPlan: 0,
    creditPlan: 0,
  };

  const userCounts = userStats[0] || {
    total: 0,
    newThisMonth: 0,
  };

  // === RESPONSE ===
  return new ApiResponse(
    200,
    true,
    "Admin dashboard statistics retrieved successfully",
    {
      revenue: {
        total: revenueData.total,
        currentMonth: revenueData.currentMonth,
        lastMonth: revenueData.lastMonth,
        growthPercentage: revenueGrowth,
        monthlyRevenueList,
      },
      appKeys: {
        total: appKeyCounts.total,
        newThisMonth: appKeyCounts.newThisMonth,
        active: appKeyCounts.active,
        activePremium: appKeyCounts.activePremium,
        subscriptionPlanCount: appKeyCounts.subscriptionPlan,
        creditPlanCount: appKeyCounts.creditPlan,
        monthlyProcessList,
        topUsage: appKeyStats[0].topUsage || [],
      },
      users: {
        total: userCounts.total,
        newThisMonth: userCounts.newThisMonth,
      },
      payments: {
        total: paymentStats[0].count[0]?.total || 0,
        newThisMonth: paymentStats[0].monthlyNewPayments[0]?.total || 0,
        recent: paymentStats[0].recent,
        topSpenders: paymentStats[0].topSpenders || [],
      },
      topReferrers: referralTop || [],
    }
  ).send(res);
});

const getAllUsersOld = asyncHandler(async (req, res) => {
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

const getUserStatsOld = asyncHandler(async (req, res) => {
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

const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const query = {
    $or: [
      { username: { $regex: search, $options: "i" } },
      { key: { $regex: search, $options: "i" } },
    ],
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [appKeysRaw, total] = await Promise.all([
    AppKey.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    AppKey.countDocuments(query),
  ]);

  // Enrich each appKey with plan.name (if plan.id exists)
  const appKeys = await Promise.all(
    appKeysRaw.map(async (appKey) => {
      const enrichedPlan = { ...appKey.plan };
      if (appKey.plan?.id) {
        const plan = await AppPricing.findById(appKey.plan.id).select("name");
        enrichedPlan.name = plan?.name || null;
      }
      return {
        ...appKey.toObject(),
        plan: enrichedPlan,
      };
    })
  );

  return new ApiResponse(200, true, "API keys retrieved successfully", {
    users: appKeys,
    total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

const getUserStats = asyncHandler(async (req, res) => {
  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Single aggregation with $facet - all stats in one query
  const stats = await AppKey.aggregate([
    {
      $facet: {
        counts: [
          {
            $group: {
              _id: null,
              totalKeys: { $sum: 1 },
              activeKeys: {
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
              suspendedKeys: {
                $sum: {
                  $cond: [{ $eq: ["$status", "suspended"] }, 1, 0],
                },
              },
              totalProcesses: { $sum: "$totalProcess" },
              avgProcessesPerKey: { $avg: "$totalProcess" },
            },
          },
        ],
        keysByPlan: [
          {
            $group: {
              _id: "$plan.type",
              count: { $sum: 1 },
            },
          },
        ],
        dailyNewKeys: [
          {
            $match: {
              createdAt: { $gte: sevenDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: -1 } },
        ],
      },
    },
  ]);

  const countData = stats[0].counts[0] || {
    totalKeys: 0,
    activeKeys: 0,
    suspendedKeys: 0,
    totalProcesses: 0,
    avgProcessesPerKey: 0,
  };

  const keysByPlanArray = stats[0].keysByPlan || [];
  const dailyNewKeysArray = stats[0].dailyNewKeys || [];

  return new ApiResponse(200, true, "Statistics retrieved successfully", {
    totalUsers: countData.totalKeys,
    activeUsers: countData.activeKeys,
    suspendedUsers: countData.suspendedKeys,
    usersByPlan: keysByPlanArray.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {}),
    totalProcesses: countData.totalProcesses,
    avgProcessesPerUser: Math.round(countData.avgProcessesPerKey * 100) / 100,
    dailyNewUsers: dailyNewKeysArray.map(({ _id, count }) => ({
      date: _id,
      count,
    })),
  }).send(res);
});

export {
  getAllUsers,
  getUserStats,
  getAllUsersOld,
  getUserStatsOld,
  getAdminDashboardStats,
  getPaymentsHistory,
  downloadPaymentsHistory,
  getAllReferrals,
  getReferralByUserId,
  updateWithdrawal,
};
