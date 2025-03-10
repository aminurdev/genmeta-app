import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PricingPlan",
      required: [true, "Plan ID is required"],
    },
    paymentID: {
      type: String,
      required: [true, "bKash payment ID is required"],
      unique: true,
    },
    trxID: {
      type: String,
      validate: {
        validator: function (value) {
          return this.status === "Completed" ? !!value : true;
        },
        message: "Transaction ID is required when status is 'Completed'",
      },
    },
    status: {
      type: String,
      required: [true, "Payment status is required"],
      enum: {
        values: ["Completed", "Failed", "Cancelled", "Initiated", "Pending"],
        message: "Status must be a valid payment status",
      },
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Payment amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "BDT",
    },
    tokensAdded: {
      type: Number,
      required: [true, "Number of tokens added is required"],
      min: [1, "Tokens added must be at least 1"],
    },
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
    },
    payerReference: String,
    customerMsisdn: String,
    payerAccount: String,
    intent: {
      type: String,
      default: "sale",
    },
    merchantInvoice: String,
    signature: String,
    apiVersion: String,
    paymentCreateTime: String,
    paymentExecuteTime: String,
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
