import { ApiErrorResponse, ApiResponse } from "@/types";
import { api } from "@/services/api-client";
import { Overview, Profile } from "@/types/dashboard";

export const getOverview = async (): Promise<
  ApiResponse<Overview> | ApiErrorResponse
> => {
  const result = await api.get("/users/dashboard/overview");
  return result.data;
};

export const getProfile = async (): Promise<
  ApiResponse<Profile> | ApiErrorResponse
> => {
  const result = await api.get("/users/dashboard/profile");
  return result.data;
};
