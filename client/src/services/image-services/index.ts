"use server";

import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { refreshAccessToken } from "../auth-services";

const baseApi = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export const processImage = async (data: FormData) => {
  const response = await fetch(`${baseApi}/images/upload/single`, {
    method: "POST",
    body: data,
    headers: {
      authorization: `Bearer ${(await cookies()).get("accessToken")!.value}`,
    },
  });
  return response;
};

interface DecodedToken {
  exp: number;
}

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

export const getBaseApi = async () => {
  return baseApi;
};
