import config from "../../config/index.js";
import ApiError from "../../utils/api.error.js";
import { executePayment } from "../bkash/bkash.service.js";
import { User } from "../../models/user.model.js";
import { AppPayment } from "../../models/appPayment.model.js";
import { AppKey } from "../../models/appKey.model.js";
import { generateAppKey } from "../../controllers/appKey.controller.js";
import { PromoCode } from "../../models/promocode.model.js";
import { AppPricing } from "../../models/appPricing.model.js";
import { Referral } from "../../models/referral.model.js";

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

    const appKey = await AppKey.findOne({ username }).select(
      "username key expiresAt isActive createdAt status"
    );

    return appKey;
  } catch (error) {
    throw new ApiError(
      error.response?.status || 500,
      error.response?.data?.message || "Failed to fetch app user data"
    );
  }
};

export const processSuccessfulPayment = async (paymentID, res) => {
  let paymentDetails;

  try {
    paymentDetails = await executePayment(paymentID);
  } catch (error) {
    logger.error("Payment execution failed", {
      paymentID,
      error: error.message,
    });
    return redirectToPricing(
      res,
      "Payment execution failed",
      error.message || "execution_error"
    );
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
  const plan = merchantInvoiceNumber.split("-")[0];

  try {
    const userId = payerReference.split("-")[0];
    const planId = payerReference.split("-")[1];
    const promoCode = payerReference.split("-")[2];

    const planDetails = await AppPricing.findById(planId);

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
        name: planDetails?.name || plan,
        type: planDetails?.type,
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

      try {
        const payingUser = await User.findById(userId).populate("referred");

        if (!payingUser?.referred) {
          logger.info("No referral found for this payment", { userId });
        } else {
          const referralDoc = await Referral.findById(payingUser.referred);

          if (referralDoc) {
            const userHistory = referralDoc.earnedHistory.filter(
              (e) => e.user.toString() === payingUser._id.toString()
            );

            if (userHistory.length >= 1) {
              logger.info(
                "Referral earnings skipped (already rewarded fully)",
                {
                  referrer: referralDoc.referrer.toString(),
                  referredUser: payingUser._id.toString(),
                }
              );
              return;
            }

            const rewardAmount = 50;

            if (rewardAmount > 0) {
              referralDoc.availableBalance += rewardAmount;
              referralDoc.earnedHistory.push({
                user: payingUser._id,
                amount: rewardAmount,
                createdAt: new Date(),
              });

              await referralDoc.save();

              logger.info("Referral earning added", {
                referrer: referralDoc.referrer.toString(),
                referredUser: payingUser._id.toString(),
                amount: rewardAmount,
              });
            }
          }
        }
      } catch (referralError) {
        logger.error("Failed to update referral earnings", {
          error: referralError.message,
          userId,
        });
      }

      return res.redirect(
        `${config.cors_origin}/payment-status?status=success&amount=${amount}&plan=${plan}&trxID=${trxID}&planType=${planDetails?.type || "N/A"}&duration=${planDetails?.planDuration || "N/A"}${planDetails?.type === "credit" ? `&credit=${planDetails?.credit || 0}` : ""}`
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

    if (selectedPlan.planDuration) {
      expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + selectedPlan.planDuration);
      expirationDate.setHours(23, 59, 59, 999);
    }

    let appKey = await AppKey.findOne({ userId });

    if (!appKey) {
      // Create new API key if one doesn't exist
      const newAppKey = generateAppKey();
      const today = new Date().toISOString().split("T")[0];

      appKey = await AppKey.create({
        userId: user._id,
        username: user.email || user.name,
        key: newAppKey,
        plan: {
          type: planType,
          id: selectedPlan._id.toString(),
        },
        expiresAt: expirationDate,
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
      const previousPlanType = appKey.plan.type; // Track previous plan type

      if (planType === "subscription") {
        // SUBSCRIPTION PLAN LOGIC
        if (previousPlanType === "subscription") {
          // Subscription → Subscription: Extend expiry date
          const isExpired = !appKey.expiresAt || now > appKey.expiresAt;

          if (isExpired) {
            // If expired, set new expiration from now
            appKey.expiresAt = expirationDate;
          } else if (appKey.expiresAt && selectedPlan.planDuration) {
            // If still valid, extend the current expiration date
            const newExpiresAt = new Date(appKey.expiresAt);
            newExpiresAt.setDate(
              newExpiresAt.getDate() + selectedPlan.planDuration
            );
            newExpiresAt.setHours(23, 59, 59, 999);
            appKey.expiresAt = newExpiresAt;
          }
        } else {
          // Free/Credit → Subscription: Start fresh expiry
          appKey.expiresAt = expirationDate;
        }

        appKey.credit = Infinity;
      } else if (planType === "credit") {
        // CREDIT PLAN LOGIC

        if (previousPlanType === "free") {
          // Free → Credit: Replace credits (don't add), set fresh expiry
          appKey.credit = selectedPlan.credit || 0;
          appKey.expiresAt = expirationDate;
        } else if (previousPlanType === "subscription") {
          // Subscription → Credit: Start fresh expiry, replace credits
          appKey.credit = selectedPlan.credit || 0;
          appKey.expiresAt = expirationDate;
        } else if (previousPlanType === "credit") {
          // Credit → Credit: Add credits and extend expiry
          const currentCredit = isFinite(appKey.credit) ? appKey.credit : 0;
          appKey.credit = currentCredit + (selectedPlan.credit || 0);

          // Extend expiration date
          if (expirationDate) {
            const isExpired = !appKey.expiresAt || now > appKey.expiresAt;

            if (isExpired) {
              // If expired, set new expiration from now
              appKey.expiresAt = expirationDate;
            } else if (appKey.expiresAt && selectedPlan.planDuration) {
              // If still valid, extend the current expiration date
              const newExpiresAt = new Date(appKey.expiresAt);
              newExpiresAt.setDate(
                newExpiresAt.getDate() + selectedPlan.planDuration
              );
              newExpiresAt.setHours(23, 59, 59, 999);
              appKey.expiresAt = newExpiresAt;
            }
          }
        }
      }

      // Update plan details
      appKey.plan = {
        type: planType,
        id: selectedPlan._id.toString(),
      };

      // Ensure API key is active
      appKey.isActive = true;
      appKey.status = "active";

      // If previously suspended, clear suspension
      if (appKey.suspendedAt) {
        appKey.suspendedAt = null;
      }

      await appKey.save();

      logger.info("Existing API key updated with new plan", {
        userId: user._id.toString(),
        email: user.email,
        planType,
        planName: selectedPlan.name,
        credit: appKey.credit,
        expiresAt: appKey.expiresAt,
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
