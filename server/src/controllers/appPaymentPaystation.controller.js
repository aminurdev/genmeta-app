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

/**
 * Create PayStation Payment
 * Initiates a payment with PayStation gateway
 */
export const createPaystationPayment = asyncHandler(async (req, res) => {
  const { planId, promoCode } = req.body;
  const user = req.user;

  // Validate input
  if (!planId) {
    throw new ApiError(400, "Plan ID is required");
  }

  // Fetch user details
  const userDetails = await User.findById(user._id).select("name email");
  if (!userDetails) {
    throw new ApiError(404, "User not found");
  }

  // Fetch plan details
  const plan = await AppPricing.findById(planId);
  if (!plan || !plan.isActive) {
    throw new ApiError(404, "Plan not found or inactive");
  }

  // Calculate base price with built-in discount
  let finalPrice = plan.basePrice;
  if (plan?.discountPrice) {
    finalPrice = plan.discountPrice;
  } else if (plan.discountPercent > 0) {
    finalPrice = finalPrice * (1 - plan.discountPercent / 100);
  }

  // Apply promo code if valid
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

    // Check usage limit
    if (
      appliedPromoCode.usageLimit !== null &&
      appliedPromoCode.usedCount.length >= appliedPromoCode.usageLimit
    ) {
      throw new ApiError(400, "Promo code usage limit exceeded");
    }

    // Check if user already used this promo code
    if (appliedPromoCode.usedCount.includes(user._id.toString())) {
      throw new ApiError(400, "You have already used this promo code");
    }

    // Apply promo discount
    finalPrice = finalPrice * (1 - appliedPromoCode.discountPercent / 100);
  }

  // Ensure minimum price
  finalPrice = Math.max(1, finalPrice);

  // Generate unique invoice number
  const invoiceNumber = `INV-${Date.now()}-${user._id.toString().slice(-6)}`;

  // Prepare payment reference data
  const paymentReference = appliedPromoCode
    ? `${user._id.toString()}-${plan._id.toString()}-${appliedPromoCode._id.toString()}`
    : `${user._id.toString()}-${plan._id.toString()}`;

  // Prepare checkout items
  const checkoutItems = {
    planName: plan.name,
    planType: plan.type,
    planDuration: plan.planDuration || null,
    credit: plan.credit || null,
    promoCode: appliedPromoCode?.code || null,
  };

  try {
    // Initiate payment with PayStation
    const paymentData = await initiatePayment({
      invoiceNumber,
      amount: Math.round(finalPrice), // PayStation expects integer amount
      customerName: userDetails.name,
      customerPhone: user.phone || "N/A",
      customerEmail: userDetails.email,
      customerAddress: user.address || "N/A",
      reference: paymentReference,
      checkoutItems: JSON.stringify(checkoutItems),
      optA: JSON.stringify({ userId: user._id.toString() }),
      optB: JSON.stringify({ planId: plan._id.toString() }),
      optC: appliedPromoCode ? JSON.stringify({ promoCodeId: appliedPromoCode._id.toString() }) : "",
    });

    if (!paymentData?.paymentUrl || !paymentData?.invoiceNumber) {
      throw new ApiError(500, "Failed to create PayStation payment");
    }

    logger.info("PayStation payment created successfully", {
      userId: user._id.toString(),
      invoiceNumber: paymentData.invoiceNumber,
      amount: finalPrice,
      planName: plan.name,
    });

    // Send response
    return new ApiResponse(200, true, "Payment created successfully", {
      paymentUrl: paymentData.paymentUrl,
      invoiceNumber: paymentData.invoiceNumber,
      amount: finalPrice.toFixed(2),
      plan: {
        name: plan.name,
        type: plan.type,
        duration: plan.planDuration,
        credit: plan.credit,
      },
      promoCode: appliedPromoCode?.code || null,
    }).send(res);
  } catch (error) {
    logger.error("PayStation payment creation failed", {
      userId: user._id.toString(),
      error: error.message,
      stack: error.stack,
    });

    // Re-throw ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, error.message || "Failed to create PayStation payment");
  }
});

/**
 * Handle PayStation Callback
 * Processes payment notification from PayStation
 */
export const handlePaystationCallback = asyncHandler(async (req, res) => {
  const { status, invoice_number, trx_id } = req.query;

  if (!status || !invoice_number) {
    logger.error("Missing required callback parameters", {
      status,
      invoice_number,
      trx_id,
    });
    return redirectToPricing(res, "Payment failed", "invalid_callback_parameters");
  }

  logger.info("PayStation callback received", {
    status,
    invoice_number,
    trx_id: trx_id || "N/A",
  });

  try {
    switch (status.toLowerCase()) {
      case "successful":
        return await processSuccessfulPaystationPayment(invoice_number, res);

      case "canceled":
      case "cancelled":
        logger.info("Payment cancelled by user", { invoice_number });
        return redirectToPricing(res, "Payment cancelled", "user_cancelled");

      case "failed":
      default:
        logger.error("Payment failed or unknown status", {
          invoice_number,
          status,
          trx_id,
        });
        return redirectToPricing(res, "Payment failed", "payment_rejected");
    }
  } catch (error) {
    logger.error("PayStation callback processing error", {
      invoice_number,
      error: error.message,
      stack: error.stack,
    });
    return redirectToPricing(
      res,
      "Payment processing failed",
      error.message || "server_error"
    );
  }
});
