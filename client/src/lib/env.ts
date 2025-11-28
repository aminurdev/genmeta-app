const requiredEnv = {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY: process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY,
  NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY:
    process.env.NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY,
} as const;

type EnvKeys = keyof typeof requiredEnv;

function getEnv<K extends EnvKeys>(key: K): string {
  const value = requiredEnv[key];

  if (!value || value.trim() === "") {
    console.error(`❌ Missing environment variable: ${key}`);
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

export const ENV = {
  apiBaseUrl: getEnv("NEXT_PUBLIC_API_BASE_URL"),
  gtmId: getEnv("NEXT_PUBLIC_GTM_ID"),
  accessTokenExpiry: Number(getEnv("NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY")),
  refreshTokenExpiry: Number(getEnv("NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY")),
};
