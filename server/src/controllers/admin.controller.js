import { ApiKey } from "../models/appApiKey.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
  const totalApiKeys = await ApiKey.countDocuments();
  const activeApiKeys = await ApiKey.countDocuments({
    isActive: true,
    status: "active",
  });
  const activePremiumKeys = await ApiKey.countDocuments({
    isActive: true,
    status: "active",
    "plan.type": { $ne: "free" },
    expiresAt: { $gt: now },
  });
  const newApiKeysThisMonth = await ApiKey.countDocuments({
    createdAt: { $gte: thisMonth },
  });

  const apiKeys = await ApiKey.find({});
  const monthlyProcessList = {};
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyProcessList[monthKey] = 0;
  }

  apiKeys.forEach((apiKey) => {
    if (!apiKey.monthlyProcess) return;
    for (const [month, count] of apiKey.monthlyProcess.entries()) {
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

  // === 4. MONTHLY REVENUE LIST (last 6 months) ===
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

  // === 5. RECENT 5 PAYMENTS ===
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
      apiKeys: {
        total: totalApiKeys,
        newThisMonth: newApiKeysThisMonth,
        active: activeApiKeys,
        activePremium: activePremiumKeys,
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

export { getAdminDashboardStats };
