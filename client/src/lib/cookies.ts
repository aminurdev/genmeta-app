import {
  getClientCookie,
  setClientCookie,
  deleteClientCookie,
} from "./cookies-client";
import { deleteServerTokens } from "./cookies-server";
import { LEGACY_COOKIE_NAMES, SESSION_HINT_COOKIE_NAME } from "./auth-constants";

export { getClientCookie, setClientCookie, deleteClientCookie };

/**
 * Clean up non-HttpOnly hint and legacy token cookies on logout.
 * Primary session cookies (gm_access_token, gm_refresh_token) are HttpOnly and managed by Express.
 */
export async function deleteTokens(): Promise<void> {
  if (typeof window !== "undefined") {
    deleteClientCookie(SESSION_HINT_COOKIE_NAME);
    for (const name of LEGACY_COOKIE_NAMES) {
      deleteClientCookie(name);
    }
    return;
  }

  try {
    await deleteServerTokens();
  } catch {
    // Non-fatal in read-only Server Component contexts
  }
}
