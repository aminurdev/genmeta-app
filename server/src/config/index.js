import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DB_NAME: z.string().default("GenMetaApp"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017"),

  BACKUP_DB_NAME: z.string().optional(),
  MONGODB_BACKUP_URI: z.string().optional(),

  GEMINI_ENCODER_KEY: z.string().min(1, "GEMINI_ENCODER_KEY is required in .env"),
  MINIMUM_REQUIRED_APP_VERSION: z.string().default("1.0.0"),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required in .env"),

  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_CALLBACK_URL: z.string().optional().default("http://localhost:5000/api/v1/users/google/callback"),

  ACCESS_TOKEN_SECRET: z.string().min(1, "ACCESS_TOKEN_SECRET is required in .env"),
  ACCESS_TOKEN_EXPIRY: z.string().default("8d"),

  REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET is required in .env"),
  REFRESH_TOKEN_EXPIRY: z.string().default("31d"),

  EMAIL_VERIFY_TOKEN_SECRET: z.string().min(1, "EMAIL_VERIFY_TOKEN_SECRET is required in .env"),
  EMAIL_VERIFY_TOKEN_EXPIRY: z.string().default("1d"),

  RESEND_API_KEY: z.string().optional().default(""),

  PAYSTATION_BASE_URL: z.string().optional().default("https://sandbox.paystation.com.bd"),
  PAYSTATION_MERCHANT_ID: z.string().optional().default(""),
  PAYSTATION_PASSWORD: z.string().optional().default(""),
  PAYSTATION_CALLBACK_URL: z.string().optional().default("http://localhost:5000/api/v1/payment/paystation-callback"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Environment configuration validation failed:");
  console.error(parsedEnv.error.format());
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const rawEnv = parsedEnv.success ? parsedEnv.data : process.env;

const dbName = rawEnv.DB_NAME || "GenMetaApp";
const mongoBaseUri = (rawEnv.MONGODB_URI || "mongodb://127.0.0.1:27017").replace(/\/$/, "");
const mongoFullUri = mongoBaseUri.includes("?")
  ? mongoBaseUri.replace("?", `/${dbName}?`)
  : `${mongoBaseUri}/${dbName}`;

const config = {
  port: rawEnv.PORT || 5000,
  NODE_ENV: rawEnv.NODE_ENV || "development",
  isProduction: (rawEnv.NODE_ENV || "development") === "production",

  db_name: dbName,
  mongodb_uri: mongoFullUri,
  mongodb_backup_uri: rawEnv.MONGODB_BACKUP_URI || mongoBaseUri,
  backup_db_name: rawEnv.BACKUP_DB_NAME || `${dbName}_backup`,

  encoderKey: rawEnv.GEMINI_ENCODER_KEY,
  minimumRequiredAppVersion: rawEnv.MINIMUM_REQUIRED_APP_VERSION || "1.0.0",

  cors_origin: rawEnv.CORS_ORIGIN || "http://localhost:3000",
  session_secret: rawEnv.SESSION_SECRET,

  google_client_id: rawEnv.GOOGLE_CLIENT_ID || "",
  google_client_secret: rawEnv.GOOGLE_CLIENT_SECRET || "",
  google_callback_url: rawEnv.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/v1/users/google/callback",

  access_token_secret: rawEnv.ACCESS_TOKEN_SECRET,
  access_token_expiry: rawEnv.ACCESS_TOKEN_EXPIRY || "8d",

  refresh_token_secret: rawEnv.REFRESH_TOKEN_SECRET,
  refresh_token_expiry: rawEnv.REFRESH_TOKEN_EXPIRY || "31d",

  email_verify_token_secret: rawEnv.EMAIL_VERIFY_TOKEN_SECRET,
  email_verify_token_expiry: rawEnv.EMAIL_VERIFY_TOKEN_EXPIRY || "1d",

  resend_api_key: rawEnv.RESEND_API_KEY || "",

  paystation: {
    base_url: rawEnv.PAYSTATION_BASE_URL,
    merchant_id: rawEnv.PAYSTATION_MERCHANT_ID,
    password: rawEnv.PAYSTATION_PASSWORD,
    callback_url: rawEnv.PAYSTATION_CALLBACK_URL,
  },
};

export default config;
