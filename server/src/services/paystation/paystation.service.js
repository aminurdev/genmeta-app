import axios from "axios";
import ApiError from "../../utils/api.error.js";
import config from "../../config/index.js";

const TRANSIENT_ERROR_CODES = new Set([
  "ECONNABORTED",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EPIPE",
]);

function getPaystationConfig() {
  return config.paystation;
}

/**
 * Create a configured Axios client for PayStation REST API calls.
 */
export function createPaystationHttpClient(options = {}) {
  const psConfig = getPaystationConfig();
  return axios.create({
    baseURL: (options.baseUrl || psConfig.base_url || "").replace(/\/+$/, ""),
    timeout: options.timeoutMs || psConfig.timeout_ms || 15000,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "GenMeta-PayStation-Client/2.0",
    },
  });
}

const defaultHttpClient = createPaystationHttpClient();

/**
 * Check whether essential PayStation credentials and URLs are configured.
 */
export function isPaystationConfigured() {
  const ps = getPaystationConfig();
  return Boolean(
    ps?.base_url &&
      ps?.merchant_id &&
      ps?.password &&
      ps?.callback_url
  );
}

/**
 * Assert PayStation configuration before executing gateway calls.
 */
export function assertPaystationConfigured() {
  if (!isPaystationConfigured()) {
    throw new ApiError(
      503,
      "Payment gateway is temporarily unavailable due to incomplete configuration.",
      [],
      "",
      { code: "PAYMENT_GATEWAY_NOT_CONFIGURED" }
    );
  }
}

/**
 * Evaluate PayStation REST API response envelope success.
 * PayStation returns status_code as either string "200" or number 200.
 */
export function isGatewayApiSuccess(data) {
  if (!data || typeof data !== "object") return false;
  return (
    String(data.status_code) === "200" &&
    String(data.status || "")
      .trim()
      .toLowerCase() === "success"
  );
}

/**
 * Normalize PayStation transaction statuses across v1, v2, callback, and IPN payloads.
 * @returns {"success"|"failed"|"canceled"|"pending"|"refunded"|"unknown"}
 */
export function normalizeTransactionStatus(rawStatus) {
  const s = String(rawStatus || "")
    .trim()
    .toLowerCase();
  if (!s) return "unknown";

  if (["success", "successful", "completed", "paid"].includes(s)) {
    return "success";
  }
  if (["failed", "fail", "declined", "error"].includes(s)) {
    return "failed";
  }
  if (["canceled", "cancelled", "cancel"].includes(s)) {
    return "canceled";
  }
  if (["pending", "processing", "initiated", "in_progress"].includes(s)) {
    return "pending";
  }
  if (["refund", "refunded"].includes(s)) {
    return "refunded";
  }
  return "unknown";
}

/**
 * Normalize Bangladeshi mobile phone numbers to 01XXXXXXXXX for PayStation's cust_phone field.
 */
export function sanitizeBdPhone(phone, fallback = getPaystationConfig().default_phone) {
  const raw = String(phone || "").replace(/[\s\-()]/g, "");
  let normalized = raw;
  if (normalized.startsWith("+88")) {
    normalized = normalized.slice(3);
  } else if (normalized.startsWith("8801")) {
    normalized = normalized.slice(2);
  }

  if (/^01[3-9]\d{8}$/.test(normalized)) {
    return normalized;
  }

  const fb = String(fallback || "01700000000").replace(/[\s\-()]/g, "");
  return /^01[3-9]\d{8}$/.test(fb) ? fb : "01700000000";
}

/**
 * Round monetary BDT values cleanly to 2 decimal places.
 */
export function roundBdtAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return NaN;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Validate checkout redirect URL returned by PayStation to prevent open redirects or tampering.
 */
export function isValidPaystationUrl(url, configuredBaseUrl = getPaystationConfig().base_url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    let baseProtocol = "https:";
    let baseHost = "";

    if (configuredBaseUrl) {
      try {
        const baseParsed = new URL(configuredBaseUrl);
        baseProtocol = baseParsed.protocol;
        baseHost = baseParsed.hostname.toLowerCase();
      } catch {
        // ignore invalid base url fallback
      }
    }

    const protocolAllowed =
      parsed.protocol === "https:" ||
      (baseProtocol === "http:" && parsed.protocol === "http:");
    if (!protocolAllowed) return false;

    const host = parsed.hostname.toLowerCase();
    return (
      host === "paystation.com.bd" ||
      host.endsWith(".paystation.com.bd") ||
      (Boolean(baseHost) && host === baseHost)
    );
  } catch {
    return false;
  }
}

/**
 * Extract safe error details without leaking merchantId, password, or request config.
 */
export function sanitizePaystationError(error) {
  if (!error) {
    return { statusCode: 500, gatewayCode: null, message: "Unknown PayStation error", isTransient: false };
  }

  const responseData = error.response?.data;
  const httpStatus = error.response?.status || null;
  const gatewayCode =
    responseData && responseData.status_code !== undefined
      ? String(responseData.status_code)
      : null;
  const message =
    (responseData && typeof responseData === "object" && responseData.message) ||
    error.message ||
    "PayStation service unavailable";

  const isTransient = Boolean(
    TRANSIENT_ERROR_CODES.has(error.code) ||
      (httpStatus && (httpStatus >= 500 || httpStatus === 429))
  );

  return {
    statusCode: httpStatus || 502,
    gatewayCode,
    message: String(message),
    isTransient,
  };
}

/**
 * Retry wrapper strictly for idempotent read/verification requests.
 */
export async function withReadRetry(
  fn,
  { maxRetries = 2, baseDelayMs = 300 } = {}
) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError) {
        throw error;
      }

      const info = sanitizePaystationError(error);
      if (!info.isTransient || attempt >= maxRetries) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

function mapGatewayErrorToApiError(data, fallbackStatus = 502, fallbackMessage = "PayStation request failed") {
  const gatewayCode = data?.status_code !== undefined ? String(data.status_code) : "";
  const gatewayMessage = data?.message ? String(data.message) : fallbackMessage;

  if (gatewayCode === "1008") {
    return new ApiError(409, "Duplicate invoice number. Please retry checkout.", [], "", {
      code: "PAYSTATION_DUPLICATE_INVOICE",
      data: { gatewayCode },
    });
  }

  if (gatewayCode === "2001") {
    return new ApiError(502, "Payment gateway authentication failed", [], "", {
      code: "PAYSTATION_AUTH_FAILED",
      data: { gatewayCode },
    });
  }

  const numericCode = Number(gatewayCode);
  const httpStatus =
    Number.isInteger(numericCode) && numericCode >= 400 && numericCode < 600
      ? numericCode
      : fallbackStatus;

  return new ApiError(httpStatus, gatewayMessage, [], "", {
    code: "PAYSTATION_GATEWAY_ERROR",
    data: gatewayCode ? { gatewayCode } : undefined,
  });
}

function serializeOptionalParam(value) {
  if (value === undefined || value === null || value === "") return undefined;
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

/**
 * Initiate Payment with PayStation (/initiate-payment)
 * Never auto-retried because initiating payment is non-idempotent on the gateway.
 */
export async function initiatePayment(
  {
    invoiceNumber,
    amount,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress = "N/A",
    reference = "",
    checkoutItems = "",
    optA = "",
    optB = "",
    optC = "",
    payWithCharge,
    callbackUrl,
  },
  options = {}
) {
  assertPaystationConfigured();

  const psConfig = getPaystationConfig();
  const client = options.httpClient || defaultHttpClient;
  const normalizedAmount = roundBdtAmount(amount);

  if (
    !invoiceNumber ||
    !Number.isFinite(normalizedAmount) ||
    normalizedAmount <= 0 ||
    !customerName ||
    !customerEmail
  ) {
    throw new ApiError(400, "Missing or invalid required payment initiation fields");
  }

  const resolvedPayWithCharge =
    payWithCharge !== undefined
      ? Number(payWithCharge) === 1
        ? 1
        : 0
      : psConfig.pay_with_charge === 1
        ? 1
        : 0;

  const resolvedPhone = sanitizeBdPhone(customerPhone, psConfig.default_phone);
  const resolvedCallback = String(callbackUrl || psConfig.callback_url).trim();

  const payload = {
    merchantId: psConfig.merchant_id,
    password: psConfig.password,
    invoice_number: String(invoiceNumber).trim(),
    currency: "BDT",
    payment_amount: normalizedAmount,
    pay_with_charge: resolvedPayWithCharge,
    reference: String(reference || `Payment for ${invoiceNumber}`).trim(),
    cust_name: String(customerName).trim().slice(0, 100),
    cust_phone: resolvedPhone,
    cust_email: String(customerEmail).trim(),
    cust_address: String(customerAddress || "N/A").trim().slice(0, 200),
    callback_url: resolvedCallback,
    checkout_items:
      typeof checkoutItems === "object"
        ? JSON.stringify(checkoutItems)
        : String(checkoutItems || ""),
  };

  const sOptA = serializeOptionalParam(optA);
  const sOptB = serializeOptionalParam(optB);
  const sOptC = serializeOptionalParam(optC);
  if (sOptA !== undefined) payload.opt_a = sOptA;
  if (sOptB !== undefined) payload.opt_b = sOptB;
  if (sOptC !== undefined) payload.opt_c = sOptC;

  try {
    console.log("🚀 Initiating PayStation payment...", {
      invoice_number: payload.invoice_number,
      amount: normalizedAmount,
      pay_with_charge: resolvedPayWithCharge,
    });

    const { data } = await client.post("/initiate-payment", payload);

    if (!isGatewayApiSuccess(data)) {
      console.error("❌ PayStation payment initiation rejected:", {
        invoice_number: payload.invoice_number,
        status_code: data?.status_code,
        status: data?.status,
        message: data?.message,
      });
      throw mapGatewayErrorToApiError(data, 502, "Failed to initiate PayStation payment");
    }

    if (!isValidPaystationUrl(data.payment_url, psConfig.base_url)) {
      console.error("❌ PayStation returned invalid payment_url host", {
        invoice_number: payload.invoice_number,
      });
      throw new ApiError(502, "Payment gateway returned an invalid checkout URL", [], "", {
        code: "INVALID_GATEWAY_URL",
      });
    }

    console.log("✅ PayStation payment initiated successfully", {
      invoice_number: data.invoice_number || payload.invoice_number,
      payment_amount: data.payment_amount ?? normalizedAmount,
    });

    return {
      statusCode: String(data.status_code),
      status: String(data.status),
      message: data.message || "Payment link created successfully",
      paymentAmount: data.payment_amount ?? normalizedAmount,
      invoiceNumber: data.invoice_number || payload.invoice_number,
      paymentUrl: String(data.payment_url).trim(),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const safeErr = sanitizePaystationError(error);
    console.error("❌ PayStation initiation error:", {
      invoice_number: payload.invoice_number,
      statusCode: safeErr.statusCode,
      gatewayCode: safeErr.gatewayCode,
      message: safeErr.message,
    });

    if (safeErr.gatewayCode === "1008" || safeErr.gatewayCode === "2001") {
      throw mapGatewayErrorToApiError(
        error.response?.data,
        safeErr.statusCode,
        safeErr.message
      );
    }

    throw new ApiError(
      safeErr.isTransient ? 503 : 502,
      safeErr.message || "PayStation service unavailable",
      [],
      "",
      {
        code: safeErr.isTransient ? "PAYSTATION_UNAVAILABLE" : "PAYSTATION_REQUEST_FAILED",
      }
    );
  }
}

/**
 * Check Transaction Status by Invoice Number (v1 API: POST /transaction-status)
 * Returns { found: false } gracefully when PayStation responds with status_code 1006.
 */
export async function checkTransactionStatus(invoiceNumber, options = {}) {
  assertPaystationConfigured();

  const cleanedInvoice = String(invoiceNumber || "").trim();
  if (!cleanedInvoice) {
    throw new ApiError(400, "Invoice number is required");
  }

  const psConfig = getPaystationConfig();
  const client = options.httpClient || defaultHttpClient;

  try {
    const { data } = await withReadRetry(
      () =>
        client.post(
          "/transaction-status",
          { invoice_number: cleanedInvoice },
          {
            headers: {
              merchantId: psConfig.merchant_id,
            },
          }
        ),
      options.retryOptions
    );

    const gatewayCode = data?.status_code !== undefined ? String(data.status_code) : "";
    if (gatewayCode === "1006") {
      return {
        found: false,
        apiVersion: "v1",
        gatewayCode: "1006",
        statusCode: gatewayCode,
        status: data?.status || "failed",
        message: data?.message || "Transaction not found",
        data: null,
      };
    }

    if (!isGatewayApiSuccess(data) || !data?.data) {
      throw mapGatewayErrorToApiError(data, 502, "Failed to retrieve transaction status");
    }

    const txData = data.data;
    return {
      found: true,
      apiVersion: "v1",
      statusCode: String(data.status_code),
      status: String(data.status),
      message: data.message || "Transaction found",
      data: {
        invoiceNumber: txData.invoice_number || cleanedInvoice,
        trxStatus: txData.trx_status || null,
        normalizedStatus: normalizeTransactionStatus(txData.trx_status),
        trxId: txData.trx_id || null,
        paymentAmount:
          txData.payment_amount !== undefined && txData.payment_amount !== null
            ? Number(txData.payment_amount)
            : null,
        orderDateTime: txData.order_date_time || null,
        payerMobileNo: txData.payer_mobile_no || null,
        paymentMethod: txData.payment_method || null,
        reference: txData.reference || null,
        checkoutItems: txData.checkout_items || null,
        raw: txData,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const safeErr = sanitizePaystationError(error);
    if (safeErr.gatewayCode === "1006") {
      return {
        found: false,
        apiVersion: "v1",
        gatewayCode: "1006",
        statusCode: "1006",
        status: "failed",
        message: safeErr.message || "Transaction not found",
        data: null,
      };
    }

    console.error("❌ PayStation v1 status check error:", {
      invoiceNumber: cleanedInvoice,
      statusCode: safeErr.statusCode,
      gatewayCode: safeErr.gatewayCode,
      message: safeErr.message,
    });

    throw new ApiError(
      safeErr.isTransient ? 503 : 502,
      safeErr.message || "Failed to check transaction status",
      [],
      "",
      { code: "PAYSTATION_STATUS_CHECK_FAILED" }
    );
  }
}

/**
 * Check Transaction Status by Transaction ID (v2 API: POST /v2/transaction-status)
 * Returns { found: false } gracefully when PayStation responds with status_code 1006.
 */
export async function checkTransactionStatusByTrxId(trxId, options = {}) {
  assertPaystationConfigured();

  const cleanedTrxId = String(trxId || "").trim();
  if (!cleanedTrxId) {
    throw new ApiError(400, "Transaction ID is required");
  }

  const psConfig = getPaystationConfig();
  const client = options.httpClient || defaultHttpClient;

  try {
    const { data } = await withReadRetry(
      () =>
        client.post(
          "/v2/transaction-status",
          { trxId: cleanedTrxId },
          {
            headers: {
              merchantId: psConfig.merchant_id,
            },
          }
        ),
      options.retryOptions
    );

    const gatewayCode = data?.status_code !== undefined ? String(data.status_code) : "";
    if (gatewayCode === "1006") {
      return {
        found: false,
        apiVersion: "v2",
        gatewayCode: "1006",
        statusCode: gatewayCode,
        status: data?.status || "failed",
        message: data?.message || "Transaction not found",
        data: null,
      };
    }

    if (!isGatewayApiSuccess(data) || !data?.data) {
      throw mapGatewayErrorToApiError(data, 502, "Failed to retrieve transaction status");
    }

    const txData = data.data;
    const rawAmount = txData.payment_amount ?? txData.trx_amount;
    return {
      found: true,
      apiVersion: "v2",
      statusCode: String(data.status_code),
      status: String(data.status),
      message: data.message || "Transaction found",
      data: {
        invoiceNumber: txData.invoice_number || null,
        trxStatus: txData.trx_status || null,
        normalizedStatus: normalizeTransactionStatus(txData.trx_status),
        trxId: txData.trx_id || cleanedTrxId,
        trxAmount:
          txData.trx_amount !== undefined && txData.trx_amount !== null
            ? Number(txData.trx_amount)
            : null,
        trxDate: txData.trx_date || null,
        requestAmount:
          txData.request_amount !== undefined && txData.request_amount !== null
            ? Number(txData.request_amount)
            : null,
        paymentAmount:
          rawAmount !== undefined && rawAmount !== null ? Number(rawAmount) : null,
        orderDateTime: txData.order_date_time || null,
        payerMobileNo: txData.payer_mobile_no || null,
        paymentMethod: txData.payment_method || null,
        reference: txData.reference || null,
        raw: txData,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const safeErr = sanitizePaystationError(error);
    if (safeErr.gatewayCode === "1006") {
      return {
        found: false,
        apiVersion: "v2",
        gatewayCode: "1006",
        statusCode: "1006",
        status: "failed",
        message: safeErr.message || "Transaction not found",
        data: null,
      };
    }

    console.error("❌ PayStation v2 status check error:", {
      trxId: cleanedTrxId,
      statusCode: safeErr.statusCode,
      gatewayCode: safeErr.gatewayCode,
      message: safeErr.message,
    });

    throw new ApiError(
      safeErr.isTransient ? 503 : 502,
      safeErr.message || "Failed to check transaction status",
      [],
      "",
      { code: "PAYSTATION_V2_STATUS_CHECK_FAILED" }
    );
  }
}

/**
 * Unified server-to-server transaction verification with v1 primary lookup, v2 fallback,
 * and optional v2 enrichment (e.g. request_amount / trx_amount when payWithCharge === 1).
 */
export async function verifyTransaction(
  { invoiceNumber, trxId = null, enrichWithV2 = false },
  options = {}
) {
  let v1Result = null;
  let v1Error = null;

  if (invoiceNumber) {
    try {
      v1Result = await checkTransactionStatus(invoiceNumber, options);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 400) {
        throw error;
      }
      v1Error = error;
    }
  }

  if (v1Result?.found && v1Result.data) {
    const resolvedTrxId = v1Result.data.trxId || trxId;
    if (enrichWithV2 && resolvedTrxId) {
      try {
        const v2Result = await checkTransactionStatusByTrxId(resolvedTrxId, options);
        if (v2Result?.found && v2Result.data) {
          return {
            found: true,
            apiVersion: "v1+v2",
            statusCode: v1Result.statusCode,
            status: v1Result.status,
            message: v1Result.message,
            data: {
              ...v1Result.data,
              trxAmount: v2Result.data.trxAmount,
              trxDate: v2Result.data.trxDate,
              requestAmount: v2Result.data.requestAmount,
              paymentAmount: v1Result.data.paymentAmount ?? v2Result.data.paymentAmount,
              raw: {
                v1: v1Result.data.raw,
                v2: v2Result.data.raw,
              },
            },
          };
        }
      } catch {
        // Enrichment failure must not invalidate a valid v1 verification
      }
    }
    return v1Result;
  }

  if (trxId) {
    try {
      const v2Result = await checkTransactionStatusByTrxId(trxId, options);
      if (v2Result?.found) {
        return v2Result;
      }
      if (!v1Result) {
        return v2Result;
      }
    } catch (v2Error) {
      if (!v1Result && v1Error) {
        throw v1Error;
      }
      if (!v1Result) {
        throw v2Error;
      }
    }
  }

  if (v1Result) {
    return v1Result;
  }

  if (v1Error) {
    throw v1Error;
  }

  throw new ApiError(400, "Invoice number or transaction ID is required for verification");
}
