import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const config = {
  port: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  mongodb_uri: process.env.MONGODB_URI + "/" + process.env.DB_NAME,
  encoderKey: process.env.GEMINI_ENCODER_KEY,

  cors_origin: process.env.CORS_ORIGIN,

  google_client_id: process.env.GOOGLE_CLIENT_ID,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
  google_callback_url: process.env.GOOGLE_CALLBACK_URL,

  session_secret: process.env.SESSION_SECRET,

  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  access_token_expiry: process.env.ACCESS_TOKEN_EXPIRY,

  refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
  refresh_token_expiry: process.env.REFRESH_TOKEN_EXPIRY,

  email_verify_token_secret: process.env.EMAIL_VERIFY_TOKEN_SECRET,
  email_verify_token_expiry: process.env.EMAIL_VERIFY_TOKEN_EXPIRY,

  resend_api_key: process.env.RESEND_API_KEY,

  bkash: {
    base_url: process.env.BKASH_BASE_URL,
    app_key: process.env.BKASH_APP_KEY,
    app_secret: process.env.BKASH_APP_SECRET,
    username: process.env.BKASH_USERNAME,
    password: process.env.BKASH_PASSWORD,
    callback_url: process.env.BKASH_CALLBACK_URL,
  },
};
export default config;
