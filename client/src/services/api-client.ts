import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  getAccessToken,
  getAccessTokenSync,
  getRefreshToken,
  getRefreshTokenSync,
  setTokens,
  deleteTokens,
  setClientCookie,
} from "../lib/cookies";
import { ENV } from "../lib/env";

const API_BASE_URL = ENV.apiBaseUrl || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

// Attach access token automatically (synchronously in browser for 0ms latency)
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = getAccessTokenSync();
    if (!token && typeof window === "undefined") {
      token = await getAccessToken();
    }

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency queue for automatic 401 token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;
    const isAuthRoute =
      originalRequest.url?.includes("/users/refresh-token") ||
      originalRequest.url?.includes("/users/login") ||
      originalRequest.url?.includes("/users/register");

    if (isUnauthorized && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        let refreshToken = getRefreshTokenSync();
        if (!refreshToken && typeof window === "undefined") {
          refreshToken = await getRefreshToken();
        }

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const refreshResponse = await axios.post(
          `${API_BASE_URL}/users/refresh-token`,
          { refreshToken },
          { withCredentials: true }
        );

        const newAccessToken =
          refreshResponse.data?.data?.accessToken ||
          refreshResponse.data?.accessToken;
        const newRefreshToken =
          refreshResponse.data?.data?.refreshToken ||
          refreshResponse.data?.refreshToken ||
          refreshToken;

        if (!newAccessToken) {
          throw new Error("Invalid refresh token response");
        }

        // Update tokens
        if (typeof window !== "undefined") {
          setClientCookie("accessToken", newAccessToken);
          if (newRefreshToken) {
            setClientCookie("refreshToken", newRefreshToken);
          }
        }
        await setTokens(newAccessToken, newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await deleteTokens();

        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (
            !currentPath.includes("/login") &&
            !currentPath.includes("/signup")
          ) {
            window.location.href = `/login?redirectPath=${encodeURIComponent(
              currentPath
            )}`;
          }
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
