import mongoose from "mongoose";
import { WITHDRAWAL_STATUS } from "../constants/index.js";

const withdrawalItemSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: Object.values(WITHDRAWAL_STATUS),
    default: WITHDRAWAL_STATUS.PENDING,
  },
  withdrawAccount: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  trx: { type: String, default: null },
  issuedAt: { type: Date, default: null },
  requestedAt: { type: Date, default: Date.now },
});

const earningItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    withdrawAccount: {
      type: String,
      default: null,
      trim: true,
    },
    referralCode: {
      type: String,
      unique: true,
      index: true,
      required: true,
      uppercase: true,
      trim: true,
    },
    availableBalance: {
      type: Number,
      default: 0,
      min: [0, "Available balance cannot be negative"],
      index: true,
    },
    // Maintained for backward compatibility with frontend
    referredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Maintained for backward compatibility with frontend
    earnedHistory: [earningItemSchema],
    // Maintained for backward compatibility with frontend
    withdrawHistory: [withdrawalItemSchema],
  },
  {
    timestamps: true,
  }
);

referralSchema.index({ availableBalance: -1 });

export const Referral = mongoose.model("Referral", referralSchema);
export default Referral;
