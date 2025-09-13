import mongoose from "mongoose";

const { Schema } = mongoose;

const appPricing = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["subscription", "credit"], required: true },
    basePrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountPrice: { type: Number },
    isActive: { type: Boolean, default: true },
    credit: {
      type: Number,
      default: undefined,
      validate: {
        validator: function (value) {
          if (this.type === "credit") {
            return typeof value === "number" && value >= 1;
          }
          return true;
        },
        message: "Credit must be at least 1 if plan type is 'credit'",
      },
    },
    planDuration: {
      type: Number,
      default: undefined,
      validate: {
        validator: function (value) {
          if (this.type === "subscription") {
            return typeof value === "number" && value >= 1;
          }
          return true;
        },
        message:
          "planDuration must be at least 1 if plan type is 'subscription'",
      },
    },
  },
  { timestamps: true }
);

export const AppPricing = mongoose.model("AppPricing", appPricing);
