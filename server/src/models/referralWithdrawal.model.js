import mongoose from "mongoose";
import { WITHDRAWAL_STATUS } from "../constants/index.js";

const referralWithdrawalSchema = new mongoose.Schema(
  {
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Withdrawal amount must be at least 1"],
    },
    status: {
      type: String,
      enum: Object.values(WITHDRAWAL_STATUS),
      default: WITHDRAWAL_STATUS.PENDING,
      index: true,
    },
    withdrawAccount: {
      type: String,
      required: true,
      trim: true,
    },
    trx: {
      type: String,
      default: null,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    issuedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

referralWithdrawalSchema.index({ status: 1, requestedAt: -1 });
referralWithdrawalSchema.index({ userId: 1, requestedAt: -1 });

export const ReferralWithdrawal = mongoose.model(
  "ReferralWithdrawal",
  referralWithdrawalSchema
);
export default ReferralWithdrawal;
