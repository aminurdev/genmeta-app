import mongoose from "mongoose";

const referralEarningSchema = new mongoose.Schema(
  {
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      required: true,
      index: true,
    },
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppPayment",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate commissions for the same referred user
referralEarningSchema.index({ referralId: 1, referredUserId: 1 }, { unique: true });
referralEarningSchema.index({ referrerId: 1, createdAt: -1 });

export const ReferralEarning = mongoose.model("ReferralEarning", referralEarningSchema);
export default ReferralEarning;
