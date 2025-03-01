"use server";

import { cookies } from "next/headers";

const baseApi = process.env.NEXT_PUBLIC_BASE_API_URL as string;

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
export const getAccessToken = async () => {
  return (await cookies()).get("accessToken")!.value;
};
