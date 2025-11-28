/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosRequestConfig, Method } from "axios";
import { ENV } from "@/lib/env";
import { getAccessToken } from "../lib/cookies";

// API request options interface
interface ApiRequestOptions {
  method: Method;
  endpoint: string;
  data?: any;
  params?: Record<string, any>;
  useAuth?: boolean; // default: true
  customHeaders?: Record<string, string>;
}

// Reusable API request function
export const apiRequest = async <T = any>({
  method,
  endpoint,
  data = {},
  params = {},
  useAuth = true,
  customHeaders = {},
}: ApiRequestOptions): Promise<T> => {
  const token = useAuth ? await getAccessToken() : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(useAuth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const config: AxiosRequestConfig = {
    method,
    url: `${ENV.apiBaseUrl}${endpoint}`,
    data,
    params,
    headers,
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error: any) {
    // Handle 401 errors by clearing cookies and redirecting to login
    if (error?.response?.status === 401 && useAuth) {
      const { logout } = await import("./auth-services");
      await logout();

      // Only redirect if we're in a browser environment
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    console.error("API Error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
};
