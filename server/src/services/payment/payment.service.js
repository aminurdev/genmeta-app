import crypto from "crypto";
import mongoose from "mongoose";
import config from "../../config/index.js";
import ApiError from "../../utils/api.error.js";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  PAYMENT_GATEWAYS,
  PAYMENT_STATUS,
} from "../../constants/index.js";
import { AppPricing } from "../../models/appPricing.model.js";
import { AppPayment } from "../../models/appPayment.model.js";
import { PaymentTransaction } from "../../models/paymentTransaction.model.js";
import { PromoCode } from "../../models/promocode.model.js";
import { PromoCodeRedemption } from "../../models/promoCodeRedemption.model.js";
import { User } from "../../models/user.model.js";
import planService from "../plan.service.js";
import { sendPaymentConfirmationEmail } from "../email/email.service.js";
import defaultNotificationService from "../notification/notification.service.js";
import * as defaultPaystationService from "../paystation/paystation.service.js";

const PROCESSING_LOCK_STALE_MS = 60 * 1000;
const RECONCILIATION_MIN_AGE_MS = 2 * 60 * 1000;
const RECONCILIATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_EVENTS = 25;

let isReconciling = false;

/**
 * Generate a collision-resistant PayStation invoice number.
 */
export function generateInvoiceNumber() {
  const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `INV-${Date.now()}-${randomSuffix}`;
}

/**
 * Compute authoritative server-side pricing for a plan and optional promo code.
 */
export function calculateOrderPricing(plan, promoCodeDoc = null, payWithCharge = 0) {
  const round = defaultPaystationService.roundBdtAmount;
  const basePrice = round(Math.max(0, Number(plan?.basePrice) || 0));

  let priceAfterPlanDiscount = basePrice;
  if (plan?.discountPrice !== undefined && plan?.discountPrice !== null && Number(plan.discountPrice) > 0) {
    priceAfterPlanDiscount = round(Number(plan.discountPrice));
  } else if (Number(plan?.discountPercent) > 0) {
    const pct = Math.max(0, Math.min(100, Number(plan.discountPercent)));
    priceAfterPlanDiscount = round(basePrice * (1 - pct / 100));
  }

  const planDiscountAmount = round(Math.max(0, basePrice - priceAfterPlanDiscount));

  const promoPercent = promoCodeDoc
    ? Math.max(0, Math.min(100, Number(promoCodeDoc.discountPercent) || 0))
    : 0;
  const promoDiscountAmount =
    promoPercent > 0 ? round(priceAfterPlanDiscount * (promoPercent / 100)) : 0;

  const discountedTotal = round(priceAfterPlanDiscount - promoDiscountAmount);
  const expectedAmount = Math.max(1, discountedTotal);

  return {
    basePrice,
    priceAfterPlanDiscount,
    planDiscountAmount,
    promoDiscountAmount,
    expectedAmount,
    currency: "BDT",
    payWithCharge: Number(payWithCharge) === 1 ? 1 : 0,
  };
}

/**
 * Validate gateway-reported amounts against the authoritative server order amount.
 */
export function validateAmountIntegrity({
  expectedAmount,
  paidAmount,
  requestAmount = null,
  payWithCharge = 0,
}) {
  const expected = Number(expectedAmount);
  const paid = Number(paidAmount);

  if (!Number.isFinite(expected) || expected <= 0) {
    return { valid: false, reason: "Invalid expected order amount" };
  }

  if (!Number.isFinite(paid) || paid <= 0) {
    return { valid: false, reason: "Invalid gateway paid amount" };
  }

  if (requestAmount !== null && requestAmount !== undefined && requestAmount !== "") {
    const reqAmt = Number(requestAmount);
    if (!Number.isFinite(reqAmt) || Math.abs(reqAmt - expected) > 0.01) {
      return {
        valid: false,
        reason: `Gateway request_amount (${requestAmount}) does not match expected amount (${expected})`,
      };
    }
  }

  if (Number(payWithCharge) === 1) {
    if (paid < expected - 0.01) {
      return {
        valid: false,
        reason: `Paid amount (${paid}) is less than expected amount (${expected})`,
      };
    }
    return { valid: true };
  }

  if (Math.abs(paid - expected) > 0.01) {
    return {
      valid: false,
      reason: `Paid amount (${paid}) does not match expected amount (${expected})`,
    };
  }

  return { valid: true };
}

/**
 * Mask mobile phone numbers for non-admin client responses.
 */
export function maskPhoneNumber(phone) {
  if (!phone) return null;
  const str = String(phone).trim();
  if (!str) return null;
  if (str.length <= 6) {
    return "*".repeat(str.length);
  }
  const maskedLen = Math.max(2, str.length - 7);
  return `${str.slice(0, 3)}${"*".repeat(maskedLen)}${str.slice(-4)}`;
}

/**
 * Sanitize PaymentTransaction record before sending to client or admin APIs.
 */
export function sanitizeTransactionForClient(tx, { isAdmin = false } = {}) {
  if (!tx) return null;

  const expectedAmount = tx.pricing?.expectedAmount ?? tx.amount ?? 0;
  const baseObj = {
    id: tx._id?.toString?.() || tx.id || null,
    invoiceNumber: tx.invoiceNumber || tx.paymentID || null,
    gateway: tx.gateway || PAYMENT_GATEWAYS.PAYSTATION,
    status: tx.status || PAYMENT_STATUS.INITIATED,
    trxId: tx.trxId || tx.trxID || null,
    paymentMethod: tx.paymentMethod || tx.paymentDetails?.paymentMethod || null,
    payerMobileNo: isAdmin
      ? tx.payerMobileNo || tx.paymentDetails?.payerMobileNo || null
      : maskPhoneNumber(tx.payerMobileNo || tx.paymentDetails?.payerMobileNo),
    plan: {
      id: tx.plan?.id || "",
      name: tx.plan?.name || "",
      type: tx.plan?.type || "",
      planDuration: tx.plan?.planDuration ?? null,
      credit: tx.plan?.credit ?? null,
    },
    promoCode: tx.promoCode?.code
      ? {
          code: tx.promoCode.code,
          discountPercent: tx.promoCode.discountPercent || 0,
        }
      : null,
    amount: expectedAmount,
    paidAmount: tx.pricing?.paidAmount ?? expectedAmount,
    currency: tx.pricing?.currency || tx.currency || "BDT",
    pricing: {
      basePrice: tx.pricing?.basePrice ?? expectedAmount,
      priceAfterPlanDiscount: tx.pricing?.priceAfterPlanDiscount ?? expectedAmount,
      planDiscountAmount: tx.pricing?.planDiscountAmount ?? 0,
      promoDiscountAmount: tx.pricing?.promoDiscountAmount ?? 0,
      expectedAmount,
      paidAmount: tx.pricing?.paidAmount ?? null,
      currency: tx.pricing?.currency || tx.currency || "BDT",
      payWithCharge: tx.pricing?.payWithCharge ?? 0,
    },
    failureReason: tx.failureReason || null,
    expiresAt: tx.expiresAt || null,
    verifiedAt: tx.verifiedAt || null,
    fulfilledAt: tx.fulfilledAt || null,
    createdAt: tx.createdAt || null,
    updatedAt: tx.updatedAt || null,
  };

  if (isAdmin) {
    baseObj.userId = tx.userId || null;
    baseObj.appPaymentId = tx.appPaymentId || null;
    baseObj.gatewayStatus = tx.gatewayStatus || null;
    baseObj.fulfillmentSteps = tx.fulfillmentSteps || null;
    baseObj.events = Array.isArray(tx.events) ? tx.events : [];
    baseObj.gatewayInitMeta = tx.gatewayInitMeta || null;
    baseObj.gatewayResponse = tx.gatewayResponse || null;
  }

  return baseObj;
}

function formatEvent(type, source, message, meta = null) {
  return {
    type,
    source,
    message: String(message || ""),
    meta,
    at: new Date(),
  };
}

function toSafeInitResponse(tx, reused = false) {
  return {
    paymentUrl: tx.paymentUrl,
    invoiceNumber: tx.invoiceNumber,
    amount: tx.pricing?.expectedAmount,
    currency: tx.pricing?.currency || "BDT",
    expiresAt: tx.expiresAt,
    reused,
    plan: {
      name: tx.plan?.name,
      type: tx.plan?.type,
      duration: tx.plan?.planDuration ?? null,
      credit: tx.plan?.credit ?? null,
    },
    promoCode: tx.promoCode?.code || null,
  };
}

/**
 * Build a PaymentService instance with injectable dependencies for clean unit testing.
 */
export function createPaymentService(overrides = {}) {
  const deps = {
    UserModel: overrides.UserModel || User,
    AppPricingModel: overrides.AppPricingModel || AppPricing,
    PromoCodeModel: overrides.PromoCodeModel || PromoCode,
    PromoCodeRedemptionModel:
      overrides.PromoCodeRedemptionModel || PromoCodeRedemption,
    PaymentTransactionModel:
      overrides.PaymentTransactionModel || PaymentTransaction,
    AppPaymentModel: overrides.AppPaymentModel || AppPayment,
    paystation: overrides.paystation || defaultPaystationService,
    planService: overrides.planService || planService,
    sendPaymentEmail:
      overrides.sendPaymentEmail || sendPaymentConfirmationEmail,
    notificationService:
      overrides.notificationService || defaultNotificationService,
    psConfig: overrides.psConfig || config.paystation,
    nowFn: overrides.nowFn || (() => new Date()),
  };

  function emitNotificationAsync(fn) {
    Promise.resolve()
      .then(fn)
      .catch((err) => {
        console.error(
          "[PaymentService] Notification background error:",
          err?.message || err
        );
      });
  }

  async function pushEvent(invoiceNumber, eventObj, setFields = {}, unsetFields = {}) {
    const update = {
      $push: {
        events: {
          $each: [eventObj],
          $slice: -MAX_EVENTS,
        },
      },
    };
    if (Object.keys(setFields).length > 0) {
      update.$set = setFields;
    }
    if (Object.keys(unsetFields).length > 0) {
      update.$unset = unsetFields;
    }
    return deps.PaymentTransactionModel.findOneAndUpdate(
      { invoiceNumber },
      update,
      { new: true }
    );
  }

  /**
   * Create or reuse an idempotent PayStation checkout session.
   */
  async function createCheckoutSession({
    userId,
    planId,
    promoCode = null,
    customerPhone = null,
    idempotencyKey = null,
  }) {
    deps.paystation.assertPaystationConfigured();

    if (!planId || !mongoose.Types.ObjectId.isValid(String(planId))) {
      throw new ApiError(400, "Valid Plan ID is required");
    }

    const user = await deps.UserModel.findById(userId).select(
      "name email isDisabled"
    );
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (user.isDisabled) {
      throw new ApiError(403, "Your account is currently disabled");
    }

    const plan = await deps.AppPricingModel.findById(planId);
    if (!plan || !plan.isActive) {
      throw new ApiError(404, "Plan not found or inactive");
    }

    const now = deps.nowFn();
    let appliedPromo = null;
    const normalizedPromo =
      typeof promoCode === "string" && promoCode.trim()
        ? promoCode.toUpperCase().trim()
        : null;

    if (normalizedPromo) {
      appliedPromo = await deps.PromoCodeModel.findOne({
        code: normalizedPromo,
        isActive: true,
        $or: [{ appliesTo: plan.type }, { appliesTo: "both" }],
        validFrom: { $lte: now },
        validUntil: { $gte: now },
      });

      if (!appliedPromo) {
        throw new ApiError(400, "Invalid or expired promo code");
      }

      const [ledgerTotalCount, ledgerUserUsed] = await Promise.all([
        deps.PromoCodeRedemptionModel.countDocuments({
          promoCodeId: appliedPromo._id,
        }),
        deps.PromoCodeRedemptionModel.exists({
          promoCodeId: appliedPromo._id,
          userId: user._id,
        }),
      ]);

      const legacyUsedArr = Array.isArray(appliedPromo.usedCount)
        ? appliedPromo.usedCount
        : [];
      const totalUsedCount = Math.max(legacyUsedArr.length, ledgerTotalCount);

      if (
        appliedPromo.usageLimit !== null &&
        appliedPromo.usageLimit !== undefined &&
        totalUsedCount >= appliedPromo.usageLimit
      ) {
        throw new ApiError(400, "Promo code usage limit exceeded");
      }

      if (
        legacyUsedArr.includes(user._id.toString()) ||
        Boolean(ledgerUserUsed)
      ) {
        throw new ApiError(400, "You have already used this promo code");
      }
    }

    const cleanIdempotencyKey =
      typeof idempotencyKey === "string" && idempotencyKey.trim()
        ? idempotencyKey.trim().slice(0, 128)
        : null;

    if (cleanIdempotencyKey) {
      const existingActive = await deps.PaymentTransactionModel.findOne({
        userId: user._id,
        activeIdempotencyKey: cleanIdempotencyKey,
        status: PAYMENT_STATUS.PENDING,
        expiresAt: { $gt: now },
      });

      if (existingActive && existingActive.paymentUrl) {
        const samePlan = existingActive.plan?.id === plan._id.toString();
        const samePromo =
          (existingActive.promoCode?.code || null) ===
          (appliedPromo?.code || null);
        if (samePlan && samePromo) {
          return toSafeInitResponse(existingActive, true);
        }
        throw new ApiError(
          409,
          "Idempotency key is already bound to a different pending checkout session."
        );
      }
    }

    const pricing = calculateOrderPricing(
      plan,
      appliedPromo,
      deps.psConfig.pay_with_charge
    );

    const expiryMinutes = deps.psConfig.payment_expiry_minutes;
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);
    const resolvedPhone = deps.paystation.sanitizeBdPhone(
      customerPhone,
      deps.psConfig.default_phone
    );
    const invoiceNumber = generateInvoiceNumber();

    let txDoc;
    try {
      txDoc = await deps.PaymentTransactionModel.create({
        invoiceNumber,
        userId: user._id,
        gateway: PAYMENT_GATEWAYS.PAYSTATION,
        status: PAYMENT_STATUS.INITIATED,
        idempotencyKey: cleanIdempotencyKey,
        ...(cleanIdempotencyKey
          ? { activeIdempotencyKey: cleanIdempotencyKey }
          : {}),
        plan: {
          id: plan._id.toString(),
          name: plan.name,
          type: plan.type,
          planDuration: plan.planDuration ?? null,
          credit: plan.credit ?? null,
        },
        promoCode: {
          id: appliedPromo ? appliedPromo._id : null,
          code: appliedPromo ? appliedPromo.code : null,
          discountPercent: appliedPromo ? appliedPromo.discountPercent : 0,
        },
        pricing,
        customer: {
          name: user.name,
          email: user.email,
          phone: resolvedPhone,
        },
        expiresAt,
        events: [
          formatEvent(
            "initiated",
            "checkout",
            `Payment intent created for ${pricing.expectedAmount} BDT`,
            { planId: plan._id.toString(), promoCode: appliedPromo?.code || null }
          ),
        ],
      });
    } catch (createErr) {
      if (createErr?.code === 11000 && cleanIdempotencyKey) {
        const raced = await deps.PaymentTransactionModel.findOne({
          userId: user._id,
          activeIdempotencyKey: cleanIdempotencyKey,
        });
        if (raced && raced.paymentUrl) {
          const samePlan = raced.plan?.id === plan._id.toString();
          const samePromo =
            (raced.promoCode?.code || null) === (appliedPromo?.code || null);
          if (samePlan && samePromo) {
            return toSafeInitResponse(raced, true);
          }
          throw new ApiError(
            409,
            "Idempotency key conflict with a different checkout session."
          );
        }
      }
      throw createErr;
    }

    const checkoutItems = {
      planId: plan._id.toString(),
      planName: plan.name,
      planType: plan.type,
      planDuration: plan.planDuration ?? null,
      credit: plan.credit ?? null,
      promoCode: appliedPromo?.code || null,
    };

    try {
      const gatewayResult = await deps.paystation.initiatePayment({
        invoiceNumber,
        amount: pricing.expectedAmount,
        customerName: user.name,
        customerPhone: resolvedPhone,
        customerEmail: user.email,
        reference: txDoc._id.toString(),
        checkoutItems,
        optA: user._id.toString(),
        optB: plan._id.toString(),
        optC: appliedPromo ? appliedPromo._id.toString() : "",
        payWithCharge: pricing.payWithCharge,
      });

      const updatedTx = await pushEvent(
        invoiceNumber,
        formatEvent(
          "gateway_initiated",
          "paystation",
          "PayStation checkout URL generated",
          {
            statusCode: gatewayResult.statusCode,
            paymentAmount: gatewayResult.paymentAmount,
          }
        ),
        {
          status: PAYMENT_STATUS.PENDING,
          paymentUrl: gatewayResult.paymentUrl,
          gatewayInitMeta: {
            statusCode: gatewayResult.statusCode,
            status: gatewayResult.status,
            message: gatewayResult.message,
            paymentAmount: gatewayResult.paymentAmount,
          },
        }
      );

      return toSafeInitResponse(updatedTx || txDoc, false);
    } catch (gatewayErr) {
      await pushEvent(
        invoiceNumber,
        formatEvent(
          "gateway_init_failed",
          "paystation",
          gatewayErr.message || "Gateway initiation failed"
        ),
        {
          status: PAYMENT_STATUS.FAILED,
          failureReason: gatewayErr.message || "Gateway initiation failed",
        },
        { activeIdempotencyKey: 1 }
      );
      throw gatewayErr;
    }
  }

  /**
   * Server-to-server verification and idempotent fulfillment for a PayStation invoice.
   */
  async function verifyAndFulfillTransaction(
    invoiceNumber,
    { source = "callback", gatewayHints = {} } = {}
  ) {
    const cleanedInvoice = String(invoiceNumber || "").trim();
    if (!cleanedInvoice) {
      throw new ApiError(400, "Invoice number is required");
    }

    const tx = await deps.PaymentTransactionModel.findOne({
      invoiceNumber: cleanedInvoice,
    });

    if (!tx) {
      const legacyPayment = await deps.AppPaymentModel.findOne({
        paymentID: cleanedInvoice,
      }).lean();
      if (legacyPayment) {
        return {
          outcome: "completed",
          alreadyProcessed: true,
          transaction: null,
          legacyPayment,
        };
      }
      return {
        outcome: "not_found",
        alreadyProcessed: false,
        transaction: null,
      };
    }

    if (tx.status === PAYMENT_STATUS.COMPLETED && tx.fulfilledAt) {
      return {
        outcome: "completed",
        alreadyProcessed: true,
        transaction: tx,
      };
    }

    const now = deps.nowFn();
    if (source === "callback" && !tx.callbackReceivedAt) {
      await deps.PaymentTransactionModel.updateOne(
        { _id: tx._id, callbackReceivedAt: null },
        { $set: { callbackReceivedAt: now } }
      );
    } else if (source === "ipn" && !tx.ipnReceivedAt) {
      await deps.PaymentTransactionModel.updateOne(
        { _id: tx._id, ipnReceivedAt: null },
        { $set: { ipnReceivedAt: now } }
      );
    }

    let verification;
    try {
      verification = await deps.paystation.verifyTransaction({
        invoiceNumber: cleanedInvoice,
        trxId: gatewayHints?.trxId || tx.trxId || null,
        enrichWithV2: tx.pricing?.payWithCharge === 1,
      });
    } catch (verifyErr) {
      const latestTx = await pushEvent(
        cleanedInvoice,
        formatEvent(
          "verification_error",
          source,
          verifyErr.message || "Gateway verification error"
        )
      );
      return {
        outcome: "verification_error",
        error: verifyErr.message,
        transaction: latestTx || tx,
      };
    }

    const hintNormalized = defaultPaystationService.normalizeTransactionStatus(
      gatewayHints?.status
    );

    if (!verification?.found || !verification?.data) {
      if (hintNormalized === "canceled" || hintNormalized === "failed") {
        const targetStatus =
          hintNormalized === "canceled"
            ? PAYMENT_STATUS.CANCELED
            : PAYMENT_STATUS.FAILED;
        const reason =
          targetStatus === PAYMENT_STATUS.CANCELED
            ? "Payment was canceled by customer"
            : "Payment failed at gateway";
        const transitioned = await deps.PaymentTransactionModel.findOneAndUpdate(
          {
            invoiceNumber: cleanedInvoice,
            fulfilledAt: null,
            status: { $in: [PAYMENT_STATUS.INITIATED, PAYMENT_STATUS.PENDING] },
          },
          {
            $set: {
              status: targetStatus,
              gatewayStatus: gatewayHints?.status || targetStatus,
              failureReason: reason,
            },
            $unset: { activeIdempotencyKey: 1 },
            $push: {
              events: {
                $each: [formatEvent(`gateway_${targetStatus}`, source, reason)],
                $slice: -MAX_EVENTS,
              },
            },
          },
          { new: true }
        );
        if (targetStatus === PAYMENT_STATUS.FAILED) {
          emitNotificationAsync(() =>
            deps.notificationService.notifyUser({
              recipientId: tx.userId,
              recipientEmail: tx.customer?.email || null,
              recipientName: tx.customer?.name || null,
              type: "payment.failed",
              category: NOTIFICATION_CATEGORIES.BILLING,
              priority: NOTIFICATION_PRIORITIES.NORMAL,
              title: "Payment Could Not Be Completed",
              message: `Your payment attempt for ${tx.plan?.name || "GenMeta Plan"} (Invoice ${cleanedInvoice}) could not be completed. No funds were captured.`,
              actionUrl: "/pricing",
              actionLabel: "Try Again",
              dedupeKey: `payment_failed:${cleanedInvoice}`,
              metadata: { invoiceNumber: cleanedInvoice, status: targetStatus },
            })
          );
        }
        return {
          outcome: targetStatus,
          transaction: transitioned || (await deps.PaymentTransactionModel.findById(tx._id)),
        };
      }

      if (tx.expiresAt && new Date(tx.expiresAt) <= now) {
        const expiredTx = await deps.PaymentTransactionModel.findOneAndUpdate(
          {
            invoiceNumber: cleanedInvoice,
            fulfilledAt: null,
            status: { $in: [PAYMENT_STATUS.INITIATED, PAYMENT_STATUS.PENDING] },
          },
          {
            $set: {
              status: PAYMENT_STATUS.EXPIRED,
              failureReason: "Payment session expired without completion",
            },
            $unset: { activeIdempotencyKey: 1 },
            $push: {
              events: {
                $each: [
                  formatEvent(
                    "expired",
                    source,
                    "Payment session expired without gateway confirmation"
                  ),
                ],
                $slice: -MAX_EVENTS,
              },
            },
          },
          { new: true }
        );
        return {
          outcome: "expired",
          transaction: expiredTx || tx,
        };
      }

      return {
        outcome: "pending",
        transaction: tx,
      };
    }

    const verified = verification.data;

    if (
      verified.invoiceNumber &&
      String(verified.invoiceNumber).trim() !== cleanedInvoice
    ) {
      const reason = `Gateway invoice mismatch: expected ${cleanedInvoice}, got ${verified.invoiceNumber}`;
      console.error("🚨 Security Alert - Invoice Mismatch:", {
        expectedInvoice: cleanedInvoice,
        gatewayInvoice: verified.invoiceNumber,
      });
      const mismatched = await deps.PaymentTransactionModel.findOneAndUpdate(
        {
          invoiceNumber: cleanedInvoice,
          fulfilledAt: null,
          status: { $in: [PAYMENT_STATUS.INITIATED, PAYMENT_STATUS.PENDING] },
        },
        {
          $set: {
            status: PAYMENT_STATUS.AMOUNT_MISMATCH,
            failureReason: reason,
            gatewayResponse: verified.raw || verified,
          },
          $unset: { activeIdempotencyKey: 1 },
          $push: {
            events: {
              $each: [formatEvent("invoice_mismatch", source, reason)],
              $slice: -MAX_EVENTS,
            },
          },
        },
        { new: true }
      );
      emitNotificationAsync(() =>
        deps.notificationService.notifyAdmins({
          type: "security.payment_invoice_mismatch",
          category: NOTIFICATION_CATEGORIES.SECURITY,
          priority: NOTIFICATION_PRIORITIES.URGENT,
          forceDeliver: true,
          sendEmail: true,
          title: "Payment Security Alert: Invoice Mismatch",
          message: `Gateway invoice mismatch detected for ${cleanedInvoice}: ${reason}`,
          actionUrl: "/admin/payments",
          actionLabel: "Inspect Payments",
          dedupeKey: `payment_security:invoice_mismatch:${cleanedInvoice}`,
          metadata: {
            invoiceNumber: cleanedInvoice,
            gatewayInvoice: verified.invoiceNumber,
          },
        })
      );

      return {
        outcome: "amount_mismatch",
        transaction: mismatched || tx,
      };
    }

    if (verified.normalizedStatus !== "success") {
      if (["failed", "canceled", "refunded"].includes(verified.normalizedStatus)) {
        const nextStatus =
          verified.normalizedStatus === "canceled"
            ? PAYMENT_STATUS.CANCELED
            : verified.normalizedStatus === "refunded"
              ? PAYMENT_STATUS.REFUNDED
              : PAYMENT_STATUS.FAILED;
        const reason = `Gateway reported status: ${verified.trxStatus || nextStatus}`;
        const updated = await deps.PaymentTransactionModel.findOneAndUpdate(
          {
            invoiceNumber: cleanedInvoice,
            fulfilledAt: null,
            status: { $in: [PAYMENT_STATUS.INITIATED, PAYMENT_STATUS.PENDING] },
          },
          {
            $set: {
              status: nextStatus,
              gatewayStatus: verified.trxStatus || nextStatus,
              failureReason: reason,
              gatewayResponse: verified.raw || verified,
            },
            $unset: { activeIdempotencyKey: 1 },
            $push: {
              events: {
                $each: [formatEvent(`gateway_${nextStatus}`, source, reason)],
                $slice: -MAX_EVENTS,
              },
            },
          },
          { new: true }
        );
        if (nextStatus === PAYMENT_STATUS.FAILED) {
          emitNotificationAsync(() =>
            deps.notificationService.notifyUser({
              recipientId: tx.userId,
              recipientEmail: tx.customer?.email || null,
              recipientName: tx.customer?.name || null,
              type: "payment.failed",
              category: NOTIFICATION_CATEGORIES.BILLING,
              priority: NOTIFICATION_PRIORITIES.NORMAL,
              title: "Payment Could Not Be Completed",
              message: `Your payment for ${tx.plan?.name || "GenMeta Plan"} (Invoice ${cleanedInvoice}) failed at the gateway.`,
              actionUrl: "/pricing",
              actionLabel: "Try Again",
              dedupeKey: `payment_failed:${cleanedInvoice}`,
              metadata: { invoiceNumber: cleanedInvoice, status: nextStatus },
            })
          );
        }
        return {
          outcome: nextStatus,
          transaction: updated || (await deps.PaymentTransactionModel.findById(tx._id)),
        };
      }

      return {
        outcome: "pending",
        transaction: tx,
      };
    }

    if (!verified.trxId) {
      const noTrx = await pushEvent(
        cleanedInvoice,
        formatEvent(
          "verification_error",
          source,
          "Gateway reported success without a transaction ID"
        )
      );
      return {
        outcome: "verification_error",
        error: "Gateway did not return a valid transaction ID",
        transaction: noTrx || tx,
      };
    }

    const reportedPaidAmount =
      verified.paymentAmount ?? verified.trxAmount ?? null;
    const amountCheck = validateAmountIntegrity({
      expectedAmount: tx.pricing?.expectedAmount,
      paidAmount: reportedPaidAmount,
      requestAmount: verified.requestAmount ?? null,
      payWithCharge: tx.pricing?.payWithCharge || 0,
    });

    if (!amountCheck.valid) {
      console.error("🚨 Security Alert - PayStation Amount Integrity Failure:", {
        invoiceNumber: cleanedInvoice,
        expectedAmount: tx.pricing?.expectedAmount,
        reportedPaidAmount,
        requestAmount: verified.requestAmount,
        reason: amountCheck.reason,
      });

      const mismatched = await deps.PaymentTransactionModel.findOneAndUpdate(
        {
          invoiceNumber: cleanedInvoice,
          fulfilledAt: null,
          status: {
            $in: [
              PAYMENT_STATUS.INITIATED,
              PAYMENT_STATUS.PENDING,
              PAYMENT_STATUS.FAILED,
              PAYMENT_STATUS.CANCELED,
              PAYMENT_STATUS.EXPIRED,
            ],
          },
        },
        {
          $set: {
            status: PAYMENT_STATUS.AMOUNT_MISMATCH,
            gatewayStatus: verified.trxStatus,
            "pricing.paidAmount": Number.isFinite(Number(reportedPaidAmount))
              ? Number(reportedPaidAmount)
              : null,
            failureReason: amountCheck.reason,
            gatewayResponse: verified.raw || verified,
          },
          $unset: { activeIdempotencyKey: 1 },
          $push: {
            events: {
              $each: [formatEvent("amount_mismatch", source, amountCheck.reason)],
              $slice: -MAX_EVENTS,
            },
          },
        },
        { new: true }
      );

      emitNotificationAsync(() =>
        deps.notificationService.notifyAdmins({
          type: "security.payment_amount_mismatch",
          category: NOTIFICATION_CATEGORIES.SECURITY,
          priority: NOTIFICATION_PRIORITIES.URGENT,
          forceDeliver: true,
          sendEmail: true,
          title: "Payment Security Alert: Amount Mismatch",
          message: `Amount integrity check failed for invoice ${cleanedInvoice}: ${amountCheck.reason}`,
          actionUrl: "/admin/payments",
          actionLabel: "Review Transaction",
          dedupeKey: `payment_security:amount_mismatch:${cleanedInvoice}`,
          metadata: {
            invoiceNumber: cleanedInvoice,
            expectedAmount: tx.pricing?.expectedAmount,
            reportedPaidAmount,
          },
        })
      );

      return {
        outcome: "amount_mismatch",
        transaction: mismatched || tx,
      };
    }

    // Acquire atomic processing lock across callback, IPN, polling, and cron reconciliation
    const staleCutoff = new Date(now.getTime() - PROCESSING_LOCK_STALE_MS);
    const lockedTx = await deps.PaymentTransactionModel.findOneAndUpdate(
      {
        invoiceNumber: cleanedInvoice,
        fulfilledAt: null,
        $or: [
          {
            status: {
              $in: [
                PAYMENT_STATUS.INITIATED,
                PAYMENT_STATUS.PENDING,
                PAYMENT_STATUS.FAILED,
                PAYMENT_STATUS.CANCELED,
                PAYMENT_STATUS.EXPIRED,
              ],
            },
          },
          {
            status: PAYMENT_STATUS.PROCESSING,
            processingStartedAt: { $lte: staleCutoff },
          },
        ],
      },
      {
        $set: {
          status: PAYMENT_STATUS.PROCESSING,
          processingStartedAt: now,
          trxId: String(verified.trxId).trim(),
          gatewayStatus: verified.trxStatus || "Success",
          paymentMethod: verified.paymentMethod || null,
          payerMobileNo: verified.payerMobileNo || null,
          "pricing.paidAmount": Number(reportedPaidAmount),
          verifiedAt: now,
          gatewayResponse: verified.raw || verified,
        },
        $unset: { activeIdempotencyKey: 1 },
        $push: {
          events: {
            $each: [
              formatEvent(
                "verified_locked",
                source,
                `Verified via PayStation ${verification.apiVersion}`,
                { trxId: verified.trxId, paidAmount: Number(reportedPaidAmount) }
              ),
            ],
            $slice: -MAX_EVENTS,
          },
        },
      },
      { new: true }
    );

    if (!lockedTx) {
      let latest = await deps.PaymentTransactionModel.findOne({
        invoiceNumber: cleanedInvoice,
      });

      for (let attempt = 0; attempt < 3; attempt++) {
        if (latest?.status === PAYMENT_STATUS.COMPLETED && latest.fulfilledAt) {
          return {
            outcome: "completed",
            alreadyProcessed: true,
            transaction: latest,
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
        latest = await deps.PaymentTransactionModel.findOne({
          invoiceNumber: cleanedInvoice,
        });
      }

      if (latest?.status === PAYMENT_STATUS.COMPLETED && latest.fulfilledAt) {
        return {
          outcome: "completed",
          alreadyProcessed: true,
          transaction: latest,
        };
      }

      return {
        outcome: latest?.status || "processing",
        alreadyProcessed: false,
        transaction: latest || tx,
      };
    }

    try {
      // 8a. Replay guard: reject if trxId is already attached to a DIFFERENT invoice
      const cleanTrxId = String(verified.trxId).trim();
      const duplicateTrx = await deps.AppPaymentModel.findOne({
        trxID: cleanTrxId,
      });

      if (duplicateTrx && duplicateTrx.paymentID !== cleanedInvoice) {
        const replayReason = "Duplicate gateway trxId detected for a different invoice";
        console.error("🚨 Security Alert - Gateway TrxID Replay Detected:", {
          invoiceNumber: cleanedInvoice,
          existingInvoice: duplicateTrx.paymentID,
          trxId: cleanTrxId,
        });

        const failedTx = await deps.PaymentTransactionModel.findOneAndUpdate(
          { _id: lockedTx._id },
          {
            $set: {
              status: PAYMENT_STATUS.FAILED,
              processingStartedAt: null,
              failureReason: replayReason,
            },
            $push: {
              events: {
                $each: [formatEvent("trx_replay_blocked", source, replayReason)],
                $slice: -MAX_EVENTS,
              },
            },
          },
          { new: true }
        );

        emitNotificationAsync(() =>
          deps.notificationService.notifyAdmins({
            type: "security.payment_trx_replay",
            category: NOTIFICATION_CATEGORIES.SECURITY,
            priority: NOTIFICATION_PRIORITIES.URGENT,
            forceDeliver: true,
            sendEmail: true,
            title: "Payment Security Alert: TrxID Replay Blocked",
            message: `Blocked duplicate gateway trxId ${cleanTrxId} on invoice ${cleanedInvoice} (already attached to ${duplicateTrx.paymentID}).`,
            actionUrl: "/admin/payments",
            actionLabel: "Inspect Security Logs",
            dedupeKey: `payment_security:trx_replay:${cleanedInvoice}`,
            metadata: {
              invoiceNumber: cleanedInvoice,
              existingInvoice: duplicateTrx.paymentID,
              trxId: cleanTrxId,
            },
          })
        );

        return {
          outcome: "failed",
          transaction: failedTx || lockedTx,
        };
      }

      // Create or reuse authoritative AppPayment ledger entry
      let appPayment = duplicateTrx;
      if (!appPayment) {
        appPayment = await deps.AppPaymentModel.findOne({
          paymentID: cleanedInvoice,
        });
      }

      if (!appPayment) {
        try {
          appPayment = await deps.AppPaymentModel.create({
            userId: lockedTx.userId,
            paymentID: cleanedInvoice,
            trxID: cleanTrxId,
            transactionId: lockedTx._id,
            gateway: PAYMENT_GATEWAYS.PAYSTATION,
            paymentMethod: verified.paymentMethod || null,
            plan: {
              id: lockedTx.plan.id,
              name: lockedTx.plan.name,
              type: lockedTx.plan.type,
            },
            amount: lockedTx.pricing.expectedAmount,
            currency: lockedTx.pricing.currency || "BDT",
            status: "Completed",
            paymentDetails: {
              invoiceNumber: cleanedInvoice,
              trxId: cleanTrxId,
              trxStatus: verified.trxStatus,
              paymentAmount: Number(reportedPaidAmount),
              requestAmount: verified.requestAmount ?? lockedTx.pricing.expectedAmount,
              trxAmount: verified.trxAmount ?? Number(reportedPaidAmount),
              paymentMethod: verified.paymentMethod || null,
              payerMobileNo: verified.payerMobileNo || null,
              orderDateTime: verified.orderDateTime || null,
              verifiedVia: verification.apiVersion,
              source,
            },
          });
        } catch (err) {
          if (err?.code === 11000) {
            appPayment = await deps.AppPaymentModel.findOne({
              paymentID: cleanedInvoice,
            });
          } else {
            throw err;
          }
        }
      }

      if (!appPayment) {
        throw new Error("Failed to create or retrieve AppPayment record");
      }

      await deps.PaymentTransactionModel.updateOne(
        { _id: lockedTx._id },
        {
          $set: {
            appPaymentId: appPayment._id,
            "fulfillmentSteps.paymentRecorded": true,
          },
        }
      );

      // 8b. Update user plan (idempotent step check + snapshot fallback)
      if (!lockedTx.fulfillmentSteps?.planUpdated) {
        const updated = await deps.planService.updateUserPlan(
          lockedTx.userId,
          lockedTx.plan.id,
          null,
          {
            allowInactivePlan: true,
            planSnapshot: lockedTx.plan,
          }
        );

        if (!updated) {
          throw new Error("Failed to activate user plan");
        }

        await deps.PaymentTransactionModel.updateOne(
          { _id: lockedTx._id },
          { $set: { "fulfillmentSteps.planUpdated": true } }
        );
      }

      // 8c. Process referral reward (non-fatal)
      if (!lockedTx.fulfillmentSteps?.referralProcessed) {
        await deps.planService.processReferralReward(lockedTx.userId, {
          paymentId: appPayment._id,
        });
        await deps.PaymentTransactionModel.updateOne(
          { _id: lockedTx._id },
          { $set: { "fulfillmentSteps.referralProcessed": true } }
        );
      }

      // 8d. Record promo code redemption
      if (lockedTx.promoCode?.id && !lockedTx.fulfillmentSteps?.promoRecorded) {
        await deps.planService.recordPromoCodeUsage(
          lockedTx.userId,
          lockedTx.promoCode.id,
          {
            paymentId: appPayment._id,
            discountAmount: lockedTx.pricing?.promoDiscountAmount || 0,
          }
        );
        await deps.PaymentTransactionModel.updateOne(
          { _id: lockedTx._id },
          { $set: { "fulfillmentSteps.promoRecorded": true } }
        );
      }

      // 8e. Finalize transaction as completed
      const completedAt = deps.nowFn();
      const completedTx = await deps.PaymentTransactionModel.findOneAndUpdate(
        { _id: lockedTx._id },
        {
          $set: {
            status: PAYMENT_STATUS.COMPLETED,
            fulfilledAt: completedAt,
            processingStartedAt: null,
            failureReason: null,
          },
          $push: {
            events: {
              $each: [
                formatEvent(
                  "fulfilled",
                  source,
                  "Payment verified and plan activated",
                  { appPaymentId: appPayment._id.toString() }
                ),
              ],
              $slice: -MAX_EVENTS,
            },
          },
        },
        { new: true }
      );

      // 8f. Fire-and-forget receipt email
      if (!lockedTx.fulfillmentSteps?.emailSent) {
        Promise.resolve()
          .then(async () => {
            const recipientEmail = lockedTx.customer?.email;
            const recipientName = lockedTx.customer?.name;
            if (!recipientEmail) return;

            await deps.sendPaymentEmail({
              email: recipientEmail,
              name: recipientName,
              invoiceNumber: cleanedInvoice,
              trxId: cleanTrxId,
              amount: lockedTx.pricing.expectedAmount,
              currency: lockedTx.pricing.currency || "BDT",
              planName: lockedTx.plan.name,
              planType: lockedTx.plan.type,
              planDuration: lockedTx.plan.planDuration,
              credit: lockedTx.plan.credit,
              paymentMethod: verified.paymentMethod || "PayStation",
              paidAt: completedAt,
            });

            await deps.PaymentTransactionModel.updateOne(
              { _id: lockedTx._id },
              { $set: { "fulfillmentSteps.emailSent": true } }
            );
          })
          .catch((emailErr) => {
            console.error(
              "[PaymentService] Receipt email background error:",
              emailErr?.message || emailErr
            );
          });
      }

      // 8g. In-app & admin notifications for fulfilled payment
      emitNotificationAsync(async () => {
        const amountLabel = `৳${Number(lockedTx.pricing?.expectedAmount || 0).toLocaleString("en-US")}`;
        await Promise.all([
          deps.notificationService.notifyUser({
            recipientId: lockedTx.userId,
            recipientEmail: lockedTx.customer?.email || null,
            recipientName: lockedTx.customer?.name || null,
            type: "payment.completed",
            category: NOTIFICATION_CATEGORIES.BILLING,
            priority: NOTIFICATION_PRIORITIES.HIGH,
            title: "Payment Confirmed & Plan Activated",
            message: `Your payment of ${amountLabel} (${cleanedInvoice}) succeeded and ${lockedTx.plan?.name || "your plan"} is now active.`,
            actionUrl: "/dashboard",
            actionLabel: "Open Dashboard",
            dedupeKey: `payment_completed:${cleanedInvoice}`,
            metadata: {
              invoiceNumber: cleanedInvoice,
              trxId: cleanTrxId,
              amount: lockedTx.pricing?.expectedAmount,
              planName: lockedTx.plan?.name,
            },
          }),
          deps.notificationService.notifyAdmins({
            type: "admin.payment_received",
            category: NOTIFICATION_CATEGORIES.BILLING,
            priority: NOTIFICATION_PRIORITIES.NORMAL,
            title: "New Payment Received",
            message: `${lockedTx.customer?.name || lockedTx.customer?.email || "A customer"} paid ${amountLabel} for ${lockedTx.plan?.name || "a plan"} (${cleanedInvoice}).`,
            actionUrl: "/admin/payments",
            actionLabel: "View Payments",
            dedupeKey: `admin_payment_completed:${cleanedInvoice}`,
            actor: {
              userId: lockedTx.userId,
              name: lockedTx.customer?.name || null,
              email: lockedTx.customer?.email || null,
            },
            metadata: {
              invoiceNumber: cleanedInvoice,
              trxId: cleanTrxId,
              amount: lockedTx.pricing?.expectedAmount,
              planName: lockedTx.plan?.name,
            },
          }),
        ]);
      });

      return {
        outcome: "completed",
        alreadyProcessed: false,
        transaction: completedTx || lockedTx,
      };
    } catch (fulfillmentError) {
      console.error("❌ Payment fulfillment error:", {
        invoiceNumber: cleanedInvoice,
        error: fulfillmentError.message,
      });

      emitNotificationAsync(() =>
        deps.notificationService.notifyAdmins({
          type: "admin.payment_fulfillment_error",
          category: NOTIFICATION_CATEGORIES.BILLING,
          priority: NOTIFICATION_PRIORITIES.URGENT,
          forceDeliver: true,
          title: "Payment Fulfillment Error",
          message: `Verified payment ${cleanedInvoice} encountered a fulfillment error: ${fulfillmentError.message}`,
          actionUrl: "/admin/payments",
          actionLabel: "Resolve Payment",
          dedupeKey: `payment_fulfill_err:${cleanedInvoice}`,
          metadata: {
            invoiceNumber: cleanedInvoice,
            error: fulfillmentError.message,
          },
        })
      );

      await deps.PaymentTransactionModel.updateOne(
        { _id: lockedTx._id },
        {
          $set: {
            status: PAYMENT_STATUS.PENDING,
            processingStartedAt: null,
            failureReason: fulfillmentError.message,
          },
          $push: {
            events: {
              $each: [
                formatEvent(
                  "fulfillment_error",
                  source,
                  fulfillmentError.message || "Fulfillment failed"
                ),
              ],
              $slice: -MAX_EVENTS,
            },
          },
        }
      );

      return {
        outcome: "fulfillment_error",
        error: fulfillmentError.message,
        transaction: await deps.PaymentTransactionModel.findById(lockedTx._id),
      };
    }
  }

  /**
   * Sweep pending/initiated transactions older than 2 minutes and reconcile against PayStation.
   */
  async function reconcilePendingTransactions({ limit = 20 } = {}) {
    if (!deps.paystation.isPaystationConfigured()) {
      return {
        skipped: true,
        reason: "PayStation gateway not configured",
        checked: 0,
        completed: 0,
        failed: 0,
        canceled: 0,
        expired: 0,
        pending: 0,
        errors: 0,
      };
    }

    if (isReconciling) {
      return {
        skipped: true,
        reason: "Reconciliation already in progress",
        checked: 0,
        completed: 0,
        failed: 0,
        canceled: 0,
        expired: 0,
        pending: 0,
        errors: 0,
      };
    }

    isReconciling = true;
    const summary = {
      skipped: false,
      checked: 0,
      completed: 0,
      failed: 0,
      canceled: 0,
      expired: 0,
      pending: 0,
      errors: 0,
    };

    try {
      const now = deps.nowFn();
      const minCutoff = new Date(now.getTime() - RECONCILIATION_MIN_AGE_MS);
      const maxCutoff = new Date(now.getTime() - RECONCILIATION_MAX_AGE_MS);

      const candidates = await deps.PaymentTransactionModel.find({
        status: { $in: [PAYMENT_STATUS.INITIATED, PAYMENT_STATUS.PENDING] },
        createdAt: { $lte: minCutoff, $gte: maxCutoff },
      })
        .sort({ createdAt: 1 })
        .limit(limit);

      for (const candidate of candidates) {
        summary.checked += 1;
        try {
          const result = await verifyAndFulfillTransaction(
            candidate.invoiceNumber,
            { source: "reconciliation" }
          );
          if (result.outcome === "completed") summary.completed += 1;
          else if (result.outcome === "failed") summary.failed += 1;
          else if (result.outcome === "canceled") summary.canceled += 1;
          else if (result.outcome === "expired") summary.expired += 1;
          else if (result.outcome === "pending") summary.pending += 1;
          else summary.errors += 1;
        } catch {
          summary.errors += 1;
        }
      }

      // Sweep abandoned >24h intents cleanly (attempt final verify on pending ones first)
      const ancientCandidates = await deps.PaymentTransactionModel.find({
        status: { $in: [PAYMENT_STATUS.INITIATED, PAYMENT_STATUS.PENDING] },
        createdAt: { $lt: maxCutoff },
      })
        .sort({ createdAt: 1 })
        .limit(limit);

      for (const oldTx of ancientCandidates) {
        if (oldTx.status === PAYMENT_STATUS.PENDING) {
          summary.checked += 1;
          try {
            const res = await verifyAndFulfillTransaction(oldTx.invoiceNumber, {
              source: "reconciliation",
            });
            if (res.outcome === "completed") {
              summary.completed += 1;
              continue;
            }
          } catch {
            // Fall through to expiration if gateway is unreachable after 24h
          }
        }

        const expired = await deps.PaymentTransactionModel.updateOne(
          {
            _id: oldTx._id,
            fulfilledAt: null,
            status: { $in: [PAYMENT_STATUS.INITIATED, PAYMENT_STATUS.PENDING] },
          },
          {
            $set: {
              status: PAYMENT_STATUS.EXPIRED,
              failureReason: "Payment intent abandoned past 24 hours",
            },
            $unset: { activeIdempotencyKey: 1 },
            $push: {
              events: {
                $each: [
                  formatEvent(
                    "expired",
                    "reconciliation",
                    "Stale transaction expired during 24h cleanup"
                  ),
                ],
                $slice: -MAX_EVENTS,
              },
            },
          }
        );
        if (expired.modifiedCount > 0) {
          summary.expired += 1;
        }
      }

      return summary;
    } finally {
      isReconciling = false;
    }
  }

  return {
    createCheckoutSession,
    verifyAndFulfillTransaction,
    reconcilePendingTransactions,
  };
}

export const paymentService = createPaymentService();
export default paymentService;
