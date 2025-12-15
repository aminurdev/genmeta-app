"use server";

import { cookies } from "next/headers";
import { ENV } from "./env";

// Common token management utilities
const getTokenCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge,
  path: "/",
});

export const getTokenFromCookie = async (
  tokenType: "accessToken" | "refreshToken"
): Promise<string | null> => {
  const token = (await cookies()).get(tokenType)?.value;
  return token || null;
};

export const setTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  console.log({ accessToken, refreshToken });

  const cookieStore = await cookies();
  cookieStore.set(
    "accessToken",
    accessToken,
    getTokenCookieOptions(60 * 60 * 24 * Number(ENV.accessTokenExpiry))
  );
  cookieStore.set(
    "refreshToken",
    refreshToken,
    getTokenCookieOptions(60 * 60 * 24 * Number(ENV.refreshTokenExpiry))
  );
};

export const deleteTokens = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
};

export const getAccessToken = async (): Promise<string | null> => {
  const token = await getTokenFromCookie("accessToken");
  return token;
};
