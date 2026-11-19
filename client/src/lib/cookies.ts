import {
  getClientCookie,
  setClientCookie,
  deleteClientCookie,
} from "./cookies-client";
import {
  getServerToken,
  setServerTokens,
  deleteServerTokens,
} from "./cookies-server";
import { ENV } from "./env";

export { getClientCookie, setClientCookie, deleteClientCookie };

/**
 * Get access token seamlessly.
 * If in browser: reads immediately from document.cookie (0ms latency).
 * If in Node/Server: reads from next/headers cookies.
 */
export async function getAccessToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    return getClientCookie("accessToken");
  }
  return getServerToken("accessToken");
}

/**
 * Get access token synchronously on client side (for Axios request interceptor).
 */
export function getAccessTokenSync(): string | null {
  if (typeof window !== "undefined") {
    return getClientCookie("accessToken");
  }
  return null;
}

/**
 * Get refresh token seamlessly.
 */
export async function getRefreshToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    return getClientCookie("refreshToken");
  }
  return getServerToken("refreshToken");
}

export function getRefreshTokenSync(): string | null {
  if (typeof window !== "undefined") {
    return getClientCookie("refreshToken");
  }
  return null;
}

export async function getTokenFromCookie(
  tokenType: "accessToken" | "refreshToken"
): Promise<string | null> {
  if (typeof window !== "undefined") {
    return getClientCookie(tokenType);
  }
  return getServerToken(tokenType);
}

/**
 * Set both tokens on client and server.
 */
export async function setTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const accessExpiryDays = Number(ENV.accessTokenExpiry) || 8;
  const refreshExpiryDays = Number(ENV.refreshTokenExpiry) || 31;

  if (typeof window !== "undefined") {
    setClientCookie("accessToken", accessToken, accessExpiryDays);
    setClientCookie("refreshToken", refreshToken, refreshExpiryDays);
  }

  // Also synchronize on server cookies
  try {
    await setServerTokens(accessToken, refreshToken);
  } catch (error) {
    // Non-fatal if invoked in environment without next/headers context
    console.warn("Server cookie sync error:", error);
  }
}

/**
 * Delete both tokens on client and server.
 */
export async function deleteTokens(): Promise<void> {
  if (typeof window !== "undefined") {
    deleteClientCookie("accessToken");
    deleteClientCookie("refreshToken");
  }

  try {
    await deleteServerTokens();
  } catch (error) {
    console.warn("Server cookie delete error:", error);
  }
}
