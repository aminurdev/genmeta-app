import { Referral } from "../models/referral.model.js";
import { ReferralWithdrawal } from "../models/referralWithdrawal.model.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateCode } from "../utils/index.js";
import { WITHDRAWAL_STATUS } from "../constants/index.js";

const COMMISSION_PER_REFERRAL = 50;
const MINIMUM_WITHDRAW_AMOUNT = 100;

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
      Boolean(u) &&
      (u.isVerified ||
        (Array.isArray(u.loginProvider) &&
          u.loginProvider.length > 0 &&
          !u.loginProvider.includes("email")))
  );

  const earnedHistory = [...(referral.earnedHistory || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((e) => ({
      _id: e._id ? String(e._id) : undefined,
      user: e.user
        ? {
            _id: String(e.user._id),
            name: e.user.name || "Unknown User",
            email: e.user.email || "",
          }
        : {
            _id: "",
            name: "Deleted User",
            email: "N/A",
          },
      amount: Number(e.amount) || 0,
      createdAt: e.createdAt,
    }));

  const earnedByUserId = new Map();
  for (const item of earnedHistory) {
    if (!item.user._id) continue;
    const prev = earnedByUserId.get(item.user._id);
    earnedByUserId.set(item.user._id, {
      amount: (prev?.amount || 0) + item.amount,
      earnedAt: prev?.earnedAt || item.createdAt,
    });
  }

  const referredUsers = [...validReferredUsers]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((u) => {
      const userIdStr = String(u._id);
      const earnedEntry = earnedByUserId.get(userIdStr);
      return {
        id: userIdStr,
        name: u.name || "Unknown User",
        email: u.email || "",
        joinedAt: u.createdAt,
        status: earnedEntry ? "subscribed" : "pending",
        earnedAmount: earnedEntry ? earnedEntry.amount : 0,
        earnedAt: earnedEntry ? earnedEntry.earnedAt : null,
      };
    });

  const withdrawHistory = [...(referral.withdrawHistory || [])]
    .sort(
      (a, b) =>
        new Date(b.requestedAt || b.createdAt || 0) -
        new Date(a.requestedAt || a.createdAt || 0)
    )
    .map((w) => ({
      _id: w._id ? String(w._id) : undefined,
      amount: Number(w.amount) || 0,
      status: w.status,
      withdrawAccount: w.withdrawAccount || null,
      trx: w.trx || null,
      requestedAt: w.requestedAt || w.createdAt,
      createdAt: w.createdAt || w.requestedAt,
      issuedAt: w.issuedAt || null,
    }));

  const now = new Date();
  const currentUtcYear = now.getUTCFullYear();
  const currentUtcMonth = now.getUTCMonth();

  const totalEarned = earnedHistory.reduce((sum, e) => sum + e.amount, 0);

  const thisMonthEarned = earnedHistory.reduce((sum, e) => {
    if (!e.createdAt) return sum;
    const d = new Date(e.createdAt);
    if (
      !Number.isNaN(d.getTime()) &&
      d.getUTCFullYear() === currentUtcYear &&
      d.getUTCMonth() === currentUtcMonth
    ) {
      return sum + e.amount;
    }
    return sum;
  }, 0);

  const availableBalance = Number(referral.availableBalance) || 0;

  const totalWithdrawn = withdrawHistory
    .filter((w) => w.status === WITHDRAWAL_STATUS.COMPLETED)
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingWithdrawalItems = withdrawHistory.filter(
    (w) => w.status === WITHDRAWAL_STATUS.PENDING
  );
  const pendingWithdrawalAmount = pendingWithdrawalItems.reduce(
    (sum, w) => sum + w.amount,
    0
  );
  const pendingWithdrawalCount = pendingWithdrawalItems.length;
  const convertedCount = earnedByUserId.size || earnedHistory.length;

  return new ApiResponse(200, true, "Referral data retrieved", {
    referralCode: referral.referralCode,
    withdrawAccount: referral.withdrawAccount || null,
    referralCount: validReferredUsers.length,
    convertedCount,
    totalEarned,
    thisMonthEarned,
    availableBalance,
    totalWithdrawn,
    pendingWithdrawalAmount,
    pendingWithdrawalCount,
    commissionPerReferral: COMMISSION_PER_REFERRAL,
    minimumWithdrawAmount: MINIMUM_WITHDRAW_AMOUNT,
    referredUsers,
    earnedHistory,
    withdrawHistory,
  }).send(res);
});

export const requestWithdrawal = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { amount, withdrawAccount } = req.body;

  if (!withdrawAccount?.trim()) {
    throw new ApiError(400, "Withdrawal account details are required");
  }

  const withdrawAmount = Number(amount);
  if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0) {
    throw new ApiError(400, "Withdrawal amount must be greater than 0");
  }

  if (withdrawAmount < MINIMUM_WITHDRAW_AMOUNT) {
    throw new ApiError(
      400,
      `Minimum withdrawal amount is ${MINIMUM_WITHDRAW_AMOUNT} BDT`
    );
  }

  const cleanAccount = withdrawAccount.trim();
  const now = new Date();

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
          requestedAt: now,
          createdAt: now,
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
    requestedAt: now,
  });

  return new ApiResponse(
    200,
    true,
    "Withdrawal request submitted successfully",
    {
      withdrawal: {
        id: String(withdrawalRecord._id),
        amount: withdrawAmount,
        status: WITHDRAWAL_STATUS.PENDING,
        withdrawAccount: cleanAccount,
        requestedAt: now,
        availableBalance: updatedReferral.availableBalance,
      },
    }
  ).send(res);
});
