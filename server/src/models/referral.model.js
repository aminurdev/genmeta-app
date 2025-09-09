import mongoose from "mongoose";
import { generateCode } from "../utils/index.js";

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    withdrawAccount: { type: String, default: null },
    referralCode: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    availableBalance: { type: Number, default: 0 },
    referredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    earnedHistory: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        term: {
          type: String,
          enum: ["1st", "2nd", "3rd"],
        },
        amount: {
          type: Number,
          default: 0,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    withdrawHistory: [
      {
        amount: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ["pending", "completed", "rejected"],
          default: "pending",
        },
        withdrawAccount: { type: String },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        trx: { type: String, default: null },
        issuedAt: {
          type: Date,
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

// 🔹 Method to generate referral code
referralSchema.methods.generateReferralCode = function () {
  const code = generateCode();
  this.referralCode = code;
  return this.referralCode;
};

export const Referral = mongoose.model("Referral", referralSchema);
