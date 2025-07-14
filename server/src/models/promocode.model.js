import mongoose from "mongoose";

const { Schema } = mongoose;

const promoCodeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    isActive: { type: Boolean, default: true },
    appliesTo: {
      type: String,
      enum: ["subscription", "credit", "both"],
      default: "both",
    },
    usageLimit: { type: Number, default: null, min: 1 }, // null = unlimited
    usedCount: { type: [String], default: [] },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
  },
  { timestamps: true }
);

export const PromoCode = mongoose.model("PromoCode", promoCodeSchema);
