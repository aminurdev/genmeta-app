import mongoose from "mongoose";
import { PLAN_TYPES } from "../constants/index.js";

const appPricingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: [PLAN_TYPES.SUBSCRIPTION, PLAN_TYPES.CREDIT],
        message: "Plan type must be either 'subscription' or 'credit'",
      },
      required: [true, "Plan type is required"],
      index: true,
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Base price cannot be negative"],
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: [0, "Discount percentage cannot be negative"],
      max: [100, "Discount percentage cannot exceed 100"],
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    credit: {
      type: Number,
      validate: {
        validator: function (value) {
          if (this.type === PLAN_TYPES.CREDIT) {
            return typeof value === "number" && value >= 1;
          }
          return true;
        },
        message: "Credit must be at least 1 for 'credit' plan type",
      },
    },
    planDuration: {
      type: Number,
      validate: {
        validator: function (value) {
          if (this.type === PLAN_TYPES.SUBSCRIPTION || this.type === PLAN_TYPES.CREDIT) {
            return typeof value === "number" && value >= 1;
          }
          return true;
        },
        message: "Plan duration must be at least 1 day",
      },
    },
  },
  {
    timestamps: true,
  }
);

appPricingSchema.index({ isActive: 1, type: 1, basePrice: 1 });

export const AppPricing = mongoose.model("AppPricing", appPricingSchema);
export default AppPricing;
