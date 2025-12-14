import { ApiErrorResponse, ApiResponse, AxiosApiError } from "@/types";
import {
  PaymentCreateResponse,
  PricingResponse,
  PromoCodeRes,
} from "@/types/pricing";
import { api } from "./api-client";

// export const getAllPricing = async (): Promise<
//   ApiResponse<PricingResponse> | ApiErrorResponse
// > => {
//   const res = await fetch(
//     `${process.env.NEXT_PUBLIC_API_BASE_URL}/pricing/plans`,
//     {
//       cache: "force-cache",
//     }
//   );
//   return res.json();
// };

export const getAllPricing = async (): Promise<
  ApiResponse<PricingResponse> | ApiErrorResponse
> => {
  const res = await api.get("/pricing/plans");
  return res.data;
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
  try {
    const result = await api.post("/payment/create-app-payment", {
      planId,
      type,
      promoCode,
      paymentMethod,
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

export const validPromoCode = async (
  promoCode: string
): Promise<ApiResponse<PromoCodeRes> | ApiErrorResponse> => {
  try {
    const result = await api.post("/promo-codes/validate", { code: promoCode });
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
