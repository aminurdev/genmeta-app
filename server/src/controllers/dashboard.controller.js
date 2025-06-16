import { ApiKey } from "../models/appApiKey.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /overview
export const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id; // assuming auth middleware sets this

  const apiKey = await ApiKey.findOne({ userId });
  const user = await User.findById(userId);
  const payments = await AppPayment.find({ userId }).sort({ createdAt: -1 });

  if (!apiKey || !user) {
    return res.status(404).json({ message: "User or API Key not found" });
  }

  // Get today's date info
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Calculate total payment spent
  const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);

  // Get last 6 months keys
  const last6MonthKeys = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Create summary of last 6 months
  const last6MonthProcess = last6MonthKeys
    .map((key) => ({
      month: key,
      count: apiKey.monthlyProcess?.get(key) || 0,
    }))
    .reverse(); // oldest first

  // Credit status
  const creditRemaining =
    apiKey.plan?.type === "subscription" ? Infinity : apiKey.credit;
  const webCreditRemaining = user.token?.available || 0;

  return new ApiResponse(200, true, "Overview fetched successfully", {
    totalProcess: apiKey.totalProcess || 0,
    currentMonthProcess: apiKey.monthlyProcess?.get(currentMonthKey) || 0,
    creditRemaining,
    webCreditRemaining,
    totalPaymentSpent: totalSpent,
    last6MonthProcess,
    last5Payments: payments.slice(0, 5).map((p) => ({
      id: p._id,
      trxID: p.trxID,
      plan: p.plan,
      amount: p.amount,
      createdAt: p.createdAt,
    })),
  }).send(res);
});
