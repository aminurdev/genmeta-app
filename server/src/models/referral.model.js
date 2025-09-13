import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
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
          enum: ["1st", "2nd", "all"],
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

export const Referral = mongoose.model("Referral", referralSchema);
