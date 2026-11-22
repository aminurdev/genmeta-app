import express from "express";
import {
  authenticateAndVerifyAdmin,
  verifyUser,
} from "../middlewares/auth.middleware.js";
import {
  paymentCallbackLimiter,
  paymentInitiateLimiter,
  paymentStatusLimiter,
  paymentWebhookLimiter,
} from "../middlewares/rate.limit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createPaystationPaymentSchema,
  paymentInvoiceParamSchema,
} from "../validations/index.js";
import {
  createPaystationPayment,
  getAdminPaymentTransactions,
  getMyPaymentTransactions,
  getPaymentStatus,
  handlePaystationCallback,
  handlePaystationIpn,
  reconcilePaymentByInvoice,
  reconcilePendingPayments,
  verifyPaystationTrx,
} from "../controllers/appPaymentPaystation.controller.js";

const router = express.Router();

// Checkout initiation (authenticated + rate-limited + Zod validated)
router.post(
  "/create-paystation-payment",
  verifyUser,
  paymentInitiateLimiter,
  validate(createPaystationPaymentSchema),
  createPaystationPayment
);

// PayStation customer redirect callback (supports GET and POST)
router.get("/paystation-callback", paymentCallbackLimiter, handlePaystationCallback);
router.post("/paystation-callback", paymentCallbackLimiter, handlePaystationCallback);

// PayStation server-to-server IPN webhook
router.post("/paystation-ipn", paymentWebhookLimiter, handlePaystationIpn);
router.post("/ipn", paymentWebhookLimiter, handlePaystationIpn);

// Authenticated customer payment status & history
router.get(
  "/status/:invoiceNumber",
  verifyUser,
  paymentStatusLimiter,
  validate(paymentInvoiceParamSchema, "params"),
  getPaymentStatus
);
router.get(
  "/my-transactions",
  verifyUser,
  paymentStatusLimiter,
  getMyPaymentTransactions
);

// Admin payment audit, verification, and reconciliation endpoints
router.get(
  "/admin/transactions",
  authenticateAndVerifyAdmin,
  getAdminPaymentTransactions
);
router.post(
  "/admin/reconcile/:invoiceNumber",
  authenticateAndVerifyAdmin,
  validate(paymentInvoiceParamSchema, "params"),
  reconcilePaymentByInvoice
);
router.post(
  "/admin/reconcile-pending",
  authenticateAndVerifyAdmin,
  reconcilePendingPayments
);
router.get(
  "/admin/verify-trx/:trxId",
  authenticateAndVerifyAdmin,
  verifyPaystationTrx
);

export default router;
