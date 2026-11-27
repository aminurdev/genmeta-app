import config from "../../config/index.js";
import ApiError from "../../utils/api.error.js";
import { AppUser } from "../../models/appUser.model.js";
import paymentService from "../payment/payment.service.js";

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
    const appUser = await AppUser.findOne({ username: username.toLowerCase().trim() }).select(
      "userId username plan expiresAt isActive createdAt status"
    );
    return appUser;
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to fetch app user data"
    );
  }
};

export const redirectToPricing = (res, message, reason = "") => {
  const base = config.cors_origin.replace(/\/+$/, "");
  const params = new URLSearchParams({ message });
  if (reason) {
    params.set("reason", reason);
  }
  return res.redirect(`${base}/pricing?${params.toString()}`);
};

export const redirectToPaymentStatus = (res, paramsObj = {}) => {
  const base = config.cors_origin.replace(/\/+$/, "");
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(paramsObj)) {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  }
  return res.redirect(`${base}/payment-status?${params.toString()}`);
};

/**
 * Process PayStation Callback via authoritative verification and safe URLSearchParams redirect
 */
export const processSuccessfulPaystationPayment = async (
  invoiceNumber,
  res,
  gatewayHints = {}
) => {
  try {
    const result = await paymentService.verifyAndFulfillTransaction(
      invoiceNumber,
      {
        source: "callback",
        gatewayHints,
      }
    );

    if (result.outcome === "not_found") {
      logger.warn("PayStation callback invoice not found", { invoiceNumber });
      return redirectToPaymentStatus(res, {
        invoice: invoiceNumber,
        status: "failed",
        message: "Payment record not found",
      });
    }

    if (result.outcome === "completed") {
      return redirectToPaymentStatus(res, {
        invoice: invoiceNumber,
        status: "completed",
      });
    }

    return redirectToPaymentStatus(res, {
      invoice: invoiceNumber,
      status: result.outcome || "pending",
    });
  } catch (error) {
    logger.error("Error processing PayStation callback", {
      invoiceNumber,
      error: error.message,
    });
    return redirectToPaymentStatus(res, {
      invoice: invoiceNumber,
      status: "verification_error",
      message: "Payment verification error",
    });
  }
};
