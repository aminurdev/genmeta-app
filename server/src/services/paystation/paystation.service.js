import axios from "axios";
import ApiError from "../../utils/api.error.js";
import config from "../../config/index.js";

const BASE_URL = config.paystation.base_url;

/**
 * PayStation Payment Service
 * Handles payment initiation and transaction status verification
 */

/**
 * Initiate Payment with PayStation
 * @param {Object} paymentData - Payment details
 * @param {string} paymentData.invoiceNumber - Unique invoice number
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.customerName - Customer's full name
 * @param {string} paymentData.customerPhone - Customer's phone number
 * @param {string} paymentData.customerEmail - Customer's email address
 * @param {string} paymentData.customerAddress - Customer's address (optional)
 * @param {string} paymentData.reference - Reference information (optional)
 * @param {string|Object} paymentData.checkoutItems - Checkout items details (optional)
 * @param {string|Object} paymentData.optA - Optional data A (optional)
 * @param {string|Object} paymentData.optB - Optional data B (optional)
 * @param {string|Object} paymentData.optC - Optional data C (optional)
 * @returns {Promise<Object>} Payment response with payment_url and invoice_number
 */
export async function initiatePayment({
  invoiceNumber,
  amount,
  customerName,
  customerPhone,
  customerEmail,
  customerAddress = "",
  reference = "",
  checkoutItems = "",
  optA = "",
  optB = "",
  optC = "",
}) {
  try {
    // Validate required fields
    if (
      !invoiceNumber ||
      !amount ||
      !customerName ||
      !customerPhone ||
      !customerEmail
    ) {
      throw new ApiError(400, "Missing required payment fields");
    }

    // Prepare request payload
    const payload = {
      merchantId: config.paystation.merchant_id,
      password: config.paystation.password,
      invoice_number: invoiceNumber,
      currency: "BDT",
      payment_amount: amount,
      pay_with_charge: 0, // Merchant bears the charge
      reference: reference || `Payment for ${invoiceNumber}`,
      cust_name: customerName,
      cust_phone: customerPhone,
      cust_email: customerEmail,
      cust_address: customerAddress || "N/A",
      callback_url: config.paystation.callback_url,
      checkout_items:
        typeof checkoutItems === "object"
          ? JSON.stringify(checkoutItems)
          : checkoutItems,
    };

    // Add optional fields if provided
    if (optA)
      payload.opt_a = typeof optA === "object" ? JSON.stringify(optA) : optA;
    if (optB)
      payload.opt_b = typeof optB === "object" ? JSON.stringify(optB) : optB;
    if (optC)
      payload.opt_c = typeof optC === "object" ? JSON.stringify(optC) : optC;

    console.log("🚀 Initiating PayStation payment...", {
      invoice_number: invoiceNumber,
      amount,
      customer: customerEmail,
    });

    const { data } = await axios.post(`${BASE_URL}/initiate-payment`, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Check response status
    if (data.status_code !== "200" || data.status !== "success") {
      console.error("❌ PayStation payment initiation failed:", data.message);
      throw new ApiError(
        parseInt(data.status_code) || 500,
        data.message || "Failed to initiate PayStation payment"
      );
    }

    console.log("✅ PayStation payment initiated successfully", {
      invoice_number: data.invoice_number,
      payment_amount: data.payment_amount,
    });

    return {
      statusCode: data.status_code,
      status: data.status,
      message: data.message,
      paymentAmount: data.payment_amount,
      invoiceNumber: data.invoice_number,
      paymentUrl: data.payment_url,
    };
  } catch (error) {
    // Handle ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle axios errors
    if (error.response) {
      const responseData = error.response.data;
      console.error("❌ PayStation API error:", responseData);
      throw new ApiError(
        parseInt(responseData.status_code) || error.response.status || 500,
        responseData.message || "PayStation payment initiation failed"
      );
    }

    // Handle network or other errors
    console.error("❌ PayStation service error:", error.message);
    throw new ApiError(500, error.message || "PayStation service unavailable");
  }
}

/**
 * Check Transaction Status by Invoice Number
 * @param {string} invoiceNumber - The unique invoice number
 * @returns {Promise<Object>} Transaction status details
 */
export async function checkTransactionStatus(invoiceNumber) {
  try {
    if (!invoiceNumber) {
      throw new ApiError(400, "Invoice number is required");
    }

    console.log("🔍 Checking PayStation transaction status...", {
      invoiceNumber,
    });

    const { data } = await axios.post(
      `${BASE_URL}/transaction-status`,
      { invoice_number: invoiceNumber },
      {
        headers: {
          merchantId: config.paystation.merchant_id,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // Check response status
    if (data.status_code !== "200" || data.status !== "success") {
      console.error("❌ Transaction status check failed:", data.message);
      throw new ApiError(
        parseInt(data.status_code) || 500,
        data.message || "Failed to retrieve transaction status"
      );
    }

    console.log("✅ Transaction status retrieved successfully", {
      invoice_number: data.data.invoice_number,
      trx_status: data.data.trx_status,
    });

    return {
      statusCode: data.status_code,
      status: data.status,
      message: data.message,
      data: {
        invoiceNumber: data.data.invoice_number,
        trxStatus: data.data.trx_status,
        trxId: data.data.trx_id || null,
        paymentAmount: data.data.payment_amount,
        orderDateTime: data.data.order_date_time,
        payerMobileNo: data.data.payer_mobile_no || null,
        paymentMethod: data.data.payment_method || null,
        reference: data.data.reference || null,
        checkoutItems: data.data.checkout_items || null,
      },
    };
  } catch (error) {
    // Handle ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle axios errors
    if (error.response) {
      const responseData = error.response.data;
      console.error("❌ PayStation transaction status error:", responseData);
      throw new ApiError(
        parseInt(responseData.status_code) || error.response.status || 500,
        responseData.message || "Failed to check transaction status"
      );
    }

    // Handle network or other errors
    console.error("❌ PayStation service error:", error.message);
    throw new ApiError(500, error.message || "PayStation service unavailable");
  }
}

/**
 * Check Transaction Status by Transaction ID (v2 API)
 * @param {string} trxId - The unique transaction ID
 * @returns {Promise<Object>} Transaction status details
 */
export async function checkTransactionStatusByTrxId(trxId) {
  try {
    if (!trxId) {
      throw new ApiError(400, "Transaction ID is required");
    }

    console.log("🔍 Checking PayStation transaction status by TrxID...", {
      trxId,
    });

    const { data } = await axios.post(
      `${BASE_URL}/v2/transaction-status`,
      { trxId },
      {
        headers: {
          merchantId: config.paystation.merchant_id,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // Check response status
    if (data.status_code !== "200" || data.status !== "success") {
      console.error("❌ Transaction status check failed:", data.message);
      throw new ApiError(
        parseInt(data.status_code) || 500,
        data.message || "Failed to retrieve transaction status"
      );
    }

    console.log("✅ Transaction status retrieved successfully", {
      trx_id: data.data.trx_id,
      trx_status: data.data.trx_status,
    });

    return {
      statusCode: data.status_code,
      status: data.status,
      message: data.message,
      data: {
        invoiceNumber: data.data.invoice_number,
        trxStatus: data.data.trx_status,
        trxId: data.data.trx_id,
        trxAmount: data.data.trx_amount,
        trxDate: data.data.trx_date,
        requestAmount: data.data.request_amount,
        paymentAmount: data.data.payment_amount,
        orderDateTime: data.data.order_date_time,
        payerMobileNo: data.data.payer_mobile_no || null,
        paymentMethod: data.data.payment_method || null,
        reference: data.data.reference || null,
      },
    };
  } catch (error) {
    // Handle ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle axios errors
    if (error.response) {
      const responseData = error.response.data;
      console.error("❌ PayStation transaction status error:", responseData);
      throw new ApiError(
        parseInt(responseData.status_code) || error.response.status || 500,
        responseData.message || "Failed to check transaction status"
      );
    }

    // Handle network or other errors
    console.error("❌ PayStation service error:", error.message);
    throw new ApiError(500, error.message || "PayStation service unavailable");
  }
}
