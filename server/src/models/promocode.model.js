import mongoose from "mongoose";
import { PROMO_APPLIES_TO } from "../constants/index.js";

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Promo code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountPercent: {
      type: Number,
      required: [true, "Discount percentage is required"],
      min: [1, "Discount percentage must be at least 1%"],
      max: [100, "Discount percentage cannot exceed 100%"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    appliesTo: {
      type: String,
      enum: Object.values(PROMO_APPLIES_TO),
      default: PROMO_APPLIES_TO.BOTH,
      index: true,
    },
    usageLimit: {
      type: Number,
      default: null,
      min: [1, "Usage limit must be at least 1"],
    },
    // Array of user IDs kept for backward compatibility with frontend queries
    usedCount: {
      type: [String],
      default: [],
    },
    validFrom: {
      type: Date,
      required: [true, "Valid from date is required"],
      index: true,
    },
    validUntil: {
      type: Date,
      required: [true, "Valid until date is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

promoCodeSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

export const PromoCode = mongoose.model("PromoCode", promoCodeSchema);
export default PromoCode;
