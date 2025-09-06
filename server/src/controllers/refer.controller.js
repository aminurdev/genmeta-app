import { Referral } from "../models/referral.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getReferralDetails = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  let referral = await Referral.findOne({ referrer: userId })
    .populate("referredUsers", "name email")
    .populate("earnedHistory.user", "name email");

  // 🔹 If no referral record exists → create one
  if (!referral) {
    referral = new Referral({ referrer: userId });
    referral.generateReferralCode();
    await referral.save();
  }

  // 🔹 Calculate total earned
  const totalEarned = referral.earnedHistory.reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );

  // 🔹 Available balance
  const availableBalance = referral.availableBalance;

  // 🔹 Total withdrawn
  const totalWithdrawn = referral.withdrawHistory
    .filter((w) => w.status === "completed")
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  return new ApiResponse(200, true, "Referral data retrieved", {
    referralCode: referral.referralCode,
    referralCount: referral.referredUsers.length,
    totalEarned,
    availableBalance,
    totalWithdrawn,
    earnedHistory: referral.earnedHistory,
    withdrawHistory: referral.withdrawHistory,
  }).send(res);
});

export { getReferralDetails };
