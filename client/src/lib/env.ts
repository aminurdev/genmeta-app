const getEnv = (key: string, defaultValue: string = ""): string => {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    return defaultValue;
  }
  return value.trim();
};

export const ENV = {
  apiBaseUrl: getEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:5000/api/v1"),
  gtmId: getEnv("NEXT_PUBLIC_GTM_ID", ""),
  accessTokenExpiry: Number(getEnv("NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY", "8")),
  refreshTokenExpiry: Number(getEnv("NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY", "31")),
};
