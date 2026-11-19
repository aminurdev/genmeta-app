import { Referral } from "../models/referral.model.js";
import { ReferralWithdrawal } from "../models/referralWithdrawal.model.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateCode } from "../utils/index.js";
import { WITHDRAWAL_STATUS } from "../constants/index.js";

export const getReferralDetails = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  let referral = await Referral.findOne({ referrer: userId })
    .populate({
      path: "referredUsers",
      select: "name email isVerified loginProvider createdAt",
    })
    .populate({
      path: "earnedHistory.user",
      select: "name email",
    });

  if (!referral) {
    referral = await Referral.findOneAndUpdate(
      { referrer: userId },
      { $setOnInsert: { referrer: userId, referralCode: generateCode(6, 0.7) } },
      { upsert: true, new: true }
    );
  }

  const validReferredUsers = (referral.referredUsers || []).filter(
    (u) =>
      u.isVerified ||
      (u.loginProvider &&
        u.loginProvider.length > 0 &&
        !u.loginProvider.includes("email"))
  );

  const totalEarned = (referral.earnedHistory || []).reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );

  const availableBalance = referral.availableBalance || 0;

  const totalWithdrawn = (referral.withdrawHistory || [])
    .filter((w) => w.status === WITHDRAWAL_STATUS.COMPLETED)
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  return new ApiResponse(200, true, "Referral data retrieved", {
    referralCode: referral.referralCode,
    referralCount: validReferredUsers.length,
    withdrawAccount: referral.withdrawAccount,
    totalEarned,
    availableBalance,
    totalWithdrawn,
    earnedHistory: referral.earnedHistory || [],
    withdrawHistory: referral.withdrawHistory || [],
  }).send(res);
});

export const requestWithdrawal = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { amount, withdrawAccount } = req.body;

  const minimumWithdrawAmount = 100;

  if (!withdrawAccount?.trim()) {
    throw new ApiError(400, "Withdrawal account details are required");
  }

  const withdrawAmount = Number(amount);
  if (!withdrawAmount || withdrawAmount <= 0) {
    throw new ApiError(400, "Withdrawal amount must be greater than 0");
  }

  if (withdrawAmount < minimumWithdrawAmount) {
    throw new ApiError(
      400,
      `Minimum withdrawal amount is ${minimumWithdrawAmount} BDT`
    );
  }

  const cleanAccount = withdrawAccount.trim();

  // ATOMIC balance deduction: guarantees no concurrent double-spend!
  const updatedReferral = await Referral.findOneAndUpdate(
    {
      referrer: userId,
      availableBalance: { $gte: withdrawAmount },
    },
    {
      $inc: { availableBalance: -withdrawAmount },
      $set: { withdrawAccount: cleanAccount },
      $push: {
        withdrawHistory: {
          amount: withdrawAmount,
          withdrawAccount: cleanAccount,
          status: WITHDRAWAL_STATUS.PENDING,
          requestedAt: new Date(),
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!updatedReferral) {
    // Determine whether record exists or balance was insufficient
    const existing = await Referral.findOne({ referrer: userId });
    if (!existing) {
      throw new ApiError(404, "Referral record not found");
    }
    throw new ApiError(400, "Insufficient referral balance for withdrawal");
  }

  // Create record in normalized ledger
  const withdrawalRecord = await ReferralWithdrawal.create({
    referralId: updatedReferral._id,
    userId,
    amount: withdrawAmount,
    status: WITHDRAWAL_STATUS.PENDING,
    withdrawAccount: cleanAccount,
    requestedAt: new Date(),
  });

  return new ApiResponse(
    200,
    true,
    "Withdrawal request submitted successfully",
    {
      withdrawal: {
        id: withdrawalRecord._id,
        amount: withdrawAmount,
        status: WITHDRAWAL_STATUS.PENDING,
        withdrawAccount: cleanAccount,
        availableBalance: updatedReferral.availableBalance,
      },
    }
  ).send(res);
});
