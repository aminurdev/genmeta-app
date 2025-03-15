import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const config = {
  port: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  mongodb_uri: process.env.MONGODB_URI + "/" + process.env.DB_NAME,
  geminiApiKey: process.env.GEMINI_API_KEY,

  cors_origin: process.env.CORS_ORIGIN,

  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  access_token_expiry: process.env.ACCESS_TOKEN_EXPIRY,

  refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
  refresh_token_expiry: process.env.REFRESH_TOKEN_EXPIRY,

  email_verify_token_secret: process.env.EMAIL_VERIFY_TOKEN_SECRET,
  email_verify_token_expiry: process.env.EMAIL_VERIFY_TOKEN_EXPIRY,

  resend_api_key: process.env.RESEND_API_KEY,

  aws: {
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    },
  },
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
