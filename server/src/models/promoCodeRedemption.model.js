import mongoose from "mongoose";

const promoCodeRedemptionSchema = new mongoose.Schema(
  {
    promoCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromoCode",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppPayment",
    },
    discountPercent: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate redemptions per user per promo code
promoCodeRedemptionSchema.index({ promoCodeId: 1, userId: 1 }, { unique: true });
promoCodeRedemptionSchema.index({ userId: 1, createdAt: -1 });

export const PromoCodeRedemption = mongoose.model(
  "PromoCodeRedemption",
  promoCodeRedemptionSchema
);
export default PromoCodeRedemption;
