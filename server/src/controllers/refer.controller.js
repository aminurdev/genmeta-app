import { Referral } from "../models/referral.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getReferralDetails = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  // Get user with referred reference
  const user = await User.findById(userId).populate({
    path: "referred",
    populate: [
      {
        path: "referredUsers",
        select: "name email isVerified loginProvider",
      },
      { path: "earnedHistory.user", select: "name email" },
    ],
  });

  let referral = user?.referred;

  // If no referral exists, create one and link to user
  if (!referral) {
    referral = new Referral({ referrer: userId });
    referral.generateReferralCode();
    await referral.save();

    // Update user's referred field
    user.referred = referral._id;
    await user.save();
  }

  // ✅ Filter referred users: skip unverified email-only users
  const validReferredUsers = referral.referredUsers.filter(
    (u) =>
      u.isVerified ||
      (u.loginProvider &&
        u.loginProvider.length > 0 &&
        !u.loginProvider.includes("email"))
  );

  // Calculate total earned
  const totalEarned = referral.earnedHistory.reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );

  // Available balance
  const availableBalance = referral.availableBalance;

  // Total withdrawn
  const totalWithdrawn = referral.withdrawHistory
    .filter((w) => w.status === "completed")
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  return new ApiResponse(200, true, "Referral data retrieved", {
    referralCode: referral.referralCode,
    referralCount: validReferredUsers.length,
    totalEarned,
    availableBalance,
    totalWithdrawn,
    earnedHistory: referral.earnedHistory,
    withdrawHistory: referral.withdrawHistory,
  }).send(res);
});

export { getReferralDetails };
