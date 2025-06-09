import { getAccessToken } from "@/services/auth-services";
import { getBaseApi } from "@/services/image-services";
import { useState, useEffect } from "react";

export interface Payment {
  invoiceNumber: string;
  date: string;
  status: string;
  paymentMethod: string;
  paymentId: string;
  user: {
    name: string;
    email: string;
  };
  plan: {
    tokens: number;
  };
  amount: number;
  currency: string;
  tokensAdded: number;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalPayments: number;
  pageSize: number;
}

interface PaymentsResponse {
  payments: Payment[];
  pagination: PaginationData;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaymentsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalPayments: 0,
    pageSize: 5,
  });

  const fetchPayments = async (params: PaymentsQueryParams = {}) => {
    try {
      setLoading(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const queryParams = new URLSearchParams({
        page: params.page?.toString() || "1",
        limit: params.limit?.toString() || "5",
        search: params.search || "",
        ...(params.status && { status: params.status }),
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.paymentMethod && { paymentMethod: params.paymentMethod }),
        sortBy: params.sortBy || "createdAt",
        sortOrder: params.sortOrder || "desc",
      });

      const response = await fetch(
        `${baseApi}/admin/payments/all?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const result: ApiResponse<PaymentsResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch payments");
      }

      setPayments(result.data.payments);
      setPagination(result.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return {
    payments,
    loading,
    error,
    pagination,
    fetchPayments,
  };
}
