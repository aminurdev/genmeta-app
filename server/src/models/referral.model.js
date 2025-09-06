import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

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
        createdAt: {
          type: Date,
          default: Date.now,
        },
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
  const rawUuid = uuidv4();
  const code = rawUuid.replace(/-/g, "").substring(0, 6).toUpperCase();
  this.referralCode = code;
  return this.referralCode;
};

export const Referral = mongoose.model("Referral", referralSchema);
