export const ACCESS_COOKIE_NAME = "gm_access_token";
export const REFRESH_COOKIE_NAME = "gm_refresh_token";
export const SESSION_HINT_COOKIE_NAME = "gm_has_session";
export const LEGACY_COOKIE_NAMES = ["accessToken", "refreshToken"] as const;

export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback: string = "/dashboard"
): string {
  if (!path || typeof path !== "string") return fallback;
  const trimmed = path.trim();
  if (
    !trimmed ||
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    /^\/[a-zA-Z]+:/.test(trimmed)
  ) {
    return fallback;
  }
  return trimmed;
}
