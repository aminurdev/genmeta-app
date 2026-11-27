import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const emptyToUndefined = (val) =>
  typeof val === "string" && val.trim() === "" ? undefined : val;

const requiredString = (name) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string({ error: `${name} is required in .env` })
      .trim()
      .min(1, `${name} is required in .env`)
  );

const requiredInt = (name, { min, max } = {}) =>
  z.preprocess(
    (val) => {
      const cleaned = emptyToUndefined(val);
      if (cleaned === undefined) return undefined;
      const parsed = Number(cleaned);
      return Number.isNaN(parsed) ? cleaned : parsed;
    },
    (() => {
      let schema = z
        .number({ error: `${name} is required and must be a valid integer in .env` })
        .int(`${name} must be an integer in .env`);
      if (min !== undefined) schema = schema.min(min);
      if (max !== undefined) schema = schema.max(max);
      return schema;
    })()
  );

const envSchema = z.object({
  PORT: requiredInt("PORT", { min: 1, max: 65535 }),
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(["development", "production", "test"], {
      error: "NODE_ENV is required in .env (development | production | test)",
    })
  ),

  DB_NAME: requiredString("DB_NAME"),
  MONGODB_URI: requiredString("MONGODB_URI"),

  BACKUP_DB_NAME: requiredString("BACKUP_DB_NAME"),
  MONGODB_BACKUP_URI: requiredString("MONGODB_BACKUP_URI"),

  GEMINI_ENCODER_KEY: requiredString("GEMINI_ENCODER_KEY"),
  MINIMUM_REQUIRED_APP_VERSION: requiredString("MINIMUM_REQUIRED_APP_VERSION"),

  CORS_ORIGIN: requiredString("CORS_ORIGIN"),
  SESSION_SECRET: requiredString("SESSION_SECRET"),

  GOOGLE_CLIENT_ID: requiredString("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: requiredString("GOOGLE_CLIENT_SECRET"),
  GOOGLE_CALLBACK_URL: requiredString("GOOGLE_CALLBACK_URL"),

  ACCESS_TOKEN_SECRET: requiredString("ACCESS_TOKEN_SECRET"),
  ACCESS_TOKEN_EXPIRY: requiredString("ACCESS_TOKEN_EXPIRY"),

  REFRESH_TOKEN_SECRET: requiredString("REFRESH_TOKEN_SECRET"),
  REFRESH_TOKEN_EXPIRY: requiredString("REFRESH_TOKEN_EXPIRY"),

  EMAIL_VERIFY_TOKEN_SECRET: requiredString("EMAIL_VERIFY_TOKEN_SECRET"),
  EMAIL_VERIFY_TOKEN_EXPIRY: requiredString("EMAIL_VERIFY_TOKEN_EXPIRY"),

  COOKIE_DOMAIN: z.string({ error: "COOKIE_DOMAIN is required in .env" }).trim(),
  COOKIE_SAME_SITE: z.preprocess(
    emptyToUndefined,
    z.enum(["lax", "strict", "none"], {
      error: "COOKIE_SAME_SITE is required in .env (lax | strict | none)",
    })
  ),
  BCRYPT_ROUNDS: requiredInt("BCRYPT_ROUNDS", { min: 10, max: 15 }),
  MAX_LOGIN_ATTEMPTS: requiredInt("MAX_LOGIN_ATTEMPTS", { min: 3, max: 20 }),
  LOCKOUT_DURATION_MS: requiredInt("LOCKOUT_DURATION_MS", { min: 60000 }),

  RESEND_API_KEY: requiredString("RESEND_API_KEY"),

  PAYSTATION_BASE_URL: requiredString("PAYSTATION_BASE_URL"),
  PAYSTATION_MERCHANT_ID: requiredString("PAYSTATION_MERCHANT_ID"),
  PAYSTATION_PASSWORD: requiredString("PAYSTATION_PASSWORD"),
  PAYSTATION_CALLBACK_URL: requiredString("PAYSTATION_CALLBACK_URL"),
  PAYSTATION_PAY_WITH_CHARGE: requiredInt("PAYSTATION_PAY_WITH_CHARGE", { min: 0, max: 1 }),
  PAYSTATION_TIMEOUT_MS: requiredInt("PAYSTATION_TIMEOUT_MS", { min: 3000, max: 60000 }),
  PAYSTATION_PAYMENT_EXPIRY_MINUTES: requiredInt("PAYSTATION_PAYMENT_EXPIRY_MINUTES", {
    min: 5,
    max: 1440,
  }),
  PAYSTATION_DEFAULT_PHONE: requiredString("PAYSTATION_DEFAULT_PHONE"),
  PAYSTATION_RECONCILE_CRON: requiredString("PAYSTATION_RECONCILE_CRON"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "ENV"}: ${issue.message}`)
    .join("\n  - ");
  throw new Error(
    `❌ Environment configuration validation failed:\n  - ${details}`
  );
}

const env = parsedEnv.data;

const dbName = env.DB_NAME;
const mongoBaseUri = env.MONGODB_URI.replace(/\/+$/, "");
const mongoFullUri = mongoBaseUri.includes("?")
  ? mongoBaseUri.replace("?", `/${dbName}?`)
  : `${mongoBaseUri}/${dbName}`;

const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

if (corsOrigins.length === 0) {
  throw new Error("❌ CORS_ORIGIN must contain at least one valid origin in .env");
}

const config = {
  port: env.PORT,
  NODE_ENV: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",

  db_name: dbName,
  mongodb_uri: mongoFullUri,
  mongodb_backup_uri: env.MONGODB_BACKUP_URI.replace(/\/+$/, ""),
  backup_db_name: env.BACKUP_DB_NAME,

  encoderKey: env.GEMINI_ENCODER_KEY,
  minimumRequiredAppVersion: env.MINIMUM_REQUIRED_APP_VERSION,

  cors_origin: corsOrigins[0],
  cors_origins: corsOrigins,
  session_secret: env.SESSION_SECRET,

  google_client_id: env.GOOGLE_CLIENT_ID,
  google_client_secret: env.GOOGLE_CLIENT_SECRET,
  google_callback_url: env.GOOGLE_CALLBACK_URL,

  access_token_secret: env.ACCESS_TOKEN_SECRET,
  access_token_expiry: env.ACCESS_TOKEN_EXPIRY,

  refresh_token_secret: env.REFRESH_TOKEN_SECRET,
  refresh_token_expiry: env.REFRESH_TOKEN_EXPIRY,

  email_verify_token_secret: env.EMAIL_VERIFY_TOKEN_SECRET,
  email_verify_token_expiry: env.EMAIL_VERIFY_TOKEN_EXPIRY,

  cookie_domain: env.COOKIE_DOMAIN || undefined,
  cookie_secure: env.NODE_ENV === "production",
  cookie_same_site: env.COOKIE_SAME_SITE,
  bcrypt_rounds: env.BCRYPT_ROUNDS,
  max_login_attempts: env.MAX_LOGIN_ATTEMPTS,
  lockout_duration_ms: env.LOCKOUT_DURATION_MS,

  resend_api_key: env.RESEND_API_KEY,

  paystation: {
    base_url: env.PAYSTATION_BASE_URL.replace(/\/+$/, ""),
    merchant_id: env.PAYSTATION_MERCHANT_ID,
    password: env.PAYSTATION_PASSWORD,
    callback_url: env.PAYSTATION_CALLBACK_URL,
    pay_with_charge: env.PAYSTATION_PAY_WITH_CHARGE,
    timeout_ms: env.PAYSTATION_TIMEOUT_MS,
    payment_expiry_minutes: env.PAYSTATION_PAYMENT_EXPIRY_MINUTES,
    default_phone: env.PAYSTATION_DEFAULT_PHONE,
    reconcile_cron: env.PAYSTATION_RECONCILE_CRON,
  },
};

if (
  config.isProduction &&
  config.paystation.base_url.includes("sandbox.paystation.com.bd")
) {
  console.warn(
    "⚠ PAYSTATION_BASE_URL is pointing to sandbox in production mode."
  );
}

export default config;
