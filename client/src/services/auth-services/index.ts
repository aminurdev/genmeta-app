"use server";

import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { FieldValues } from "react-hook-form";
import { apiRequest } from "../api";

export interface User {
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  iat: number;
  exp: number;
}

const baseApi = process.env.NEXT_PUBLIC_API_BASE_URL as string;
export const getBaseApi = async () => {
  return baseApi;
};

// Common token management utilities
const getTokenCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge,
  path: "/",
});

export const getTokenFromCookie = async (
  tokenType: "accessToken" | "refreshToken"
): Promise<string | null> => {
  const token = (await cookies()).get(tokenType)?.value;
  return token || null;
};

export const setTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(
    "accessToken",
    accessToken,
    getTokenCookieOptions(
      60 * 60 * 24 * Number(process.env.ACCESS_TOKEN_EXPIRY)
    )
  );
  cookieStore.set(
    "refreshToken",
    refreshToken,
    getTokenCookieOptions(
      60 * 60 * 24 * Number(process.env.REFRESH_TOKEN_EXPIRY)
    )
  );
};

export const deleteTokens = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
};

export const registerUser = async (userData: FieldValues) => {
  try {
    if (!userData.email || !userData.password) {
      return { success: false, message: "Email and password are required" };
    }

    const result = await apiRequest({
      method: "post",
      endpoint: "/users/register",
      useAuth: false,
      data: userData,
    });
    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to register user",
    };
  }
};

export const resendVerificationEmail = async (email: string) => {
  try {
    const result = await apiRequest({
      method: "post",
      endpoint: "/users/resend-verification-email",
      useAuth: false,
      data: { email },
    });
    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to resend verification email",
    };
  }
};

export const verifyEmail = async (otpToken: string, otp: string) => {
  try {
    const result = await apiRequest({
      method: "post",
      endpoint: "/users/verify-email",
      useAuth: false,
      data: { otpToken, otp },
    });

    if (result.success) {
      await setTokens(result.data.accessToken, result.data.refreshToken);
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to verify email",
    };
  }
};

export const loginUser = async (userData: FieldValues) => {
  try {
    if (!userData.email || !userData.password) {
      return { success: false, message: "Email and password are required" };
    }

    const result = await apiRequest({
      method: "post",
      endpoint: "/users/login",
      useAuth: false,
      data: userData,
    });

    if (result.success) {
      await setTokens(result.data.accessToken, result.data.refreshToken);
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to login user",
    };
  }
};

export const verifyGoogleToken = async (token: string) => {
  try {
    const result = await apiRequest({
      method: "post",
      endpoint: "/users/verify-google",
      useAuth: false,
      data: { token },
    });

    if (result.success) {
      try {
        await setTokens(result.data.accessToken, result.data.refreshToken);
      } catch (cookieError) {
        console.error("Error setting cookies:", cookieError);
      }
    }

    return result;
  } catch (error: any) {
    console.error("Error in verifyGoogleToken:", error);
    return {
      success: false,
      message: error?.message || "Failed to verify Google token",
    };
  }
};

export const refreshAccessToken = async () => {
  try {
    const refreshToken = await getTokenFromCookie("refreshToken");

    if (!refreshToken) {
      return { success: false, message: "No refresh token found" };
    }

    const result = await apiRequest({
      method: "post",
      endpoint: "/users/refresh-token",
      useAuth: false,
      data: { refreshToken },
    });

    if (result.success) {
      await setTokens(result.data.accessToken, result.data.refreshToken);
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to refresh access token",
    };
  }
};

const getAccessTokenOrRefreshAccessToken = async () => {
  let accessToken = await getTokenFromCookie("accessToken");

  if (!accessToken) {
    // No access token found, try to refresh
    const refreshResult = await refreshAccessToken();

    if (refreshResult.success) {
      accessToken = refreshResult.data.accessToken;
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
        accessToken = refreshResult.data.accessToken;
      } else {
        return null;
      }
    }
  }

  return accessToken;
};

export const getAccessToken = async (): Promise<string | null> => {
  const token = await getTokenFromCookie("accessToken");
  return token;
};

export const getCurrentUser = async () => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return null;
  }

  try {
    const decodedData = jwtDecode<User>(accessToken);
    return decodedData;
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

export const requestPasswordReset = async (email: string) => {
  try {
    const result = await apiRequest({
      method: "post",
      endpoint: "/users/request-password-reset",
      useAuth: false,
      data: { email },
    });
    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to send password reset email",
    };
  }
};

export const verifyOTP = async (otp: string, otpToken: string) => {
  try {
    const result = await apiRequest({
      method: "post",
      endpoint: "/users/verify-otp",
      useAuth: false,
      data: { otp, otpToken },
    });
    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to verify OTP",
    };
  }
};

export const resetPassword = async (
  newPassword: string,
  confirmNewPassword: string,
  tempToken: string
) => {
  try {
    const result = await apiRequest({
      method: "post",
      endpoint: "/users/reset-password",
      useAuth: false,
      data: { newPassword, confirmNewPassword, tempToken },
    });
    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to reset password",
    };
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  try {
    const result = await apiRequest({
      method: "post",
      endpoint: "/users/change-password",
      useAuth: true,
      data: { currentPassword, newPassword, confirmPassword },
    });
    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to change password",
    };
  }
};
