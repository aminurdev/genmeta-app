import config from "../config/index.js";
import { Payment } from "../models/payment.model.js";
import { PricingPlan } from "../models/pricing-plan.model.js";
import { UserActivity } from "../models/token.model.js";
import {
  createPayment,
  executePayment,
} from "../services/bkash/bkash.service.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createBkashPayment = asyncHandler(async (req, res) => {
  const { packageId } = req.body;

  if (!packageId) {
    throw new ApiError(400, "Missing required field packageId");
  }

  const pricingPlan = await PricingPlan.findById(packageId);
  if (!pricingPlan) {
    throw new ApiError(400, "Invalid packageId");
  }

  const paymentData = await createPayment({
    amount: pricingPlan.price,
    payerReference: pricingPlan._id.toString(),
    merchantInvoiceNumber: `${pricingPlan.title}-${Date.now()}`,
  });

  if (!paymentData?.paymentID || !paymentData?.bkashURL) {
    throw new ApiError(500, "Failed to create bKash payment");
  }

  // Save payment with pending status
  await Payment.create({
    userId: req.user._id,
    planId: pricingPlan._id,
    paymentID: paymentData.paymentID,
    status: "Pending",
    amount: pricingPlan.price,
    currency: "BDT",
    tokensAdded: pricingPlan.tokens,
    invoiceNumber: paymentData.merchantInvoiceNumber,
    payerReference: req.user._id.toString(),
    paymentCreateTime: paymentData.paymentCreateTime,
  });

  return new ApiResponse(200, true, "Payment Created Successfully", {
    bkashURL: paymentData.bkashURL,
  }).send(res);
});

const handleBkashCallback = asyncHandler(async (req, res) => {
  const { paymentID, status } = req.query;

  if (!paymentID || !status) {
    return res.redirect(
      `${config.cors_origin}/payment-status?status=error&message=Invalid callback data`
    );
  }

  // Execute payment to confirm details
  const paymentDetails = await executePayment(paymentID);

  if (!paymentDetails || paymentDetails.statusCode !== "0000") {
    await Payment.findOneAndUpdate({ paymentID }, { status: "Failed" });

    return res.redirect(
      `${config.cors_origin}/payment-status?status=failed&message=Payment verification failed`
    );
  }

  const {
    trxID,
    transactionStatus,
    amount,
    paymentExecuteTime,
    payerReference,
    customerMsisdn,
    payerAccount,
  } = paymentDetails;

  const payment = await Payment.findOne({ paymentID });

  if (!payment) {
    return res.redirect(
      `${config.cors_origin}/payment-status?status=error&message=Payment not found`
    );
  }

  if (transactionStatus === "Completed") {
    // Update payment status and user tokens
    await Payment.findByIdAndUpdate(payment._id, {
      status: "Completed",
      trxID,
      paymentExecuteTime,
      payerReference,
      customerMsisdn,
      payerAccount,
    });

    await UserActivity.findOneAndUpdate(
      { userId: payment.userId },
      { planId: payment.planId },
      {
        $inc: {
          availableTokens: payment.tokensAdded,
          totalTokensPurchased: payment.tokensAdded,
        },
        $push: {
          tokenHistory: {
            actionType: "purchase",
            description: `Purchased ${payment.tokensAdded} tokens`,
            tokenDetails: {
              count: payment.tokensAdded,
              type: "added",
            },
          },
        },
      },
      { upsert: true }
    );

    return res.redirect(
      `${config.cors_origin}/payment-status?status=success&amount=${amount}&tokens=${payment.tokensAdded}`
    );
  }

  if (transactionStatus === "Failed") {
    await Payment.findByIdAndUpdate(payment._id, { status: "Failed" });

    return res.redirect(
      `${config.cors_origin}/payment-status?status=failed&message=Payment failed`
    );
  }

  if (transactionStatus === "Cancelled") {
    await Payment.findByIdAndUpdate(payment._id, { status: "Cancelled" });

    return res.redirect(
      `${config.cors_origin}/payment-status?status=cancelled&message=Payment cancelled`
    );
  }

  return res.redirect(
    `${config.cors_origin}/payment-status?status=unknown&message=Unknown status`
  );
});

export { createBkashPayment, handleBkashCallback };
