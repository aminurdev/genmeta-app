import { api } from "./api-client";
import { ApiErrorResponse, ApiResponse, AxiosApiError } from "@/types";

export interface CreateOrderParams {
  planId: string;
  amount: number;
  promoCode?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Plan {
  id: string;
  name: string;
  type: "credit" | "subscription";
  duration: number;
  credit?: number;
}

export interface Order {
  _id: string;
  user: User;
  plan: Plan;
  amount: number;
  status: "pending" | "completed" | "failed";
  promoCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const createWhatsAppOrder = async (
  orderData: CreateOrderParams,
): Promise<ApiResponse<Order> | ApiErrorResponse> => {
  try {
    console.log(orderData);
    const result = await api.post("/orders/create", orderData);
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Failed to create order",
      }
    );
  }
};

export const getOrders = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<ApiResponse<OrdersResponse> | ApiErrorResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);

    const result = await api.get(`/orders?${queryParams.toString()}`);
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Failed to fetch orders",
      }
    );
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: "completed" | "cancelled",
): Promise<ApiResponse<Order> | ApiErrorResponse> => {
  try {
    const result = await api.patch(`/orders/${orderId}/status`, { status });
    return result.data;
  } catch (error) {
    const err = error as AxiosApiError;
    return (
      err.response?.data ?? {
        success: false,
        statusCode: err.response?.status ?? 500,
        message: err.message || "Failed to update order status",
      }
    );
  }
};
