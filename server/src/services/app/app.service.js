import config from "../../config/index.js";
import ApiError from "../../utils/api.error.js";
import { executePayment } from "../bkash/bkash.service.js";
import { User } from "../../models/user.model.js";
import { AppPayment } from "../../models/appPayment.model.js";
import { ApiKey } from "../../models/appApiKey.model.js";
import { generateApiKey } from "../../controllers/appApiKey.controller.js";
import { PromoCode } from "../../models/promocode.model.js";
import { AppPricing } from "../../models/appPricing.model.js";

// Logger Utility
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

    const apiKey = await ApiKey.findOne({ username }).select(
      "username key expiresAt isActive createdAt status"
    );

    return apiKey;
  } catch (error) {
    throw new ApiError(
      error.response?.status || 500,
      error.response?.data?.message || "Failed to fetch app user data"
    );
  }
};

export const processSuccessfulPayment = async (paymentID, res) => {
  const paymentDetails = await executePayment(paymentID);

  console.log(paymentDetails);

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
  const plan = merchantInvoiceNumber.split("-")[0];

  try {
    const userId = payerReference.split("-")[0];
    const planId = payerReference.split("-")[1];
    const promoCode = payerReference.split("-")[2];

    if (promoCode) {
      await PromoCode.findByIdAndUpdate(promoCode, {
        $addToSet: { usedCount: userId },
      });
    }

    const payment = await AppPayment.create({
      userId,
      paymentID,
      plan: {
        id: planId,
        type: plan,
      },
      amount,
      trxID,
      paymentDetails,
      status: transactionStatus,
      createdAt: new Date(),
    });

    if (!payment) {
      logger.error("Failed to create payment record", {
        paymentID,
        payerReference,
      });
      return redirectToPricing(res, "Payment failed", "record_creation_failed");
    }

    if (transactionStatus === "Completed") {
      await payment.save();

      const updateSuccess = await updatePlan(userId, planId);

      if (!updateSuccess) {
        logger.warn("Plan update failed after retries", {
          paymentID,
          payerReference,
        });
      }

      return res.redirect(
        `${config.cors_origin}/payment-status?status=success&amount=${amount}&plan=${plan}&trxID=${trxID}`
      );
    } else {
      logger.warn("Payment incomplete", { paymentID, transactionStatus });
      return redirectToPricing(res, "Payment incomplete", "pending_completion");
    }
  } catch (error) {
    logger.error("Error processing successful payment", {
      paymentID,
      error: error.message,
    });
    return redirectToPricing(res, "Payment failed", "processing_error");
  }
};

const updatePlan = async (userId, planId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      logger.error("User not found for plan update", { userId });
      return false;
    }

    const selectedPlan = await AppPricing.findById(planId);
    if (!selectedPlan || !selectedPlan.isActive) {
      logger.error("Selected plan not found or inactive", { planId });
      return false;
    }

    const planType = selectedPlan.type; // subscription or credit
    const now = new Date();
    let expirationDate;

    if (planType === "subscription" && selectedPlan.planDuration) {
      expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + selectedPlan.planDuration);
      expirationDate.setHours(23, 59, 59, 999);
    }

    let apiKey = await ApiKey.findOne({ userId });

    if (!apiKey) {
      // Create new API key if one doesn't exist
      const newApiKey = generateApiKey();
      const today = new Date().toISOString().split("T")[0];

      apiKey = await ApiKey.create({
        userId: user._id,
        username: user.name || user.email.split("@")[0] || "User",
        key: newApiKey,
        plan: {
          type: planType,
          id: selectedPlan._id.toString(),
        },
        expiresAt: planType === "subscription" ? expirationDate : undefined,
        credit:
          planType === "credit"
            ? selectedPlan.credit
            : planType === "subscription"
              ? Infinity
              : 10, // Free plan gets 10 credits daily
        isActive: true,
        status: "active",
        lastCreditRefresh: today,
      });

      logger.info("New API key created with plan", {
        userId: user._id.toString(),
        email: user.email,
        planType,
        planName: selectedPlan.name,
      });
    } else {
      // Update existing API key
      if (planType === "subscription") {
        // If existing plan expired, set new expiration date
        // Otherwise, extend current expiration date
        const isExpired = !apiKey.expiresAt || now > apiKey.expiresAt;

        if (isExpired) {
          apiKey.expiresAt = expirationDate;
        } else if (apiKey.expiresAt) {
          const newExpiresAt = new Date(apiKey.expiresAt);
          newExpiresAt.setDate(
            newExpiresAt.getDate() + selectedPlan.planDuration
          );
          newExpiresAt.setHours(23, 59, 59, 999);
          apiKey.expiresAt = newExpiresAt;
        }

        apiKey.credit = Infinity;
      } else if (planType === "credit") {
        // Add credits to existing balance
        const currentCredit = isFinite(apiKey.credit) ? apiKey.credit : 0;
        apiKey.credit = currentCredit + (selectedPlan.credit || 0);
        apiKey.expiresAt = undefined; // Credit plans don't expire
      }

      // Update plan details
      apiKey.plan = {
        type: planType,
        id: selectedPlan._id.toString(),
      };

      // Ensure API key is active
      apiKey.isActive = true;
      apiKey.status = "active";

      // If previously suspended, clear suspension
      if (apiKey.suspendedAt) {
        apiKey.suspendedAt = null;
      }

      await apiKey.save();

      logger.info("Existing API key updated with new plan", {
        userId: user._id.toString(),
        email: user.email,
        planType,
        planName: selectedPlan.name,
        credit: apiKey.credit,
        expiresAt: apiKey.expiresAt,
      });
    }

    return true;
  } catch (error) {
    logger.error("Plan update failed", {
      userId,
      planId,
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
};

export const redirectToPricing = (res, message, reason = "") => {
  let redirectURL = `${config.cors_origin}/pricing?message=${encodeURIComponent(message)}`;
  if (reason) {
    redirectURL += `&reason=${encodeURIComponent(reason)}`;
  }
  return res.redirect(redirectURL);
};
