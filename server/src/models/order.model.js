import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppPricing",
      required: [true, "Plan is required"],
    },
    // Store minimal plan snapshot for historical reference
    planSnapshot: {
      name: { type: String, required: true },
      type: { type: String, enum: ["subscription", "credit"], required: true },
    },
    promoCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromoCode",
    },
    referralCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
    },
    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // Store promo code for historical reference
    promoCodeUsed: {
      type: String,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ planId: 1 });

export const Order = mongoose.model("Order", orderSchema);
