import { Referral } from "../models/referral.model.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateCode } from "../utils/index.js";

const getReferralDetails = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  // Try to find referral
  let referral = await Referral.findOne({ referrer: userId })
    .populate({
      path: "referredUsers",
      select: "name email isVerified loginProvider",
    })
    .populate({
      path: "earnedHistory.user",
      select: "name email",
    });

  // If no referral, create one safely
  if (!referral) {
    referral = await Referral.findOneAndUpdate(
      { referrer: userId },
      { $setOnInsert: { referrer: userId, referralCode: generateCode() } },
      { upsert: true, new: true } // atomic upsert
    );
  }

  // ✅ Filter referred users: skip unverified email-only users
  const validReferredUsers = referral.referredUsers.filter(
    (u) =>
      u.isVerified ||
      (u.loginProvider &&
        u.loginProvider.length > 0 &&
        !u.loginProvider.includes("email"))
  );

  // Calculate totals
  const totalEarned = referral.earnedHistory.reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );

  const availableBalance = referral.availableBalance;

  const totalWithdrawn = referral.withdrawHistory
    .filter((w) => w.status === "completed")
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  return new ApiResponse(200, true, "Referral data retrieved", {
    referralCode: referral.referralCode,
    referralCount: validReferredUsers.length,
    withdrawAccount: referral.withdrawAccount,
    totalEarned,
    availableBalance,
    totalWithdrawn,
    earnedHistory: referral.earnedHistory,
    withdrawHistory: referral.withdrawHistory,
  }).send(res);
});

// 📌 Request withdrawal
const requestWithdrawal = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { amount, withdrawAccount } = req.body;

  const minimumWithdrawAmount = 100;

  // Validate withdraw account
  if (!withdrawAccount?.trim()) {
    throw new ApiError(400, "Withdrawal account is required");
  }

  // Validate amount
  if (!amount || amount <= 0) {
    throw new ApiError(400, "Withdrawal amount must be greater than 0");
  }

  if (amount < minimumWithdrawAmount) {
    throw new ApiError(
      400,
      `Minimum withdrawal amount is ${minimumWithdrawAmount}`
    );
  }

  // Find referral record
  const referral = await Referral.findOne({ referrer: userId });
  if (!referral) {
    throw new ApiError(404, "Referral record not found");
  }

  // Ensure account is stored/updated
  if (referral.withdrawAccount !== withdrawAccount) {
    referral.withdrawAccount = withdrawAccount.trim();
  }

  // Check balance
  if (referral.availableBalance < amount) {
    throw new ApiError(400, "Insufficient balance for withdrawal");
  }

  // Deduct balance and log request
  referral.availableBalance -= amount;
  const withdrawal = {
    amount,
    withdrawAccount: referral.withdrawAccount,
    status: "pending",
    requestedAt: new Date(),
  };
  referral.withdrawHistory.push(withdrawal);

  await referral.save();

  return new ApiResponse(
    200,
    true,
    "Withdrawal request submitted successfully",
    { withdrawal }
  ).send(res);
});

export { getReferralDetails, requestWithdrawal };
