import type { Query, QueryClient } from "@tanstack/react-query";

export const QUERY_CACHE_STORAGE_KEY = "genmeta_react_query_cache_v1";
export const QUERY_CACHE_BUSTER = "v1";
export const QUERY_CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

/**
 * Standardized React Query cache windows.
 * Note: gcTime is always >= QUERY_CACHE_MAX_AGE so persisted queries
 * are not garbage-collected immediately upon hydration.
 */
export const CACHE_TIME = {
  /** Rarely changing public data (pricing plans, visitor country). */
  STATIC: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  },
  /** Standard user/admin API data (dashboards, lists, details). */
  DEFAULT: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: QUERY_CACHE_MAX_AGE, // 30 minutes
  },
  /** Authenticated session user data (/users/me). */
  AUTH: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: QUERY_CACHE_MAX_AGE, // 30 minutes
  },
  /** Frequently updated / live-polled views (notifications, error logs, health). */
  REALTIME: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: QUERY_CACHE_MAX_AGE, // 30 minutes
  },
} as const;

/**
 * Determines whether a query cache entry is safe and valid to persist
 * across page reloads in browser storage.
 */
export function shouldPersistQuery(query: Query): boolean {
  if (query.state.status !== "success") {
    return false;
  }

  if (query.meta?.persist === false) {
    return false;
  }

  const data = query.state.data;
  if (data === undefined || data === null) {
    return false;
  }

  // Service helpers often return { success: false, ... } instead of throwing
  if (
    typeof data === "object" &&
    "success" in data &&
    (data as { success?: unknown }).success === false
  ) {
    return false;
  }

  return true;
}

/**
 * Removes persisted React Query cache from localStorage.
 */
export function clearPersistedQueryCache(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
  } catch {
    // Ignore storage access errors (private browsing / restricted storage)
  }
}

/**
 * Clears both the in-memory React Query cache and persisted browser cache.
 * Must be called on logout, session revocation, or account switching.
 */
export function clearAllQueryCache(queryClient: QueryClient): void {
  queryClient.clear();
  clearPersistedQueryCache();
}
