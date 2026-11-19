import { api } from "./api-client";
import { ApiResponse, ApiErrorResponse } from "@/types";
import { SuperAdminOverview, StaffListResponse, StaffAccount } from "@/types/admin";

export const getSuperAdminOverview = async (): Promise<
  ApiResponse<SuperAdminOverview> | ApiErrorResponse
> => {
  const result = await api.get("/admin/super-admin/overview");
  return result.data;
};

export const getAdminList = async (): Promise<
  ApiResponse<StaffListResponse> | ApiErrorResponse
> => {
  const result = await api.get("/admin/super-admin/admins");
  return result.data;
};

export interface UpdateRolePayload {
  userId: string;
  role: "user" | "admin" | "superAdmin";
}

export const updateUserRole = async (
  payload: UpdateRolePayload
): Promise<ApiResponse<StaffAccount> | ApiErrorResponse> => {
  const result = await api.patch("/admin/super-admin/update-role", payload);
  return result.data;
};

export interface ToggleStatusPayload {
  userId: string;
  isDisabled: boolean;
}

export const toggleUserStatus = async (
  payload: ToggleStatusPayload
): Promise<ApiResponse<StaffAccount> | ApiErrorResponse> => {
  const result = await api.patch("/admin/super-admin/toggle-status", payload);
  return result.data;
};
