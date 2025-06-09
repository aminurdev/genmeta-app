import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentID: {
      type: String,
      required: true,
      unique: true,
    },
    plan: {
      id: { type: String, required: true },
      type: { type: String, required: true },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    trxID: { type: String, required: true, unique: true },
    paymentDetails: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

export const AppPayment = mongoose.model("AppPayment", paymentSchema);
