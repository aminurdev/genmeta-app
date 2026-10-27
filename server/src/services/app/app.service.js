import mongoose from "mongoose";
import config from "../../config/index.js";
import ApiError from "../../utils/api.error.js";
import { executePayment } from "../bkash/bkash.service.js";
import { checkTransactionStatus } from "../paystation/paystation.service.js";
import { User } from "../../models/user.model.js";
import { AppPayment } from "../../models/appPayment.model.js";
import { AppKey } from "../../models/appKey.model.js";
import { AppPricing } from "../../models/appPricing.model.js";
import planService from "../plan.service.js";
import { PAYMENT_GATEWAYS } from "../../constants/index.js";

// Structured Logger
export const logger = {
  info: (message, data = {}) => console.log(`[INFO]: ${message}`, data),
  warn: (message, data = {}) => console.warn(`[WARN]: ${message}`, data),
  error: (message, data = {}) => console.error(`[ERROR]: ${message}`, data),
};

export const fetchAppUserData = async (username) => {
  try {
    if (!username) {
      throw new ApiError(400, "Username is required");
    }
    const appKey = await AppKey.findOne({ username }).select(
      "username key expiresAt isActive createdAt status"
    );
    return appKey;
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to fetch app user data"
    );
  }
};

export const redirectToPricing = (res, message, reason = "") => {
  let redirectURL = `${config.cors_origin}/pricing?message=${encodeURIComponent(message)}`;
  if (reason) {
    redirectURL += `&reason=${encodeURIComponent(reason)}`;
  }
  return res.redirect(redirectURL);
};

/**
 * Process Successful bKash Payment
 */
export const processSuccessfulPayment = async (paymentID, res) => {
  let paymentDetails;

  try {
    paymentDetails = await executePayment(paymentID);
  } catch (error) {
    logger.error("Payment execution failed", { paymentID, error: error.message });
    return redirectToPricing(res, "Payment execution failed", error.message || "execution_error");
  }

  if (!paymentDetails) {
    logger.error("Failed to retrieve payment details", { paymentID });
    return redirectToPricing(res, "Payment failed", "verification_failed");
  }

  const {
    trxID,
    transactionStatus,
    amount,
    payerReference,
    merchantInvoiceNumber,
  } = paymentDetails;
  const planName = merchantInvoiceNumber?.split("-")[0] || "plan";

  try {
    const parts = (payerReference || "").split("-");
    const userId = parts[0];
    const planId = parts[1];
    const promoCodeId = parts[2] || null;

    if (!userId || !planId) {
      logger.error("Invalid payerReference structure in bKash callback", { payerReference });
      return redirectToPricing(res, "Payment verification error", "invalid_reference");
    }

    const planDetails = await AppPricing.findById(planId);

    // Prevent duplicate processing
    let payment = await AppPayment.findOne({
      $or: [{ paymentID }, { trxID }],
    });

    if (payment) {
      logger.info("Payment already processed:", { paymentID, trxID });
      return res.redirect(
        `${config.cors_origin}/payment-status?status=success&amount=${amount}&plan=${planName}&trxID=${trxID}&planType=${planDetails?.type || "N/A"}&duration=${planDetails?.planDuration || "N/A"}${planDetails?.type === "credit" ? `&credit=${planDetails?.credit || 0}` : ""}`
      );
    }

    // Create payment record
    payment = await AppPayment.create({
      userId,
      paymentID,
      trxID,
      amount: parseFloat(amount),
      gateway: PAYMENT_GATEWAYS.BKASH,
      plan: {
        id: planId,
        name: planDetails?.name || planName,
        type: planDetails?.type || "unknown",
      },
      paymentDetails,
      status: transactionStatus,
    });

    if (transactionStatus === "Completed" || transactionStatus === "Successful") {
      // 1. Update user plan
      await planService.updateUserPlan(userId, planId);

      // 2. Distribute referral commission if applicable
      await planService.processReferralReward(userId, { paymentId: payment._id });

      // 3. Record promo code usage
      if (promoCodeId) {
        await planService.recordPromoCodeUsage(userId, promoCodeId, { paymentId: payment._id });
      }

      return res.redirect(
        `${config.cors_origin}/payment-status?status=success&amount=${amount}&plan=${planName}&trxID=${trxID}&planType=${planDetails?.type || "N/A"}&duration=${planDetails?.planDuration || "N/A"}${planDetails?.type === "credit" ? `&credit=${planDetails?.credit || 0}` : ""}`
      );
    } else {
      logger.warn("Payment status not completed", { paymentID, transactionStatus });
      return redirectToPricing(res, "Payment incomplete", "pending_completion");
    }
  } catch (error) {
    logger.error("Error processing successful bKash payment", { paymentID, error: error.message });
    return redirectToPricing(res, "Payment processing error", "processing_error");
  }
};

/**
 * Process Successful PayStation Payment
 */
export const processSuccessfulPaystationPayment = async (invoiceNumber, res) => {
  let transactionDetails;

  try {
    transactionDetails = await checkTransactionStatus(invoiceNumber);
  } catch (error) {
    logger.error("PayStation verification failed", { invoiceNumber, error: error.message });
    return redirectToPricing(res, "Payment verification failed", error.message || "verification_error");
  }

  if (!transactionDetails || !transactionDetails.data) {
    logger.error("Missing PayStation transaction data", { invoiceNumber });
    return redirectToPricing(res, "Payment failed", "verification_failed");
  }

  const {
    trxId,
    trxStatus,
    paymentAmount,
    reference,
    checkoutItems,
  } = transactionDetails.data;

  const isSuccess =
    trxStatus?.toLowerCase() === "success" ||
    trxStatus?.toLowerCase() === "successful";

  if (!isSuccess) {
    logger.warn("PayStation transaction unsuccessful", { invoiceNumber, trxStatus });
    return redirectToPricing(res, `Payment ${trxStatus || "failed"}`, "payment_not_completed");
  }

  try {
    const parts = (reference || "").split("-");
    const userId = parts[0];
    const planId = parts[1];
    const promoCodeId = parts[2] || null;

    const planDetails = await AppPricing.findById(planId);
    if (!planDetails) {
      logger.error("Plan not found for PayStation invoice", { planId, invoiceNumber });
      return redirectToPricing(res, "Payment failed", "plan_not_found");
    }

    // Check if duplicate
    const existingPayment = await AppPayment.findOne({
      $or: [{ paymentID: invoiceNumber }, { trxID: trxId }],
    });

    if (existingPayment) {
      return res.redirect(
        `${config.cors_origin}/payment-status?status=success&amount=${paymentAmount}&plan=${planDetails.name}&trxID=${trxId}&planType=${planDetails.type}&duration=${planDetails.planDuration || "N/A"}${planDetails.type === "credit" ? `&credit=${planDetails.credit || 0}` : ""}`
      );
    }

    const payment = await AppPayment.create({
      userId,
      paymentID: invoiceNumber,
      trxID: trxId,
      amount: parseFloat(paymentAmount),
      gateway: PAYMENT_GATEWAYS.PAYSTATION,
      plan: {
        id: planId,
        name: planDetails.name,
        type: planDetails.type,
      },
      paymentDetails: transactionDetails.data,
      status: "Completed",
    });

    // 1. Update plan
    await planService.updateUserPlan(userId, planId);

    // 2. Referral rewards
    await planService.processReferralReward(userId, { paymentId: payment._id });

    // 3. Promo code redemption
    if (promoCodeId) {
      await planService.recordPromoCodeUsage(userId, promoCodeId, { paymentId: payment._id });
    }

    return res.redirect(
      `${config.cors_origin}/payment-status?status=success&amount=${paymentAmount}&plan=${planDetails.name}&trxID=${trxId}&planType=${planDetails.type}&duration=${planDetails.planDuration || "N/A"}${planDetails.type === "credit" ? `&credit=${planDetails.credit || 0}` : ""}`
    );
  } catch (error) {
    logger.error("Error finalizing PayStation payment", { invoiceNumber, error: error.message });
    return redirectToPricing(res, "Payment processing error", "processing_error");
  }
};
