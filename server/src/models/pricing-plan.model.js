import mongoose from "mongoose";

const pricingPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    tokens: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    popular: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const PricingPlan = mongoose.model("PricingPlan", pricingPlanSchema);
