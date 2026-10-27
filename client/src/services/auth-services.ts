import { jwtDecode } from "jwt-decode";
import { FieldValues } from "react-hook-form";
import {
  deleteTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/cookies";
import { ENV } from "@/lib/env";
import { api } from "./api-client";
import {
  ApiErrorResponse,
  ApiResponse,
  AxiosApiError,
  AxiosApiResponse,
} from "@/types";
import {
  LoginResponse,
  RefreshAccessTokenResponse,
  OtpResponse,
  TempTokenResponse,
} from "@/types/auth";

export interface User {
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin" | "superAdmin";
  avatar?: string;
  iat: number;
  exp: number;
}

export const getBaseApi = async () => {
  return ENV.apiBaseUrl;
};

const formatApiError = (error: unknown, defaultMsg: string): ApiErrorResponse => {
  const err = error as AxiosApiError;
  return (
    err.response?.data ?? {
      success: false,
      statusCode: err.response?.status ?? 500,
      message: err.response?.data?.message || err.message || defaultMsg,
    }
  );
};

export const registerUser = async (
  userData: FieldValues,
  referral: string | null
): Promise<ApiResponse<OtpResponse> | ApiErrorResponse> => {
  try {
    if (referral) userData.referralCode = referral;
    const result = await api.post("/users/register", userData);
    return result.data;
  } catch (error) {
    return formatApiError(error, "Registration failed");
  }
};

export const resendVerificationEmail = async (
  email: string
): Promise<ApiResponse<OtpResponse> | ApiErrorResponse> => {
  try {
    const result = await api.post("/users/resend-verification-email", {
      email,
    });
    return result.data;
  } catch (error) {
    return formatApiError(error, "Failed to resend verification email");
  }
};

export const verifyEmail = async (
  otpToken: string,
  otp: string
): Promise<ApiResponse<LoginResponse> | ApiErrorResponse> => {
  try {
    const result: AxiosApiResponse<LoginResponse> = await api.post(
      "/users/verify-email",
      {
        otpToken,
        otp,
      }
    );

    if (result.data.success && result.data.data?.user) {
      const { accessToken, refreshToken } = result.data.data.user;
      if (accessToken && refreshToken) {
        await setTokens(accessToken, refreshToken);
      }
    }

    return result.data;
  } catch (error) {
    return formatApiError(error, "Verification failed");
  }
};

export const loginUser = async (
  userData: FieldValues
): Promise<ApiResponse<LoginResponse> | ApiErrorResponse> => {
  try {
    const result: AxiosApiResponse<LoginResponse> = await api.post(
      "/users/login",
      userData
    );

    if (result.data.success && result.data.data?.user) {
      const { accessToken, refreshToken } = result.data.data.user;
      if (accessToken && refreshToken) {
        await setTokens(accessToken, refreshToken);
      }
    }

    return result.data;
  } catch (error) {
    return formatApiError(error, "Login failed");
  }
};

export const verifyGoogleToken = async (
  token: string,
  referral: string | null
): Promise<ApiResponse<LoginResponse> | ApiErrorResponse> => {
  try {
    const result: AxiosApiResponse<LoginResponse> = await api.post(
      "/users/verify-google",
      {
        token,
        referralCode: referral,
      }
    );

    if (result.data.success && result.data.data?.user) {
      const { accessToken, refreshToken } = result.data.data.user;
      if (accessToken && refreshToken) {
        await setTokens(accessToken, refreshToken);
      }
    }

    return result.data;
  } catch (error) {
    return formatApiError(error, "Google verification failed");
  }
};

export const refreshAccessToken = async (): Promise<
  ApiResponse<RefreshAccessTokenResponse> | ApiErrorResponse
> => {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return {
        success: false,
        statusCode: 401,
        message: "No refresh token found",
      };
    }

    const result: AxiosApiResponse<RefreshAccessTokenResponse> = await api.post(
      "/users/refresh-token",
      {
        refreshToken,
      }
    );

    if (result.data.success && result.data.data) {
      const { accessToken, refreshToken: newRefreshToken } = result.data.data;
      if (accessToken && newRefreshToken) {
        await setTokens(accessToken, newRefreshToken);
      }
    }

    return result.data;
  } catch (error) {
    return formatApiError(error, "Token refresh failed");
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return null;
  }

  try {
    const decoded = jwtDecode<User>(accessToken);
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      // Token is expired, try to refresh
      const refreshed = await refreshAccessToken();
      if (refreshed.success && refreshed.data?.accessToken) {
        return jwtDecode<User>(refreshed.data.accessToken);
      }
      return null;
    }
    return decoded;
  } catch (error) {
    console.warn("Failed to decode user token:", error);
    return null;
  }
};

export const getCurrentUserWithRefresh = getCurrentUser;

export const logout = async () => {
  try {
    try {
      await api.post("/users/logout");
    } catch {
      // Non-blocking if server logout fails
    }
    await deleteTokens();
    return { success: true, message: "Successfully logged out." };
  } catch (error) {
    console.error("Error during logout:", error);
    return { success: false, message: "An unexpected error occurred during logout." };
  }
};

export const requestPasswordReset = async (
  email: string
): Promise<ApiResponse<OtpResponse> | ApiErrorResponse> => {
  try {
    const result = await api.post("/users/request-password-reset", { email });
    return result.data;
  } catch (error) {
    return formatApiError(error, "Failed to request password reset");
  }
};

export const verifyOTP = async (
  otp: string,
  otpToken: string
): Promise<ApiResponse<TempTokenResponse> | ApiErrorResponse> => {
  try {
    const result = await api.post("/users/verify-otp", { otp, otpToken });
    return result.data;
  } catch (error) {
    return formatApiError(error, "OTP verification failed");
  }
};

export const resetPassword = async (
  newPassword: string,
  confirmNewPassword: string,
  tempToken: string
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  try {
    const result = await api.post("/users/reset-password", {
      newPassword,
      confirmNewPassword,
      tempToken,
    });
    return result.data;
  } catch (error) {
    return formatApiError(error, "Failed to reset password");
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  try {
    const result = await api.patch("/users/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return result.data;
  } catch (error) {
    return formatApiError(error, "Failed to change password");
  }
};
