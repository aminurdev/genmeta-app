import { api } from "./api-client";
import type { ApiErrorResponse, ApiResponse, AxiosApiError } from "@/types";
import type {
  StaffListResponse,
  SuperAdminOverview,
  ToggleStatusResponse,
  UpdateRoleResponse,
} from "@/types/admin";

function toSuperAdminApiError(
  error: unknown,
  fallbackMessage: string
): ApiErrorResponse {
  const err = error as AxiosApiError;
  if (err?.response?.data && typeof err.response.data === "object") {
    return {
      success: false,
      statusCode: err.response.data.statusCode ?? err.response.status ?? 500,
      message: err.response.data.message || fallbackMessage,
      code: err.response.data.code,
      data: err.response.data.data ?? null,
    };
  }
  return {
    success: false,
    statusCode: err?.response?.status ?? 500,
    message: error instanceof Error ? error.message : fallbackMessage,
    data: null,
  };
}

export const getSuperAdminOverview = async (options?: {
  refresh?: boolean;
}): Promise<ApiResponse<SuperAdminOverview> | ApiErrorResponse> => {
  try {
    const result = await api.get("/admin/super-admin/overview", {
      params: options?.refresh ? { refresh: "true" } : undefined,
    });
    return result.data;
  } catch (error) {
    return toSuperAdminApiError(
      error,
      "Failed to load super admin system overview"
    );
  }
};

export const getAdminList = async (options?: {
  refresh?: boolean;
}): Promise<ApiResponse<StaffListResponse> | ApiErrorResponse> => {
  try {
    const result = await api.get("/admin/super-admin/admins", {
      params: options?.refresh ? { refresh: "true" } : undefined,
    });
    return result.data;
  } catch (error) {
    return toSuperAdminApiError(error, "Failed to load staff accounts");
  }
};

export interface UpdateRolePayload {
  userId?: string;
  email?: string;
  identifier?: string;
  role: "user" | "admin" | "superAdmin";
}

export const updateUserRole = async (
  payload: UpdateRolePayload
): Promise<ApiResponse<UpdateRoleResponse> | ApiErrorResponse> => {
  try {
    const result = await api.patch("/admin/super-admin/update-role", payload);
    return result.data;
  } catch (error) {
    return toSuperAdminApiError(error, "Failed to update user role");
  }
};

export interface ToggleStatusPayload {
  userId: string;
  isDisabled: boolean;
}

export const toggleUserStatus = async (
  payload: ToggleStatusPayload
): Promise<ApiResponse<ToggleStatusResponse> | ApiErrorResponse> => {
  try {
    const result = await api.patch("/admin/super-admin/toggle-status", payload);
    return result.data;
  } catch (error) {
    return toSuperAdminApiError(error, "Failed to update account status");
  }
};
