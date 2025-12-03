import axios from "axios";
import ApiError from "../../utils/api.error.js";
import { BKashToken } from "../../models/bkash-token.model.js";
import config from "../../config/index.js";

const BASE_URL = config.bkash.base_url;
const BKASH_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  username: config.bkash.username,
  password: config.bkash.password,
};

// Utility to save token
async function saveToken(data) {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

  await BKashToken.deleteMany({});
  await BKashToken.create({
    id_token: data.id_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
  });

  return data.id_token;
}

// Get Access Token
async function getAccessToken() {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/checkout/token/grant`,
      {
        app_key: config.bkash.app_key,
        app_secret: config.bkash.app_secret,
      },
      { headers: BKASH_HEADERS }
    );

    if (!data?.id_token)
      throw new ApiError(500, "Failed to retrieve bKash token");

    console.log(
      `✅ Token generated successfully. Expires in ${data.expires_in} seconds.`
    );
    return saveToken(data);
  } catch (error) {
    throw new ApiError(
      500,
      error.response?.data || "bKash token generation failed."
    );
  }
}

// Refresh Token
async function refreshAccessToken(refreshTokenValue) {
  if (!refreshTokenValue) throw new ApiError(400, "No refresh token provided.");

  try {
    const { data } = await axios.post(
      `${BASE_URL}/checkout/token/refresh`,
      {
        app_key: config.bkash.app_key,
        app_secret: config.bkash.app_secret,
        refresh_token: refreshTokenValue,
      },
      { headers: BKASH_HEADERS }
    );

    if (!data?.id_token)
      throw new ApiError(500, "Failed to refresh bKash token");

    console.log(
      `🔄 Token refreshed successfully. Expires in ${data.expires_in} seconds.`
    );
    return saveToken(data);
  } catch (error) {
    throw new ApiError(
      500,
      error.response?.data || "bKash token refresh failed."
    );
  }
}

// Get Valid Token
async function getValidToken() {
  const tokenDoc = await BKashToken.findOne();

  if (tokenDoc) {
    if (tokenDoc.expires_at > new Date()) return tokenDoc.id_token;

    try {
      return await refreshAccessToken(tokenDoc.refresh_token);
    } catch {
      console.log("❌ Refresh failed, generating new token.");
    }
  }

  return await getAccessToken();
}

// Create Payment
export async function createPayment({
  amount,
  payerReference,
  merchantInvoiceNumber,
}) {
  try {
    const token = await getValidToken();

    const { data } = await axios.post(
      `${BASE_URL}/checkout/create`,
      {
        mode: "0011",
        payerReference,
        callbackURL: config.bkash.callback_url,
        merchantAssociationInfo: "MI05MID54RF09123456One",
        amount,
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber,
      },
      {
        headers: {
          ...BKASH_HEADERS,
          Authorization: token,
          "X-App-Key": config.bkash.app_key,
        },
      }
    );

    if (!data?.paymentID)
      throw new ApiError(500, "Failed to create bKash payment.");

    console.log(
      `✅ Payment Created Successfully. Payment ID: ${data.paymentID}`
    );
    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("🔄 Token expired. Retrying with a new token...");
      await getAccessToken();
      return createPayment({ amount, payerReference, merchantInvoiceNumber });
    }

    throw new ApiError(
      500,
      error.response?.data || "bKash payment creation failed."
    );
  }
}

export const executePayment = async (paymentID) => {
  try {
    const token = await getValidToken();

    const { data } = await axios.post(
      `${BASE_URL}/checkout/execute`,
      { paymentID },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: token,
          "X-App-Key": config.bkash.app_key,
        },
      }
    );

    if (
      data?.statusCode === "0000" &&
      data?.transactionStatus === "Completed"
    ) {
      console.log(`✅ Payment Executed Successfully. TrxID: ${data.trxID}`);
      return data;
    }

    console.warn(`⚠️ Payment execution response: ${JSON.stringify(data)}`);
    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(
        "🔄 Token expired during execution. Retrying with new token..."
      );
      await getAccessToken();
      return executePayment(paymentID); // Retry once after refreshing token
    }

    throw new ApiError(
      error.response?.status || 500,
      error.response?.data?.message || "bKash payment execution failed."
    );
  }
};
