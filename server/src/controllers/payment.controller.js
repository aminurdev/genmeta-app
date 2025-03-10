import config from "../config/index.js";
import { Payment } from "../models/payment.model.js";
import { PricingPlan } from "../models/pricing-plan.model.js";
import { UserActivity } from "../models/activity.model.js";
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

  const paymentDetails = await executePayment(paymentID);

  if (!paymentDetails) {
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

  const userActivity = await UserActivity.findOne({ userId: payment.userId });

  if (transactionStatus === "Completed") {
    await Payment.findByIdAndUpdate(payment._id, {
      status: "Completed",
      trxID,
      paymentExecuteTime,
      payerReference,
      customerMsisdn,
      payerAccount,
    });

    if (!userActivity) {
      await UserActivity.create({
        userId: payment.userId,
        plan: {
          planId: payment.planId,
          status: "Active",
          expiresDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        availableTokens: payment.tokensAdded,
        totalTokensPurchased: payment.tokensAdded,
        tokenHistory: [
          {
            actionType: "purchase",
            description: `Purchased ${payment.tokensAdded} tokens`,
            tokenDetails: { count: payment.tokensAdded, type: "added" },
          },
        ],
      });
    } else {
      if (!userActivity.plan) {
        userActivity.plan = {
          planId: payment.planId,
          status: "Active",
          expiresDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
      }

      userActivity.addTokens(
        payment.tokensAdded,
        `Purchased ${payment.tokensAdded} tokens`
      );
      await userActivity.save();
    }

    return res.redirect(
      `${config.cors_origin}/payment-status?status=success&amount=${amount}&tokens=${payment.tokensAdded}`
    );
  }

  if (status === "cancel") {
    await Payment.findByIdAndUpdate(payment._id, { status: "Cancelled" });

    return res.redirect(
      `${config.cors_origin}/payment-status?status=cancelled&message=Payment cancelled`
    );
  }

  if (status === "failure") {
    await Payment.findByIdAndUpdate(payment._id, { status: "Failed" });
    return res.redirect(
      `${config.cors_origin}/payment-status?status=failed&message=Payment failed`
    );
  }

  return res.redirect(
    `${config.cors_origin}/payment-status?status=unknown&message=Unknown status`
  );
});

export { createBkashPayment, handleBkashCallback };
