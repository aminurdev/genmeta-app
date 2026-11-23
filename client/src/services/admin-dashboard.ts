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
  AdminPaymentTransactionsResponse,
  GetAdminPaymentTransactionsParams,
  ReconcilePaymentResponse,
  ReconcilePendingResponse,
  VerifyPaystationTrxResponse,
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
  userId: string,
  options?: { refresh?: boolean },
): Promise<ApiResponse<AdminUserDetailsResponse> | ApiErrorResponse> => {
  try {
    const result = await api.get(
      `/app/appuser/user/details/${encodeURIComponent(userId)}`,
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
  userId: string,
  deviceId?: string,
): Promise<
  | ApiResponse<{ devices: AdminDesktopDevice[]; allowedDevices: string[] }>
  | ApiErrorResponse
> => {
  try {
    const result = await api.put(`/app/appuser/reset-device`, {
      userId,
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
  userId: string,
  mode: "suspend" | "reactivate",
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  try {
    const result = await api.put(`/app/appuser/update-status`, {
      userId,
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
  userIdOrUsername: string,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  try {
    const result = await api.delete(
      `/app/appuser/delete/${encodeURIComponent(userIdOrUsername)}`,
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
  userId: string,
  credits: number,
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  try {
    const result = await api.put("/app/appuser/add-credits", {
      userId,
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

export const getPaymentsHistory = async (
  params: GetPaymentsHistoryParams = {},
  options?: { refresh?: boolean },
): Promise<ApiResponse<PaymentResponse> | ApiErrorResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
    if (params.status && params.status !== "all") {
      queryParams.append("status", params.status);
    }
    if (params.planType && params.planType !== "all") {
      queryParams.append("planType", params.planType);
    }
    if (params.gateway && params.gateway !== "all") {
      queryParams.append("gateway", params.gateway);
    }
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (options?.refresh) queryParams.append("refresh", "true");

    const queryString = queryParams.toString();
    const result = await api.get(
      `/admin/paymentHistory/get${queryString ? `?${queryString}` : ""}`,
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

export const downloadPaymentHistory = async (
  params: GetPaymentsHistoryParams = {},
): Promise<{ success: true; csv: string } | ApiErrorResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append("search", params.search);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
    if (params.status && params.status !== "all") {
      queryParams.append("status", params.status);
    }
    if (params.planType && params.planType !== "all") {
      queryParams.append("planType", params.planType);
    }
    if (params.gateway && params.gateway !== "all") {
      queryParams.append("gateway", params.gateway);
    }
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const queryString = queryParams.toString();
    const result = await api.get<string>(
      `/admin/paymentHistory/download${queryString ? `?${queryString}` : ""}`,
      {
        responseType: "text",
        headers: { Accept: "text/csv" },
      },
    );

    return { success: true, csv: String(result.data ?? "") };
  } catch (error) {
    const err = error as AxiosApiError;
    const rawData = err.response?.data as unknown;
    if (typeof rawData === "string") {
      try {
        return JSON.parse(rawData) as ApiErrorResponse;
      } catch {
        return {
          success: false,
          statusCode: err.response?.status ?? 500,
          message: rawData || "Failed to export CSV",
          data: null,
        };
      }
    }
    if (err.response?.data) {
      return err.response.data;
    }
    throw error;
  }
};

export const getAdminPaymentTransactions = async (
  params: GetAdminPaymentTransactionsParams = {},
  options?: { refresh?: boolean },
): Promise<ApiResponse<AdminPaymentTransactionsResponse> | ApiErrorResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.status && params.status !== "all") {
      queryParams.append("status", params.status);
    }
    if (params.search) queryParams.append("search", params.search);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (options?.refresh) queryParams.append("refresh", "true");

    const queryString = queryParams.toString();
    const result = await api.get(
      `/payment/admin/transactions${queryString ? `?${queryString}` : ""}`,
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

export const reconcilePaymentByInvoice = async (
  invoiceNumber: string,
): Promise<ApiResponse<ReconcilePaymentResponse> | ApiErrorResponse> => {
  try {
    const result = await api.post(
      `/payment/admin/reconcile/${encodeURIComponent(invoiceNumber)}`,
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

export const reconcilePendingPayments = async (
  limit: number = 20,
): Promise<ApiResponse<ReconcilePendingResponse> | ApiErrorResponse> => {
  try {
    const result = await api.post(
      `/payment/admin/reconcile-pending?limit=${limit}`,
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

export const verifyPaystationTrx = async (
  trxId: string,
): Promise<ApiResponse<VerifyPaystationTrxResponse> | ApiErrorResponse> => {
  try {
    const result = await api.get(
      `/payment/admin/verify-trx/${encodeURIComponent(trxId)}`,
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
export interface SchedulerMeta {
  generatedAt: string;
  refreshed?: boolean;
}

export interface MaintenanceRunResult {
  success: boolean;
  freeUsersRefreshed?: number;
  expiredSubscriptionsDowngraded?: number;
  zeroCreditPlansDowngraded?: number;
  expiredCreditPlansDowngraded?: number;
  error?: string;
  timestamp: string;
}

export interface PaymentReconciliationResult {
  checked?: number;
  completed?: number;
  failed?: number;
  expired?: number;
  errors?: number;
  success?: boolean;
  error?: string;
  timestamp?: string;
}

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
      lastResult: MaintenanceRunResult | null;
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
      lastBackupResult: {
        success?: boolean;
        timestamp?: string;
        duration?: string;
        totalDocuments?: number;
        error?: string;
      } | null;
    };
  };
  paymentReconciliation?: {
    lastRun: string | null;
    nextRun: string | null;
    cronExpression: string;
    stats: {
      totalRuns: number;
      successfulRuns: number;
      failedRuns: number;
      lastRun: string | null;
      lastResult: PaymentReconciliationResult | null;
    };
  };
  timezone: string;
  meta?: SchedulerMeta;
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
    expiredCreditPlans: number;
    total: number;
  };
  scheduler: SchedulerStatus;
  lastChecked: string;
  meta?: SchedulerMeta;
}

function handleSchedulerApiError(error: unknown): ApiErrorResponse {
  const err = error as AxiosApiError;
  if (err?.response?.data && typeof err.response.data === "object") {
    return err.response.data;
  }
  return {
    success: false,
    statusCode: err?.response?.status ?? 500,
    message:
      error instanceof Error ? error.message : "Scheduler request failed",
    data: null,
  };
}

export const getSchedulerStatus = async (options?: {
  refresh?: boolean;
}): Promise<ApiResponse<SchedulerStatus> | ApiErrorResponse> => {
  try {
    const result = await api.get("/scheduler/status", {
      params: options?.refresh ? { refresh: "true" } : undefined,
    });
    return result.data;
  } catch (error) {
    return handleSchedulerApiError(error);
  }
};

export const getMaintenanceStats = async (options?: {
  refresh?: boolean;
}): Promise<ApiResponse<MaintenanceStats> | ApiErrorResponse> => {
  try {
    const result = await api.get("/scheduler/stats", {
      params: options?.refresh ? { refresh: "true" } : undefined,
    });
    return result.data;
  } catch (error) {
    return handleSchedulerApiError(error);
  }
};

export const startScheduler = async (): Promise<
  ApiResponse<{ isRunning: boolean; status?: SchedulerStatus }> | ApiErrorResponse
> => {
  try {
    const result = await api.post("/scheduler/start", {});
    return result.data;
  } catch (error) {
    return handleSchedulerApiError(error);
  }
};

export const stopScheduler = async (): Promise<
  ApiResponse<{ isRunning: boolean; status?: SchedulerStatus }> | ApiErrorResponse
> => {
  try {
    const result = await api.post("/scheduler/stop", {});
    return result.data;
  } catch (error) {
    return handleSchedulerApiError(error);
  }
};

export const triggerMaintenance = async (): Promise<
  ApiResponse<MaintenanceRunResult> | ApiErrorResponse
> => {
  try {
    const result = await api.post("/scheduler/trigger", {});
    return result.data;
  } catch (error) {
    return handleSchedulerApiError(error);
  }
};

export const getWithdrawalNotifications = async (): Promise<
  ApiResponse<WithdrawalNotificationsResponse> | ApiErrorResponse
> => {
  const result = await api.get("/admin/notifications/referral-withdrawals");
  return result.data;
};