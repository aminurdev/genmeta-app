/* eslint-disable @typescript-eslint/no-explicit-any */

import { ApiErrorResponse, ApiResponse, AxiosApiError } from "@/types";
import { api } from "./api-client";
import {
  AllUsersResponse,
  AdminDashboardStats,
  AdminDesktopDevice,
  AdminUserDetailsResponse,
  CreateAppUserPayload,
  CreateAppUserResponse,
  UpdateAppUserPayload,
  UpdateAppUserResponse,
  UsersStatisticsData,
  PaymentResponse,
  DownloadPaymentHistory,
  AllReferralsResponse,
  GetAllReferralsParams,
  ReferralDetails,
  UpdateWithdrawalRes,
  GetPaymentsHistoryParams,
  WithdrawalNotificationsResponse,
  PricingPlan,
  PaginationData,
  PricingPlansResponse,
  GetPricingPlansParams,
  PromoCode,
  PromoCodesResponse,
  GetPromoCodesParams,
} from "@/types/admin";

export type {
  PricingPlan,
  PaginationData,
  PricingPlansResponse,
  GetPricingPlansParams,
  PromoCode,
  PromoCodesResponse,
  GetPromoCodesParams,
};

export const getAdminOverview = async (options?: {
  refresh?: boolean;
}): Promise<ApiResponse<AdminDashboardStats> | ApiErrorResponse> => {
  try {
    const result = await api.get("/admin/dashboard/stats", {
      params: options?.refresh ? { refresh: "true" } : undefined,
    });
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const getAllUsers = async (
  queryParams: string,
  options?: { refresh?: boolean },
): Promise<ApiResponse<AllUsersResponse> | ApiErrorResponse> => {
  try {
    const separator = queryParams ? "&" : "";
    const refreshSuffix = options?.refresh ? `${separator}refresh=true` : "";
    const query = `${queryParams}${refreshSuffix}`;
    const result = await api.get(`/admin/users/all${query ? `?${query}` : ""}`);
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const getUserStats = async (options?: {
  refresh?: boolean;
}): Promise<ApiResponse<UsersStatisticsData> | ApiErrorResponse> => {
  try {
    const result = await api.get("/admin/users/statistics", {
      params: options?.refresh ? { refresh: "true" } : undefined,
    });
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const getAppUserDetails = async (
  keyOrId: string,
  options?: { refresh?: boolean },
): Promise<ApiResponse<AdminUserDetailsResponse> | ApiErrorResponse> => {
  try {
    const result = await api.get(
      `/app/appuser/user/details/${encodeURIComponent(keyOrId)}`,
      {
        params: options?.refresh ? { refresh: "true" } : undefined,
      },
    );
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const resetDeviceId = async (
  key: string,
  deviceId?: string,
): Promise<
  | ApiResponse<{ devices: AdminDesktopDevice[]; allowedDevices: string[] }>
  | ApiErrorResponse
> => {
  try {
    const result = await api.put(`/app/appuser/reset-device`, {
      key,
      ...(deviceId ? { deviceId } : {}),
    });
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const updateUserStats = async (
  key: string,
  mode: "suspend" | "reactivate",
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  try {
    const result = await api.put(`/app/appuser/update-status`, {
      key,
      mode,
    });
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const updateUser = async (
  requestBody: UpdateAppUserPayload,
): Promise<ApiResponse<UpdateAppUserResponse> | ApiErrorResponse> => {
  try {
    const result = await api.put("/app/appuser/update", requestBody);
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const createUser = async (
  requestBody: CreateAppUserPayload,
): Promise<ApiResponse<CreateAppUserResponse> | ApiErrorResponse> => {
  try {
    const result = await api.post("/app/appuser/create", requestBody);
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const deleteAppUser = async (
  username: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  try {
    const result = await api.delete(
      `/app/appuser/delete/${encodeURIComponent(username)}`,
    );
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const addCredits = async (
  key: string,
  credits: number,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  try {
    const result = await api.put("/app/appuser/add-credits", {
      key,
      credits,
    });
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
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
    }&startDate=${startDate ?? ""}&endDate=${endDate ?? ""}`,
  );
  return result.data;
};

export const downloadPaymentHistory = async (
  queryParams?: string,
): Promise<DownloadPaymentHistory> => {
  const result = await api.get(`/admin/paymentHistory/download?${queryParams}`);

  return result.data;
};

export const getAllReferral = async (
  params?: GetAllReferralsParams,
  options?: { refresh?: boolean },
): Promise<ApiResponse<AllReferralsResponse> | ApiErrorResponse> => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status && params.status !== "all") {
      queryParams.append("status", params.status);
    }
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);
    if (options?.refresh) queryParams.append("refresh", "true");

    const queryString = queryParams.toString();
    const result = await api.get(
      `/admin/referral${queryString ? `?${queryString}` : ""}`,
    );

    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const getAllReferralByUserId = async (
  userId: string,
  options?: { refresh?: boolean },
): Promise<ApiResponse<ReferralDetails> | ApiErrorResponse> => {
  try {
    const result = await api.get(
      `/admin/referral/${encodeURIComponent(userId)}`,
      {
        params: options?.refresh ? { refresh: "true" } : undefined,
      },
    );

    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const updateWithdrawal = async (
  userId: string,
  withdrawalId: string,
  status: "completed" | "rejected",
  trx?: string,
  notes?: string,
): Promise<ApiResponse<UpdateWithdrawalRes> | ApiErrorResponse> => {
  try {
    const result = await api.patch(
      `/admin/referral/${encodeURIComponent(userId)}/withdrawals/${encodeURIComponent(withdrawalId)}`,
      {
        status,
        ...(trx ? { trx } : {}),
        ...(notes ? { notes } : {}),
      },
    );
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const getPricingPlans = async (
  params?: GetPricingPlansParams,
  options?: { refresh?: boolean },
): Promise<ApiResponse<PricingPlansResponse> | ApiErrorResponse> => {
  try {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.search) {
        queryParams.append("search", params.search);
      }
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
    if (options?.refresh) {
      queryParams.append("refresh", "true");
    }

    const queryString = queryParams.toString();
    const result = await api.get(
      `/pricing${queryString ? `?${queryString}` : ""}`,
    );
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const getPromoCodes = async (
  params?: GetPromoCodesParams,
  options?: { refresh?: boolean },
): Promise<ApiResponse<PromoCodesResponse> | ApiErrorResponse> => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.search) {
      queryParams.append("search", params.search);
    }
    if (params?.status && params.status !== "all") {
      queryParams.append("status", params.status);
    }
    if (params?.active !== undefined) {
      queryParams.append("active", params.active.toString());
    }
    if (params?.appliesTo) {
      queryParams.append("appliesTo", params.appliesTo);
    }
    if (params?.sortBy) {
      queryParams.append("sortBy", params.sortBy);
    }
    if (params?.sortOrder) {
      queryParams.append("sortOrder", params.sortOrder);
    }
    if (params?.page) {
      queryParams.append("page", params.page.toString());
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }
    if (options?.refresh) {
      queryParams.append("refresh", "true");
    }

    const queryString = queryParams.toString();
    const result = await api.get(
      `/promo-codes${queryString ? `?${queryString}` : ""}`,
    );
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

// Pricing Plan Mutations
export const createPricingPlan = async (data: {
  name: string;
  type: "subscription" | "credit";
  basePrice: number;
  discountPrice?: number;
  discountPercent?: number;
  isActive?: boolean;
  planDuration: number;
  credit?: number;
}): Promise<ApiResponse<PricingPlan> | ApiErrorResponse> => {
  try {
    const result = await api.post("/pricing", data);
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const updatePricingPlan = async (
  id: string,
  data: Partial<{
    name: string;
    type: "subscription" | "credit";
    basePrice: number;
    discountPrice?: number;
    discountPercent?: number;
    isActive: boolean;
    planDuration: number;
    credit?: number | null;
  }>,
): Promise<ApiResponse<PricingPlan> | ApiErrorResponse> => {
  try {
    const result = await api.put(`/pricing/${encodeURIComponent(id)}`, data);
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const deletePricingPlan = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  try {
    const result = await api.delete(`/pricing/${encodeURIComponent(id)}`);
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
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
  try {
    const result = await api.post("/promo-codes", data);
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
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
  }>,
): Promise<ApiResponse<{ promoCode: PromoCode }> | ApiErrorResponse> => {
  try {
    const result = await api.patch(`/promo-codes/${encodeURIComponent(id)}`, data);
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const deletePromoCode = async (
  id: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  try {
    const result = await api.delete(`/promo-codes/${encodeURIComponent(id)}`);
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

// Scheduler Management
export interface SchedulerStatus {
  isRunning: boolean;
  maintenance: {
    lastRun: string | null;
    nextRun: string | null;
    cronExpression: string;
    stats: {
      totalRuns: number;
      successfulRuns: number;
      failedRuns: number;
      lastResult: any;
    };
  };
  backup: {
    lastBackup: string | null;
    nextBackup: string | null;
    cronExpression: string;
    stats: {
      totalBackups: number;
      successfulBackups: number;
      failedBackups: number;
      lastBackupResult: any;
    };
  };
  timezone: string;
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

export const getWithdrawalNotifications = async (): Promise<
  ApiResponse<WithdrawalNotificationsResponse> | ApiErrorResponse
> => {
  const result = await api.get("/admin/notifications/referral-withdrawals");
  return result.data;
};