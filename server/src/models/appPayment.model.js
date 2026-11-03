import mongoose from "mongoose";
import { PAYMENT_GATEWAYS } from "../constants/index.js";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    paymentID: {
      type: String,
      required: [true, "Payment ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    trxID: {
      type: String,
      required: [true, "Transaction ID (trxID) is required"],
      unique: true,
      trim: true,
      index: true,
    },
    gateway: {
      type: String,
      enum: Object.values(PAYMENT_GATEWAYS),
      default: PAYMENT_GATEWAYS.PAYSTATION,
      index: true,
    },
    plan: {
      id: { type: String, required: true },
      type: { type: String, required: true },
      name: { type: String, required: true },
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Payment amount cannot be negative"],
      index: true,
    },
    currency: {
      type: String,
      default: "BDT",
    },
    status: {
      type: String,
      default: "Completed",
      index: true,
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ createdAt: -1, status: 1 });
paymentSchema.index({ gateway: 1, createdAt: -1 });

export const AppPayment = mongoose.model("AppPayment", paymentSchema);
export default AppPayment;
