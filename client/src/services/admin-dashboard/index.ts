/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { ApiErrorResponse, ApiResponse } from "@/types";
import { apiRequest } from "../api";
import { api } from "../api-client";
import {
  AllUsersResponse,
  DashboardData,
  UsersStatisticsData,
} from "@/types/admin";

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    payments: {
      _id: string;
      user: {
        _id: string;
        name: string;
        email: string;
      };
      paymentID: string;
      trxID: string;
      plan?: {
        id?: string;
        name?: string;
        type?: string;
      };
      amount: number;
      createdAt: string;
      transactionStatus: string;
    }[];
  };
}

export interface DownloadPaymentHistory {
  success: boolean;
  message: string;
  data: {
    name: string;
    email: string;
    paymentNumber: string;
    paymentCreatedAt: string;
    paymentExecuteTime: string;
    amount: string;
    trxID: string;
    paymentID: string;
  }[];
}

export const getAdminOverview = async (): Promise<
  ApiResponse<DashboardData> | ApiErrorResponse
> => {
  const result = await api.get("/admin/dashboard/stats");
  return result.data;
};

export const getAllUsers = async (
  queryParams: string
): Promise<ApiResponse<AllUsersResponse> | ApiErrorResponse> => {
  const result = await api.get(`/admin/users/all?${queryParams}`);
  return result.data;
};

export const getUserStats = async (): Promise<
  ApiResponse<UsersStatisticsData> | ApiErrorResponse
> => {
  const result = await api.get("/admin/users/statistics");
  return result.data;
};

export const resetDeviceId = async (
  userId: string
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  const result = await api.put(`/app/appkey/reset-device`, {
    key: userId,
  });
  return result.data;
};

export const updateUserStats = async (
  userId: string,
  mode: "suspend" | "reactivate"
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  const result = await api.put(`/app/appkey/update-status`, {
    key: userId,
    mode,
  });
  return result.data;
};

export const updateUser = async (
  requestBody: any
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  const result = await api.put("/app/appkey/update", requestBody);
  return result.data;
};

export const createUser = async (
  requestBody: any
): Promise<ApiResponse<any> | ApiErrorResponse> => {
  const result = await api.post("/app/appkey/create", requestBody);
  return result.data;
};

export const addCredits = async (
  key: string,
  credits: number
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  const result = await api.put("/app/appkey/add-credits", {
    key,
    credits,
  });
  return result.data;
};

interface GetPaymentsHistoryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const getPaymentsHistory = async ({
  page,
  limit,
  search,
  sortBy,
  sortOrder,
  status,
  startDate,
  endDate,
}: GetPaymentsHistoryParams = {}): Promise<PaymentResponse> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: `/admin/paymentHistory/get?page=${page ?? ""}&limit=${
      limit ?? ""
    }&search=${search ?? ""}&sortBy=${sortBy ?? ""}&sortOrder=${
      sortOrder ?? ""
    }&status=${status ?? ""}&startDate=${startDate ?? ""}&endDate=${
      endDate ?? ""
    }`,
  });

  return result;
};

export const downloadPaymentHistory = async (
  queryParams?: string
): Promise<DownloadPaymentHistory> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: `/admin/paymentHistory/download?${queryParams}`,
  });

  return result;
};
