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

export const handleGoogleSignIn = async () => {};

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
      const cookieStore = await cookies();
      cookieStore.set("accessToken", result.data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/"
      });
      cookieStore.set("refreshToken", result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/"
      });
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
      const cookieStore = await cookies();
      cookieStore.set("accessToken", result.data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/"
      });
      cookieStore.set("refreshToken", result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/"
      });
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
        const cookieStore = await cookies();
        cookieStore.set("accessToken", result.data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/"
        });
        cookieStore.set("refreshToken", result.data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/"
        });
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
    const refreshToken = (await cookies()).get("refreshToken");

    if (!refreshToken) {
      return { success: false, message: "No refresh token found" };
    }

    const res = await fetch(`${baseApi}/users/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: refreshToken.value }),
    });

    const result = await res.json();

    if (result.success) {
      const cookieStore = await cookies();
      cookieStore.set("accessToken", result.data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/"
      });
      cookieStore.set("refreshToken", result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/"
      });
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to refresh access token",
    };
  }
};

export const getAccessToken = async () => {
  let accessToken = (await cookies()).get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  return accessToken;
};

export const getCurrentUser = async () => {
  let accessToken = (await cookies()).get("accessToken")?.value;
  let decodedData: User | null = null;

  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<User>(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  if (!accessToken || isTokenExpired(accessToken)) {
    const refreshResult = await refreshAccessToken();

    if (refreshResult.success) {
      accessToken = refreshResult.data.accessToken;
    } else {
      return null; // Refresh failed, redirect to login if needed
    }
  }

  try {
    if (accessToken) {
      decodedData = jwtDecode<User>(accessToken);
    }
    return decodedData;
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

export const logout = async () => {
  try {
    const userCookies = await cookies();
    userCookies.delete("accessToken");
    userCookies.delete("refreshToken");
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
