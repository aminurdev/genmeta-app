import { AppPricing } from "../models/appPricing.model.js";
import { PromoCode } from "../models/promocode.model.js";
import {
  logger,
  processSuccessfulPayment,
  redirectToPricing,
} from "../services/app/app.service.js";
import { createPayment } from "../services/bkash/bkash.service.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createAppPayment = asyncHandler(async (req, res) => {
  const { planId, promoCode } = req.body;
  const user = req.user;

  if (!planId) {
    throw new ApiError(400, "Plan ID is required");
  }

  const plan = await AppPricing.findById(planId);
  if (!plan || !plan.isActive) {
    throw new ApiError(404, "Plan not found or inactive");
  }

  let finalPrice = plan.basePrice;
  if (plan.discountPrice) {
    finalPrice = plan.discountPrice;
  } else if (plan.discountPercent > 0) {
    finalPrice = finalPrice * (1 - plan.discountPercent / 100);
  }

  let appliedPromoCode = null;
  if (promoCode) {
    const normalizedCode = promoCode.toUpperCase().trim();
    appliedPromoCode = await PromoCode.findOne({
      code: normalizedCode,
      isActive: true,
      $or: [{ appliesTo: plan.type }, { appliesTo: "both" }],
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (!appliedPromoCode) {
      throw new ApiError(400, "Invalid or expired promo code");
    }

    if (
      appliedPromoCode.usageLimit !== null &&
      appliedPromoCode.usedCount.length >= appliedPromoCode.usageLimit
    ) {
      throw new ApiError(400, "Promo code usage limit exceeded");
    }

    finalPrice = finalPrice * (1 - appliedPromoCode.discountPercent / 100);
  }

  finalPrice = Math.max(0.01, finalPrice);

  const paymentData = await createPayment({
    amount: finalPrice.toFixed(2),
    payerReference: appliedPromoCode
      ? `${user._id.toString()}-${plan._id.toString()}-${appliedPromoCode._id.toString()}`
      : `${user._id.toString()}-${plan._id.toString()}`,
    merchantInvoiceNumber: `${plan.name.replace(/\s+/g, "_")}-${Date.now()}`,
  });

  if (!paymentData?.paymentID || !paymentData?.bkashURL) {
    throw new ApiError(500, "Failed to create bKash payment");
  }

  return new ApiResponse(200, true, "Payment created successfully", {
    bkashURL: paymentData.bkashURL,
    paymentID: paymentData.paymentID,
    amount: finalPrice.toFixed(2),
    plan: {
      name: plan.name,
      type: plan.type,
      duration: plan.planDuration,
      credit: plan.credit,
    },
  }).send(res);
});

export const handleAppCallback = asyncHandler(async (req, res) => {
  const { paymentID, status } = req.query;

  if (!paymentID || !status) {
    logger.error("Missing required query parameters in bKash callback", { paymentID, status });
    return redirectToPricing(res, "Payment failed", "invalid_parameters");
  }

  if (status === "cancel") {
    logger.info("bKash payment cancelled by user", { paymentID });
    return redirectToPricing(res, "Payment was cancelled", "user_cancelled");
  }

  if (status === "failure") {
    logger.error("bKash payment failed", { paymentID });
    return redirectToPricing(res, "Payment failed", "payment_failed");
  }

  if (status === "success") {
    return await processSuccessfulPayment(paymentID, res);
  }

  logger.warn("Unknown bKash payment status", { paymentID, status });
  return redirectToPricing(res, "Payment failed", "unknown_status");
});
