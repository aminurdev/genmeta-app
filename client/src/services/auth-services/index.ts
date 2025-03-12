/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { signIn } from "@/auth";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { FieldValues } from "react-hook-form";

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

    if (!result.success) {
      // Clear tokens on failure
      (await cookies()).delete("accessToken");
      (await cookies()).delete("refreshToken");
      throw new Error("Session expired. Please log in again.");
    }

    // Set new tokens on success
    (await cookies()).set("accessToken", result.data.accessToken);
    (await cookies()).set("refreshToken", result.data.refreshToken);

    return result;
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

export const getCurrentUser = async () => {
  let accessToken = (await cookies()).get("accessToken")?.value;
  let decodedData = null;

  if (!accessToken) {
    const refreshResult = await refreshAccessToken();

    if (refreshResult.success) {
      accessToken = refreshResult.data.accessToken;
    } else {
      (await cookies()).delete("accessToken");
      (await cookies()).delete("refreshToken");

      return null;
    }
  }

  try {
    if (accessToken) {
      decodedData = await jwtDecode(accessToken);
    }
    return decodedData;
  } catch (error: any) {
    console.log(error.message);
    return null;
  }
};

export const logout = async () => {
  (await cookies()).delete("accessToken");
};
