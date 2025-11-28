import { jwtDecode } from "jwt-decode";
import { FieldValues } from "react-hook-form";
import {
  deleteTokens,
  getAccessToken,
  getTokenFromCookie,
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
  role: "user" | "admin";
  iat: number;
  exp: number;
}

export const getBaseApi = async () => {
  return ENV.apiBaseUrl;
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
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Unexpected error occurred",
      }
    );
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
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Unexpected error occurred",
      }
    );
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

    if (result.data.success) {
      const accessToken = result.data.data?.user.accessToken;
      const refreshToken = result.data.data?.user.refreshToken;
      if (accessToken && refreshToken)
        await setTokens(accessToken, refreshToken);
    }

    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Unexpected error occurred",
      }
    );
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

    if (result.data.success) {
      const accessToken = result.data.data?.user.accessToken;
      const refreshToken = result.data.data?.user.refreshToken;
      if (accessToken && refreshToken)
        await setTokens(accessToken, refreshToken);
    }

    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Unexpected error occurred",
      }
    );
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

    if (result.data.success) {
      const accessToken = result.data.data?.user.accessToken;
      const refreshToken = result.data.data?.user.refreshToken;
      if (accessToken && refreshToken) {
        await setTokens(accessToken, refreshToken);
      }
    }

    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Unexpected error occurred",
      }
    );
  }
};

export const refreshAccessToken = async (): Promise<
  ApiResponse<RefreshAccessTokenResponse> | ApiErrorResponse
> => {
  try {
    const refreshToken = await getTokenFromCookie("refreshToken");

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

    if (result.data.success) {
      const accessToken = result.data.data?.accessToken;
      const refreshToken = result.data.data?.refreshToken;
      if (accessToken && refreshToken) {
        await setTokens(accessToken, refreshToken);
      }
    }

    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Unexpected error occurred",
      }
    );
  }
};

const getAccessTokenOrRefreshAccessToken = async () => {
  let accessToken = await getTokenFromCookie("accessToken");

  if (!accessToken) {
    // No access token found, try to refresh
    const refreshResult = await refreshAccessToken();

    if (refreshResult.success) {
      accessToken = refreshResult.data?.accessToken || null;
    } else {
      return null;
    }
  } else {
    // Check if token is expired
    const isTokenExpired = (token: string): boolean => {
      try {
        const decoded = jwtDecode<User>(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
      } catch {
        return true;
      }
    };

    if (isTokenExpired(accessToken)) {
      const refreshResult = await refreshAccessToken();

      if (refreshResult.success) {
        accessToken = refreshResult.data?.accessToken || null;
      } else {
        return null;
      }
    }
  }

  return accessToken;
};

export const getCurrentUser = async () => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return null;
  }

  try {
    const decodedData = jwtDecode<User>(accessToken);
    return decodedData;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

export const getCurrentUserWithRefresh = async () => {
  const accessToken = await getAccessTokenOrRefreshAccessToken();

  if (!accessToken) {
    return null;
  }

  try {
    const decodedData = jwtDecode<User>(accessToken);
    return decodedData;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

export const logout = async () => {
  try {
    await deleteTokens();
    return { success: true, message: "SuccessFully logout." };
  } catch (error) {
    console.error("Error during logout:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
};

export const requestPasswordReset = async (
  email: string
): Promise<ApiResponse<OtpResponse> | ApiErrorResponse> => {
  try {
    const result = await api.post("/users/request-password-reset", {
      email,
    });
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Unexpected error occurred",
      }
    );
  }
};

export const verifyOTP = async (
  otp: string,
  otpToken: string
): Promise<ApiResponse<TempTokenResponse> | ApiErrorResponse> => {
  try {
    const result = await api.post("/users/verify-otp", {
      otp,
      otpToken,
    });
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Unexpected error occurred",
      }
    );
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
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Unexpected error occurred",
      }
    );
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<ApiResponse<null> | ApiErrorResponse> => {
  try {
    const result = await api.post("/users/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Unexpected error occurred",
      }
    );
  }
};
