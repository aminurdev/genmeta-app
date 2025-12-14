/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { ApiErrorResponse, ApiResponse } from "@/types";
import { api } from "./api-client";
import {
  AllUsersResponse,
  AdminDashboardStats,
  UsersStatisticsData,
  PaymentResponse,
  DownloadPaymentHistory,
  ReferralRes,
  ReferralDetails,
  UpdateWithdrawalRes,
  GetPaymentsHistoryParams,
} from "@/types/admin";

export const getAdminOverview = async (): Promise<
  ApiResponse<AdminDashboardStats> | ApiErrorResponse
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

export const getPaymentsHistory = async ({
  page,
  limit,
  search,
  sortBy,
  sortOrder,
  status,
  startDate,
  endDate,
}: GetPaymentsHistoryParams = {}): Promise<
  ApiResponse<PaymentResponse> | ApiErrorResponse
> => {
  const result = await api.get(
    `/admin/paymentHistory/get?page=${page ?? ""}&limit=${limit ?? ""}&search=${
      search ?? ""
    }&sortBy=${sortBy ?? ""}&sortOrder=${sortOrder ?? ""}&status=${
      status ?? ""
    }&startDate=${startDate ?? ""}&endDate=${endDate ?? ""}`
  );
  return result.data;
};

export const downloadPaymentHistory = async (
  queryParams?: string
): Promise<DownloadPaymentHistory> => {
  const result = await api.get(`/admin/paymentHistory/download?${queryParams}`);

  return result.data;
};

export const getAllReferral = async (): Promise<ApiResponse<ReferralRes[]>> => {
  const result = await api.get("/admin/referral");

  return result.data;
};

export const getAllReferralByUserId = async (
  userId: string
): Promise<ApiResponse<ReferralDetails>> => {
  const result = await api.get(`/admin/referral/${userId}`);

  return result.data;
};

export const updateWithdrawal = async (
  userId: string,
  withdrawalId: string,
  status: string,
  trx: string
): Promise<ApiResponse<UpdateWithdrawalRes>> => {
  const result = await api.patch(
    `/admin/referral/${userId}/withdrawals/${withdrawalId}`,
    {
      status,
      trx,
    }
  );
  return result.data;
};

// Pricing Plans
export interface PricingPlan {
  _id: string;
  name: string;
  type: "subscription" | "credit";
  basePrice: number;
  discountPrice?: number;
  discountPercent: number;
  isActive: boolean;
  planDuration: number;
  credit?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PricingPlansResponse {
  plans: PricingPlan[];
  pagination: PaginationData;
}

export interface PromoCode {
  _id: string;
  code: string;
  description?: string;
  discountPercent: number;
  isActive: boolean;
  appliesTo: "subscription" | "credit" | "both";
  usageLimit: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCodesResponse {
  promoCodes: PromoCode[];
}

export const getPricingPlans = async (params?: {
  isActive?: boolean;
  type?: "subscription" | "credit";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<ApiResponse<PricingPlansResponse> | ApiErrorResponse> => {
  const queryParams = new URLSearchParams();

  if (params) {
    if (params.isActive !== undefined) {
      queryParams.append("isActive", params.isActive.toString());
    }
    if (params.type) {
      queryParams.append("type", params.type);
    }
    if (params.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params.limit) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params.sortBy) {
      queryParams.append("sortBy", params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append("sortOrder", params.sortOrder);
    }
  }

  const queryString = queryParams.toString();
  const result = await api.get(
    `/pricing${queryString ? `?${queryString}` : ""}`
  );
  return result.data;
};

export const getPromoCodes = async (params?: {
  active?: boolean;
  appliesTo?: "subscription" | "credit" | "both";
}): Promise<ApiResponse<PromoCodesResponse> | ApiErrorResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.active !== undefined) {
    queryParams.append("active", params.active.toString());
  }
  if (params?.appliesTo) {
    queryParams.append("appliesTo", params.appliesTo);
  }

  const queryString = queryParams.toString();
  const result = await api.get(
    `/promo-codes${queryString ? `?${queryString}` : ""}`
  );
  return result.data;
};

// Pricing Plan Mutations
export const createPricingPlan = async (data: {
  name: string;
  type: "subscription" | "credit";
  basePrice: number;
  discountPrice?: number;
  isActive?: boolean;
  planDuration: number;
  credit?: number;
}): Promise<ApiResponse<PricingPlan> | ApiErrorResponse> => {
  const result = await api.post("/pricing", data);
  return result.data;
};

export const updatePricingPlan = async (
  id: string,
  data: Partial<{
    name: string;
    type: "subscription" | "credit";
    basePrice: number;
    discountPrice?: number;
    discountPercent: number;
    isActive: boolean;
    planDuration: number;
    credit?: number;
  }>
): Promise<ApiResponse<PricingPlan> | ApiErrorResponse> => {
  const result = await api.put(`/pricing/${id}`, data);
  return result.data;
};

export const deletePricingPlan = async (
  id: string
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  const result = await api.delete(`/pricing/${id}`);
  return result.data;
};

// Promo Code Mutations
export const createPromoCode = async (data: {
  code: string;
  description?: string;
  discountPercent: number;
  isActive: boolean;
  appliesTo: "subscription" | "credit" | "both";
  usageLimit?: number | null;
  validFrom: string;
  validUntil: string;
}): Promise<ApiResponse<{ promoCode: PromoCode }> | ApiErrorResponse> => {
  const result = await api.post("/promo-codes", data);
  return result.data;
};

export const updatePromoCode = async (
  id: string,
  data: Partial<{
    code?: string;
    description?: string;
    discountPercent: number;
    isActive?: boolean;
    appliesTo?: "subscription" | "credit" | "both";
    usageLimit?: number | null;
    validFrom?: string;
    validUntil?: string;
  }>
): Promise<ApiResponse<{ promoCode: PromoCode }> | ApiErrorResponse> => {
  const result = await api.patch(`/promo-codes/${id}`, data);
  return result.data;
};

export const deletePromoCode = async (
  id: string
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  const result = await api.delete(`/promo-codes/${id}`);
  return result.data;
};

// Scheduler Management
export interface SchedulerStatus {
  isRunning: boolean;
  lastRun: string | null;
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    lastResult: any;
  };
  nextRun: string | null;
}

export interface MaintenanceStats {
  planDistribution: Array<{
    _id: string;
    count: number;
    totalCredits: number;
    avgCredits: number;
  }>;
  maintenanceNeeded: {
    freeUsersNeedingRefresh: number;
    expiredSubscriptions: number;
    zeroCreditPlans: number;
    total: number;
  };
  scheduler: SchedulerStatus;
  lastChecked: string;
}

export const getSchedulerStatus = async (): Promise<
  ApiResponse<SchedulerStatus> | ApiErrorResponse
> => {
  const result = await api.get("/scheduler/status");
  return result.data;
};

export const getMaintenanceStats = async (): Promise<
  ApiResponse<MaintenanceStats> | ApiErrorResponse
> => {
  const result = await api.get("/scheduler/stats");
  return result.data;
};

export const startScheduler = async (): Promise<
  ApiResponse<null> | ApiErrorResponse
> => {
  const result = await api.post("/scheduler/start");
  return result.data;
};

export const stopScheduler = async (): Promise<
  ApiResponse<null> | ApiErrorResponse
> => {
  const result = await api.post("/scheduler/stop");
  return result.data;
};

export const triggerMaintenance = async (): Promise<
  ApiResponse<any> | ApiErrorResponse
> => {
  const result = await api.post("/scheduler/trigger");
  return result.data;
};
