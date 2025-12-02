import { ApiErrorResponse, ApiResponse } from "@/types";
import {
  PaymentCreateResponse,
  PricingResponse,
  PromoCodeRes,
} from "@/types/pricing";
import { api } from "./api-client";

export const getAllPricing = async (): Promise<
  ApiResponse<PricingResponse> | ApiErrorResponse
> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/pricing/plans`,
    {
      cache: "force-cache",
    }
  );
  return res.json();
};

type createPaymentParams = {
  planId: string;
  type: string;
  promoCode?: string;
  paymentMethod: string;
};

export const createPayment = async ({
  planId,
  type,
  promoCode,
  paymentMethod,
}: createPaymentParams): Promise<
  ApiResponse<PaymentCreateResponse> | ApiErrorResponse
> => {
  const result = await api.post("/payment/create-app-payment", {
    planId,
    type,
    promoCode,
    paymentMethod,
  });
  return result.data;
};

export const validPromoCode = async (
  promoCode: string
): Promise<ApiResponse<PromoCodeRes> | ApiErrorResponse> => {
  const result = await api.post("/promo/validate", { code: promoCode });
  return result.data;
};
