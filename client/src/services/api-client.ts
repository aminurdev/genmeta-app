import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ENV } from "../lib/env";
import { getServerCookieHeader } from "../lib/cookies-server";
import { clearPersistedQueryCache } from "../lib/query-cache";

const isBrowser = typeof window !== "undefined";
const API_BASE_URL = isBrowser ? "/api/v1" : ENV.backendApiUrl;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

// Forward request cookies during SSR
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window === "undefined") {
      try {
        const cookieHeader = await getServerCookieHeader();
        if (cookieHeader && !config.headers.Cookie) {
          config.headers.Cookie = cookieHeader;
        }
        if (!config.headers.Origin && ENV.appUrl) {
          config.headers.Origin = ENV.appUrl;
        }
      } catch {
        // Non-fatal outside request context
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Single-flight concurrency queue for automatic 401 HttpOnly cookie refresh in browser
let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

const SKIP_REFRESH_PATHS = [
  "/users/refresh-token",
  "/users/login",
  "/users/register",
  "/users/logout",
  "/users/verify-email",
  "/users/verify-otp",
  "/users/reset-password",
  "/users/verify-google",
];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest || typeof window === "undefined") {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;
    const requestUrl = originalRequest.url || "";
    const shouldSkip = SKIP_REFRESH_PATHS.some((path) =>
      requestUrl.includes(path)
    );

    if (isUnauthorized && !originalRequest._retry && !shouldSkip) {
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          "/api/v1/users/refresh-token",
          {},
          { withCredentials: true }
        );

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        clearPersistedQueryCache();

        const currentPath = window.location.pathname;
        const isProtectedPath =
          currentPath.startsWith("/dashboard") ||
          currentPath.startsWith("/admin") ||
          currentPath.startsWith("/payment-status") ||
          currentPath.startsWith("/settings");

        if (
          isProtectedPath &&
          !currentPath.includes("/login") &&
          !currentPath.includes("/signup")
        ) {
          const fullPath = `${currentPath}${window.location.search || ""}`;
          window.location.href = `/login?redirectPath=${encodeURIComponent(
            fullPath
          )}`;
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
