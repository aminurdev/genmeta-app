/**
 * Client & Server Environment Variables
 *
 * NOTE: Next.js bundles public environment variables into the client by statically
 * analyzing and inlining `process.env.NEXT_PUBLIC_*` at build/compile time.
 * Dynamic lookups like `process.env[key]` do NOT get inlined by Next.js and return undefined in the browser.
 * Always reference `process.env.NEXT_PUBLIC_*` statically.
 */

const envMap: Record<string, string | undefined> = {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY: process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY,
  NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY: process.env.NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY,
};

const getEnv = (key: string, defaultValue: string = ""): string => {
  const value = envMap[key] ?? process.env[key];
  if (!value || typeof value !== "string" || value.trim() === "") {
    return defaultValue;
  }
  return value.trim();
};

export const ENV = {
  apiBaseUrl: getEnv(
    "NEXT_PUBLIC_API_BASE_URL",
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"
  ),
  appUrl: getEnv(
    "NEXT_PUBLIC_APP_URL",
    process.env.NEXT_PUBLIC_APP_URL || "https://genmeta.app"
  ),
  gtmId: getEnv(
    "NEXT_PUBLIC_GTM_ID",
    process.env.NEXT_PUBLIC_GTM_ID || ""
  ),
  accessTokenExpiry:
    Number(
      getEnv(
        "NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY",
        process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY || "8"
      )
    ) || 8,
  refreshTokenExpiry:
    Number(
      getEnv(
        "NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY",
        process.env.NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY || "31"
      )
    ) || 31,
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
};
