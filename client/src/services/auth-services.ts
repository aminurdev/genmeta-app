import { FieldValues } from "react-hook-form";
import { deleteTokens, getClientCookie } from "@/lib/cookies";
import { hasServerAuthCookies } from "@/lib/cookies-server";
import { SESSION_HINT_COOKIE_NAME } from "@/lib/auth-constants";
import { ENV } from "@/lib/env";
import { api } from "./api-client";
import {
  ApiErrorResponse,
  ApiResponse,
  AxiosApiError,
  AxiosApiResponse,
} from "@/types";
import type {
  ActiveSessionsResponse,
  AuthUser,
  CurrentUserResponse,
  LoginResponse,
  RegisterResponse,
  RequestResetResponse,
  ResendVerificationResponse,
  SessionInfo,
  VerifyGoogleResponse,
  VerifyOtpResponse,
} from "@/types/auth";

export type User = AuthUser;

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
  referral: string | null = null
): Promise<ApiResponse<RegisterResponse> | ApiErrorResponse> => {
  try {
    const payload = referral ? { ...userData, referralCode: referral } : userData;
    const result = await api.post("/users/register", payload);
    return result.data;
  } catch (error) {
    return formatApiError(error, "Registration failed");
  }
};

export const resendVerificationEmail = async (
  email: string
): Promise<ApiResponse<ResendVerificationResponse> | ApiErrorResponse> => {
  try {
    const result = await api.post("/users/resend-verification-email", { email });
    return result.data;
  } catch (error) {
    return formatApiError(error, "Failed to resend verification email");
  }
};

export const verifyEmail = async (
  payload: { email: string; otp: string } | { token: string }
): Promise<ApiResponse<LoginResponse> | ApiErrorResponse> => {
  try {
    const result: AxiosApiResponse<LoginResponse> = await api.post(
      "/users/verify-email",
      payload
    );
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
    return result.data;
  } catch (error) {
    return formatApiError(error, "Login failed");
  }
};

export const verifyGoogleToken = async (
  code: string,
  referral: string | null = null
): Promise<ApiResponse<VerifyGoogleResponse> | ApiErrorResponse> => {
  try {
    const result: AxiosApiResponse<VerifyGoogleResponse> = await api.post(
      "/users/verify-google",
      {
        code,
        referralCode: referral,
      }
    );
    return result.data;
  } catch (error) {
    return formatApiError(error, "Google verification failed");
  }
};

export const refreshAccessToken = async (): Promise<
  ApiResponse<LoginResponse> | ApiErrorResponse
> => {
  try {
    const result: AxiosApiResponse<LoginResponse> = await api.post(
      "/users/refresh-token",
      {}
    );
    return result.data;
  } catch (error) {
    return formatApiError(error, "Token refresh failed");
  }
};

export const getCurrentUser = async (
  force: boolean = false
): Promise<User | null> => {
  try {
    if (typeof window === "undefined") {
      const hasCookies = await hasServerAuthCookies();
      if (!hasCookies) {
        return null;
      }
    } else if (!force && getClientCookie(SESSION_HINT_COOKIE_NAME) !== "1") {
      return null;
    }

    const result: AxiosApiResponse<CurrentUserResponse> = await api.get(
      "/users/me"
    );
    return result.data?.data?.user || null;
  } catch {
    return null;
  }
};

export const getCurrentUserWithRefresh = getCurrentUser;

export const logout = async () => {
  try {
    try {
      await api.post("/users/logout", {});
    } catch {
      // Non-blocking if server logout fails
    }
    await deleteTokens();
    return { success: true, message: "Successfully logged out." };
  } catch (error) {
    console.error("Error during logout:", error);
    return {
      success: false,
      message: "An unexpected error occurred during logout.",
    };
  }
};

export const logoutAllSessions = async (): Promise<
  ApiResponse<null> | ApiErrorResponse
> => {
  try {
    const result = await api.post("/users/logout-all", {});
    await deleteTokens();
    return result.data;
  } catch (error) {
    return formatApiError(error, "Failed to sign out from all devices");
  }
};

export const getActiveSessions = async (): Promise<
  ApiResponse<ActiveSessionsResponse> | ApiErrorResponse
> => {
  try {
    const result: AxiosApiResponse<ActiveSessionsResponse> = await api.get(
      "/users/sessions"
    );
    return result.data;
  } catch (error) {
    return formatApiError(error, "Failed to load active sessions");
  }
};

export const revokeSession = async (
  sessionId: string
): Promise<
  ApiResponse<{ sessionId: string; revokedCurrent: boolean }> | ApiErrorResponse
> => {
  try {
    const result = await api.delete(`/users/sessions/${sessionId}`);
    if (result.data?.data?.revokedCurrent) {
      await deleteTokens();
    }
    return result.data;
  } catch (error) {
    return formatApiError(error, "Failed to revoke session");
  }
};

export const requestPasswordReset = async (
  email: string
): Promise<ApiResponse<RequestResetResponse> | ApiErrorResponse> => {
  try {
    const result = await api.post("/users/request-password-reset", { email });
    return result.data;
  } catch (error) {
    return formatApiError(error, "Failed to request password reset");
  }
};

export const verifyOTP = async (
  email: string,
  otp: string
): Promise<ApiResponse<VerifyOtpResponse> | ApiErrorResponse> => {
  try {
    const result = await api.post("/users/verify-otp", { email, otp });
    return result.data;
  } catch (error) {
    return formatApiError(error, "OTP verification failed");
  }
};

export const resetPassword = async (
  newPassword: string,
  confirmNewPassword: string,
  resetToken: string
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  try {
    const result = await api.post("/users/reset-password", {
      newPassword,
      confirmNewPassword,
      resetToken,
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

export type { SessionInfo };
