"use server";

import { cookies } from "next/headers";
import { ENV } from "./env";

const getTokenCookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: false, // Allows synchronous reading by client Axios interceptors with 0 latency
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: maxAgeSeconds,
  path: "/",
});

export async function getServerToken(
  tokenType: "accessToken" | "refreshToken"
): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(tokenType)?.value;
  return token || null;
}

export async function setServerTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const cookieStore = await cookies();
  const accessExpiryDays = Number(ENV.accessTokenExpiry) || 8;
  const refreshExpiryDays = Number(ENV.refreshTokenExpiry) || 31;

  cookieStore.set(
    "accessToken",
    accessToken,
    getTokenCookieOptions(60 * 60 * 24 * accessExpiryDays)
  );

  cookieStore.set(
    "refreshToken",
    refreshToken,
    getTokenCookieOptions(60 * 60 * 24 * refreshExpiryDays)
  );
}

export async function deleteServerTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}
