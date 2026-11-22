import mongoose from "mongoose";
import { PAYMENT_STATUS, USER_ROLES } from "../constants/index.js";
import { AppPayment } from "../models/appPayment.model.js";
import { PaymentTransaction } from "../models/paymentTransaction.model.js";
import {
  logger,
  processSuccessfulPaystationPayment,
  redirectToPricing,
} from "../services/app/app.service.js";
import paymentService, {
  sanitizeTransactionForClient,
} from "../services/payment/payment.service.js";
import { checkTransactionStatusByTrxId } from "../services/paystation/paystation.service.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const escapeRegex = (str) =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function extractGatewayParams(req) {
  const source =
    req.body && typeof req.body === "object" && Object.keys(req.body).length > 0
      ? { ...req.query, ...req.body }
      : req.query || {};

  const invoiceNumber = String(
    source.invoice_number || source.invoiceNumber || ""
  ).trim();
  const status = String(source.status || source.trx_status || "").trim();
  const trxId = String(source.trx_id || source.trxId || "").trim();

  return {
    invoiceNumber,
    status: status || null,
    trxId: trxId || null,
  };
}

export const createPaystationPayment = asyncHandler(async (req, res) => {
  const { planId, promoCode, customerPhone, idempotencyKey } = req.body;
  const headerIdempotencyKey = req.headers["idempotency-key"];
  const effectiveKey =
    (typeof headerIdempotencyKey === "string" && headerIdempotencyKey.trim()) ||
    idempotencyKey ||
    null;

  const session = await paymentService.createCheckoutSession({
    userId: req.user._id,
    planId,
    promoCode: promoCode || null,
    customerPhone: customerPhone || null,
    idempotencyKey: effectiveKey,
  });

  if (!session?.paymentUrl) {
    throw new ApiError(500, "Failed to initiate PayStation payment");
  }

  return new ApiResponse(
    200,
    true,
    "PayStation payment initiated successfully",
    session
  ).send(res);
});

export const handlePaystationCallback = asyncHandler(async (req, res) => {
  const { invoiceNumber, status, trxId } = extractGatewayParams(req);

  if (!invoiceNumber) {
    logger.error("Missing invoice_number in PayStation callback", {
      queryKeys: Object.keys(req.query || {}),
    });
    return redirectToPricing(res, "Payment failed", "invalid_parameters");
  }

  return await processSuccessfulPaystationPayment(invoiceNumber, res, {
    status,
    trxId,
  });
});

export const handlePaystationIpn = asyncHandler(async (req, res) => {
  const { invoiceNumber, status, trxId } = extractGatewayParams(req);

  if (!invoiceNumber) {
    throw new ApiError(400, "Missing invoice_number in IPN payload");
  }

  const result = await paymentService.verifyAndFulfillTransaction(
    invoiceNumber,
    {
      source: "ipn",
      gatewayHints: { status, trxId },
    }
  );

  return res.status(200).json({
    success: true,
    status: "received",
    invoiceNumber,
    outcome: result.outcome,
  });
});

export const getPaymentStatus = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  const { invoiceNumber } = req.params;
  const shouldRefresh =
    req.query.refresh === "true" || req.query.refresh === "1";

  const isAdmin =
    req.user.role === USER_ROLES.ADMIN ||
    req.user.role === USER_ROLES.SUPER_ADMIN;

  let tx = await PaymentTransaction.findOne({ invoiceNumber });

  if (!tx) {
    const legacy = await AppPayment.findOne({ paymentID: invoiceNumber }).lean();
    if (!legacy) {
      throw new ApiError(404, "Payment transaction not found");
    }

    if (!isAdmin && legacy.userId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You do not have permission to view this payment");
    }

    return new ApiResponse(200, true, "Payment status retrieved", {
      transaction: sanitizeTransactionForClient(
        {
          _id: legacy._id,
          invoiceNumber: legacy.paymentID,
          gateway: legacy.gateway,
          status: PAYMENT_STATUS.COMPLETED,
          trxId: legacy.trxID,
          paymentMethod:
            legacy.paymentMethod || legacy.paymentDetails?.paymentMethod || null,
          payerMobileNo: legacy.paymentDetails?.payerMobileNo || null,
          plan: legacy.plan,
          pricing: {
            basePrice: legacy.amount,
            priceAfterPlanDiscount: legacy.amount,
            planDiscountAmount: 0,
            promoDiscountAmount: 0,
            expectedAmount: legacy.amount,
            paidAmount: legacy.amount,
            currency: legacy.currency || "BDT",
            payWithCharge: 0,
          },
          fulfilledAt: legacy.createdAt,
          createdAt: legacy.createdAt,
          updatedAt: legacy.updatedAt,
        },
        { isAdmin }
      ),
    }).send(res);
  }

  if (!isAdmin && tx.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to view this payment");
  }

  const isVerifiableState = [
    PAYMENT_STATUS.INITIATED,
    PAYMENT_STATUS.PENDING,
  ].includes(tx.status);

  if (isVerifiableState && (shouldRefresh || !tx.fulfilledAt)) {
    const verificationResult = await paymentService.verifyAndFulfillTransaction(
      invoiceNumber,
      { source: "status_poll" }
    );
    if (verificationResult.transaction) {
      tx = verificationResult.transaction;
    }
  }

  return new ApiResponse(200, true, "Payment status retrieved", {
    transaction: sanitizeTransactionForClient(tx, { isAdmin }),
  }).send(res);
});

export const getMyPaymentTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = { userId: req.user._id };
  if (status && Object.values(PAYMENT_STATUS).includes(String(status))) {
    filter.status = String(status);
  }

  const [rows, total] = await Promise.all([
    PaymentTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    PaymentTransaction.countDocuments(filter),
  ]);

  return new ApiResponse(200, true, "Transactions retrieved successfully", {
    transactions: rows.map((row) =>
      sanitizeTransactionForClient(row, { isAdmin: false })
    ),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  }).send(res);
});

export const getAdminPaymentTransactions = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  const {
    page = 1,
    limit = 20,
    status = "all",
    search = "",
    startDate,
    endDate,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (
    status &&
    status !== "all" &&
    Object.values(PAYMENT_STATUS).includes(String(status))
  ) {
    filter.status = String(status);
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const trimmedSearch = String(search || "").trim();
  if (trimmedSearch) {
    const safeSearch = escapeRegex(trimmedSearch);
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ],
    })
      .select("_id")
      .lean();
    const userIds = matchingUsers.map((u) => u._id);

    const orClauses = [
      { invoiceNumber: { $regex: safeSearch, $options: "i" } },
      { trxId: { $regex: safeSearch, $options: "i" } },
      { "customer.email": { $regex: safeSearch, $options: "i" } },
    ];
    if (userIds.length > 0) {
      orClauses.push({ userId: { $in: userIds } });
    }
    if (mongoose.Types.ObjectId.isValid(trimmedSearch)) {
      orClauses.push({ _id: new mongoose.Types.ObjectId(trimmedSearch) });
    }
    filter.$or = orClauses;
  }

  const [transactions, total, statusSummaryRows] = await Promise.all([
    PaymentTransaction.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    PaymentTransaction.countDocuments(filter),
    PaymentTransaction.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const statusSummary = {};
  for (const row of statusSummaryRows) {
    if (row?._id) {
      statusSummary[row._id] = row.count || 0;
    }
  }

  return new ApiResponse(
    200,
    true,
    "Payment transactions retrieved successfully",
    {
      transactions: transactions.map((t) =>
        sanitizeTransactionForClient(t, { isAdmin: true })
      ),
      statusSummary,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    }
  ).send(res);
});

export const reconcilePaymentByInvoice = asyncHandler(async (req, res) => {
  const { invoiceNumber } = req.params;
  const result = await paymentService.verifyAndFulfillTransaction(
    invoiceNumber,
    { source: "admin_reconcile" }
  );

  if (result.outcome === "not_found") {
    throw new ApiError(404, "Payment transaction not found");
  }

  return new ApiResponse(200, true, "Payment reconciliation processed", {
    outcome: result.outcome,
    alreadyProcessed: Boolean(result.alreadyProcessed),
    error: result.error || null,
    transaction: sanitizeTransactionForClient(result.transaction, {
      isAdmin: true,
    }),
  }).send(res);
});

export const reconcilePendingPayments = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const summary = await paymentService.reconcilePendingTransactions({ limit });

  return new ApiResponse(
    200,
    true,
    "Pending payment reconciliation sweep completed",
    summary
  ).send(res);
});

export const verifyPaystationTrx = asyncHandler(async (req, res) => {
  const { trxId } = req.params;
  const cleanedTrx = String(trxId || "").trim();
  if (!cleanedTrx) {
    throw new ApiError(400, "Transaction ID is required");
  }

  const gatewayResult = await checkTransactionStatusByTrxId(cleanedTrx);

  return new ApiResponse(200, true, "PayStation transaction lookup completed", {
    found: gatewayResult.found,
    apiVersion: gatewayResult.apiVersion,
    message: gatewayResult.message,
    data: gatewayResult.data,
  }).send(res);
});
