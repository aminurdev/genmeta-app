/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { signIn } from "@/auth";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { FieldValues } from "react-hook-form";

interface DecodedToken {
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  iat: number;
  exp: number;
}

const baseApi = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export const handleGoogleSignIn = async () => {
  await signIn("google");
};

export const registerUser = async (userData: FieldValues) => {
  try {
    const res = await fetch(`${baseApi}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return error;
  }
};

export const loginUser = async (userData: FieldValues) => {
  try {
    const res = await fetch(`${baseApi}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const result = await res.json();

    if (result.success) {
      (await cookies()).set("accessToken", result.data.accessToken);
      (await cookies()).set("refreshToken", result.data.refreshToken);
    }

    return result;
  } catch (error: any) {
    return Error(error);
  }
};

export const refreshAccessToken = async () => {
  try {
    const refreshToken = (await cookies()).get("refreshToken");

    if (!refreshToken) {
      throw new Error("No refresh token found");
    }

    const res = await fetch(`${baseApi}/users/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const result = await res.json();

    if (result.success) {
      (await cookies()).set("accessToken", result.data.accessToken);
      (await cookies()).set("refreshToken", result.data.refreshToken);
    }

    return result;
  } catch (error: any) {
    return Error(error.message || "Failed to refresh access token");
  }
};
export const getAccessToken = async () => {
  let accessToken = (await cookies()).get("accessToken")?.value;

  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
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
      return null;
    }
  }

  return accessToken;
};

export const getCurrentUser = async () => {
  let accessToken = (await cookies()).get("accessToken")?.value;
  let decodedData: DecodedToken | null = null;

  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
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
      decodedData = jwtDecode<DecodedToken>(accessToken);
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
  } catch (error) {
    console.error("Error during logout:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
};
