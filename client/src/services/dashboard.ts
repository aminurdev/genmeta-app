import { ApiErrorResponse, ApiResponse, AxiosApiError } from "@/types";
import { api } from "@/services/api-client";
import {
  Overview,
  Profile,
  ReferralData,
  RemoveDesktopDeviceResponse,
  RequestWithdrawRes,
} from "@/types/dashboard";

interface RequestWithdraw {
  withdrawAccount: string;
  amount: number;
}

export const getOverview = async (): Promise<
  ApiResponse<Overview> | ApiErrorResponse
> => {
  const result = await api.get("/users/dashboard/overview");
  return result.data;
};

export const removeDesktopDevice = async (
  deviceId: string
): Promise<ApiResponse<RemoveDesktopDeviceResponse> | ApiErrorResponse> => {
  try {
    const result = await api.delete(
      `/users/dashboard/devices/${encodeURIComponent(deviceId)}`
    );
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to remove desktop device",
      }
    );
  }
};

export const getProfile = async (): Promise<
  ApiResponse<Profile> | ApiErrorResponse
> => {
  const result = await api.get("/users/dashboard/profile");
  return result.data;
};

export const getReferralDetails = async (): Promise<
  ApiResponse<ReferralData>
> => {
  const result = await api.get("/referral/getDetails");
  return result.data;
};

export const requestWithdraw = async (
  data: RequestWithdraw
): Promise<ApiResponse<RequestWithdrawRes>> => {
  const result = await api.post("/referral/request-withdraw", data);
  return result.data;
};
