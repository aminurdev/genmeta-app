"use server";

import { cookies } from "next/headers";
import {
  ACCESS_COOKIE_NAME,
  LEGACY_COOKIE_NAMES,
  REFRESH_COOKIE_NAME,
  SESSION_HINT_COOKIE_NAME,
} from "./auth-constants";

export async function getServerCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.toString();
}

export async function hasServerAuthCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(
    cookieStore.get(ACCESS_COOKIE_NAME)?.value ||
      cookieStore.get(REFRESH_COOKIE_NAME)?.value
  );
}

export async function deleteServerTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
  cookieStore.delete(SESSION_HINT_COOKIE_NAME);
  for (const name of LEGACY_COOKIE_NAMES) {
    cookieStore.delete(name);
  }
}
