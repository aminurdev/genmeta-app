/* eslint-disable @typescript-eslint/no-explicit-any */
// api.ts
import axios, { AxiosRequestConfig, Method } from "axios";
import { cookies } from "next/dist/server/request/cookies";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

// Token getter utility
const getToken = async (): Promise<string | null> => {
  const accessToken = (await cookies()).get("accessToken")?.value;
  return accessToken || null;
};

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
  const token = useAuth ? await getToken() : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(useAuth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const config: AxiosRequestConfig = {
    method,
    url: `${BASE_URL}${endpoint}`,
    data,
    params,
    headers,
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error: any) {
    console.error("API Error:", error?.response?.data || error.message);
    throw error?.response?.data || error;
  }
};
