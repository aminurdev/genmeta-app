import { AppPricing } from "../models/appPricing.model.js";
import { PromoCode } from "../models/promocode.model.js";
import { User } from "../models/user.model.js";
import {
  logger,
  processSuccessfulPaystationPayment,
  redirectToPricing,
} from "../services/app/app.service.js";
import { initiatePayment } from "../services/paystation/paystation.service.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createPaystationPayment = asyncHandler(async (req, res) => {
  const { planId, promoCode } = req.body;
  const user = req.user;

  if (!planId) {
    throw new ApiError(400, "Plan ID is required");
  }

  const userDetails = await User.findById(user._id).select("name email");
  if (!userDetails) {
    throw new ApiError(404, "User not found");
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

    if (appliedPromoCode.usedCount.includes(user._id.toString())) {
      throw new ApiError(400, "You have already used this promo code");
    }

    finalPrice = finalPrice * (1 - appliedPromoCode.discountPercent / 100);
  }

  finalPrice = Math.max(1, finalPrice);

  const invoiceNumber = `INV-${Date.now()}-${user._id.toString().slice(-6)}`;
  const paymentReference = appliedPromoCode
    ? `${user._id.toString()}-${plan._id.toString()}-${appliedPromoCode._id.toString()}`
    : `${user._id.toString()}-${plan._id.toString()}`;

  const checkoutItems = {
    planName: plan.name,
    planType: plan.type,
    planDuration: plan.planDuration || null,
    credit: plan.credit || null,
    promoCode: appliedPromoCode?.code || null,
  };

  const paymentData = await initiatePayment({
    invoiceNumber,
    amount: finalPrice,
    customerName: userDetails.name,
    customerPhone: "01700000000",
    customerEmail: userDetails.email,
    reference: paymentReference,
    checkoutItems,
  });

  if (!paymentData?.paymentUrl) {
    throw new ApiError(500, "Failed to initiate PayStation payment");
  }

  return new ApiResponse(200, true, "PayStation payment initiated successfully", {
    paymentUrl: paymentData.paymentUrl,
    invoiceNumber: paymentData.invoiceNumber,
    amount: finalPrice,
    plan: {
      name: plan.name,
      type: plan.type,
      duration: plan.planDuration,
      credit: plan.credit,
    },
  }).send(res);
});

export const handlePaystationCallback = asyncHandler(async (req, res) => {
  const { invoice_number, status } = req.query;

  if (!invoice_number) {
    logger.error("Missing invoice_number in PayStation callback", req.query);
    return redirectToPricing(res, "Payment failed", "invalid_parameters");
  }

  if (status && status.toLowerCase() === "failed") {
    logger.error("PayStation payment failed", { invoice_number });
    return redirectToPricing(res, "Payment failed", "payment_failed");
  }

  if (status && status.toLowerCase() === "canceled") {
    logger.info("PayStation payment canceled", { invoice_number });
    return redirectToPricing(res, "Payment was canceled", "user_canceled");
  }

  return await processSuccessfulPaystationPayment(invoice_number, res);
});
