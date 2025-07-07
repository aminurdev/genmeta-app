import { AllUsersResponse, getAllUsers } from "@/services/admin-dashboard";
import { useState, useEffect } from "react";

interface CurrentPlan {
  name: string;
  tokens: number;
  status: string;
  expiresDate: string;
}

interface Tokens {
  available: number;
  used: number;
  total: number;
}

interface Images {
  processed: number;
  total: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  currentPlan?: CurrentPlan;
  isVerified: boolean;
  tokens: Tokens;
  images: Images;
  createdAt: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  pageSize: number;
}

interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useUsers() {
  const [users, setUsers] = useState<AllUsersResponse["data"]["users"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    pageSize: 5,
  });

  const fetchUsers = async (params: UsersQueryParams = {}) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: params.page?.toString() || "1",
        limit: params.limit?.toString() || "5",
        search: params.search || "",
        ...(params.role && { role: params.role }),
        sortBy: params.sortBy || "createdAt",
        sortOrder: params.sortOrder || "desc",
      });

      const result = await getAllUsers(queryParams.toString());

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch users");
      }

      setUsers(result.data.users);
      setPagination(result.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
  };
}
