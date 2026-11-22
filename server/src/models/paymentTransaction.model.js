import mongoose from "mongoose";
import { PAYMENT_GATEWAYS, PAYMENT_STATUS } from "../constants/index.js";

const paymentEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentTransactionSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    gateway: {
      type: String,
      enum: Object.values(PAYMENT_GATEWAYS),
      default: PAYMENT_GATEWAYS.PAYSTATION,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.INITIATED,
      index: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      default: null,
    },
    // Set only while an intent is active (initiated/pending) so terminal attempts can be retried cleanly
    activeIdempotencyKey: {
      type: String,
      trim: true,
    },
    plan: {
      id: { type: String, required: true, trim: true },
      name: { type: String, required: true, trim: true },
      type: { type: String, required: true, trim: true },
      planDuration: { type: Number, default: null },
      credit: { type: Number, default: null },
    },
    promoCode: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PromoCode",
        default: null,
      },
      code: { type: String, trim: true, default: null },
      discountPercent: { type: Number, default: 0 },
    },
    pricing: {
      basePrice: { type: Number, required: true, min: 0 },
      priceAfterPlanDiscount: { type: Number, required: true, min: 0 },
      planDiscountAmount: { type: Number, default: 0, min: 0 },
      promoDiscountAmount: { type: Number, default: 0, min: 0 },
      expectedAmount: { type: Number, required: true, min: 1 },
      paidAmount: { type: Number, default: null },
      currency: { type: String, default: "BDT" },
      payWithCharge: { type: Number, enum: [0, 1], default: 0 },
    },
    customer: {
      name: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
    },
    paymentUrl: {
      type: String,
      trim: true,
      default: null,
    },
    // Left undefined until gateway assigns a trxId so partial unique index ignores unset docs
    trxId: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: null,
    },
    payerMobileNo: {
      type: String,
      trim: true,
      default: null,
    },
    gatewayStatus: {
      type: String,
      trim: true,
      default: null,
    },
    gatewayInitMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    appPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppPayment",
      default: null,
    },
    fulfillmentSteps: {
      paymentRecorded: { type: Boolean, default: false },
      planUpdated: { type: Boolean, default: false },
      referralProcessed: { type: Boolean, default: false },
      promoRecorded: { type: Boolean, default: false },
      emailSent: { type: Boolean, default: false },
    },
    processingStartedAt: {
      type: Date,
      default: null,
    },
    callbackReceivedAt: {
      type: Date,
      default: null,
    },
    ipnReceivedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    failureReason: {
      type: String,
      trim: true,
      default: null,
    },
    events: {
      type: [paymentEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

paymentTransactionSchema.index(
  { trxId: 1 },
  {
    unique: true,
    partialFilterExpression: { trxId: { $type: "string" } },
  }
);
paymentTransactionSchema.index(
  { userId: 1, activeIdempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { activeIdempotencyKey: { $type: "string" } },
  }
);
paymentTransactionSchema.index({ userId: 1, createdAt: -1 });
paymentTransactionSchema.index({ status: 1, expiresAt: 1 });
paymentTransactionSchema.index({ status: 1, createdAt: -1 });

export const PaymentTransaction = mongoose.model(
  "PaymentTransaction",
  paymentTransactionSchema
);
export default PaymentTransaction;
