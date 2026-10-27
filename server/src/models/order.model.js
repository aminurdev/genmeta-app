import mongoose from "mongoose";
import { ORDER_STATUS, PLAN_TYPES } from "../constants/index.js";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppPricing",
      required: [true, "Plan is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    planSnapshot: {
      name: { type: String, required: true },
      type: {
        type: String,
        enum: [PLAN_TYPES.SUBSCRIPTION, PLAN_TYPES.CREDIT],
        required: true,
      },
    },
    promoCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromoCode",
      index: true,
    },
    promoCodeUsed: {
      type: String,
      trim: true,
      uppercase: true,
    },
    referralCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      index: true,
    },
    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
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

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ planId: 1, status: 1 });

export const Order = mongoose.model("Order", orderSchema);
export default Order;
