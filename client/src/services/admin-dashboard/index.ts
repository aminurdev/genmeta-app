"use server";

import { apiRequest } from "../api";

export interface AdminOverview {
  success: boolean;
  message: string;
  data: {
    revenue: {
      total: number;
      currentMonth: number;
      lastMonth: number;
      growthPercentage: number;
      monthlyRevenueList: Record<string, number>; // e.g., { "2025-07": 750 }
    };
    appKeys: {
      total: number;
      newThisMonth: number;
      active: number;
      activePremium: number;
      subscriptionPlanCount: number;
      creditPlanCount: number;
      monthlyProcessList: Record<string, number>;
    };
    users: {
      total: number;
      newThisMonth: number;
    };
    payments: {
      total: number;
      newThisMonth: number;
      recent: {
        _id: string;
        userId?: {
          _id: string;
          name: string;
          email: string;
        };
        amount: number;
        createdAt: string; // ISO date
      }[];
    };
  };
}

export interface AppKeys {
  _id: string;
  userId: string;
  username: string;
  key: string;
  credit: number | null;
  isActive: boolean;
  status: "active" | "suspended";
  suspendedAt: string | null;
  totalProcess: number;
  monthlyProcess: Record<string, number>;
  dailyProcess: Record<string, number>;
  lastCreditRefresh: string;
  createdAt: string;
  allowedDevices: [string];
  expiresAt?: string;
  lastPlanChange: string;
  plan: {
    type: "free" | "credit" | "subscription";
    id: string;
    name: string;
  } | null;
  planHistory: {
    planType: string;
    changedAt: string;
    reason: string;
  }[];
}

export interface AllAppKeysResponse {
  success: boolean;
  message: string;
  data: {
    appKeys: AppKeys[];
    total: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface AllUsersResponse {
  success: boolean;
  message: string;
  data: {
    users: {
      _id: string;
      isVerified: boolean;
      avatar: string | null;
      loginProvider: string[];
      name: string;
      email: string;
      role: "user" | "admin" | "superAdmin";
      status: "active" | "disabled";
      currentPlan: {
        name: string;
        type: "free" | "credit" | "subscription";
        expiresAt: string | null;
        status: "active" | "suspended";
      } | null;
      metadata?: {
        hasActiveKey?: {
          type?: "free";
        };
        keyStatus: "active" | "suspended";
        planActive: boolean;
      };
      usage: {
        credit: number | null;
        totalProcess: number;
      };
      createdAt: string;
    }[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
      pageSize: number;
    };
  };
}

export interface UserStats {
  success: boolean;
  message: string;
  data: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    recentRegistrations: number;
    roleDistribution: [
      { _id: "user"; count: number },
      { _id: "admin"; count: number }
    ];
    loginProviders: [
      { _id: "google"; count: number },
      { _id: "email"; count: number }
    ];
    appUsers: {
      count: number;
      percentage: number;
    };
  };
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    payments: {
      _id: string;
      user: {
        _id: string;
        name: string;
        email: string;
      };
      paymentID: string;
      trxID: string;
      plan?: {
        id?: string;
        name?: string;
        type?: string;
      };
      amount: number;
      createdAt: string;
      transactionStatus: string;
    }[];
  };
}

export interface DownloadPaymentHistory {
  success: boolean;
  message: string;
  data: {
    name: string;
    email: string;
    paymentNumber: string;
    paymentCreatedAt: string;
    paymentExecuteTime: string;
    amount: string;
    trxID: string;
    paymentID: string;
  }[];
}

export const getAdminOverview = async (): Promise<AdminOverview> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: "/admin/dashboard/stats",
  });

  return result;
};

export const getAppUsers = async (
  queryParams: string
): Promise<AllAppKeysResponse> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: `/app/appkey/get?${queryParams}`,
  });

  return result;
};

export const getAllUsers = async (
  queryParams: string
): Promise<AllUsersResponse> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: `/admin/users/all?${queryParams}`,
  });

  return result;
};

export const getUserStats = async (): Promise<UserStats> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: "/admin/users/statistics",
  });

  return result;
};

interface GetPaymentsHistoryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const getPaymentsHistory = async ({
  page,
  limit,
  search,
  sortBy,
  sortOrder,
  status,
  startDate,
  endDate,
}: GetPaymentsHistoryParams = {}): Promise<PaymentResponse> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: `/admin/paymentHistory/get?page=${page ?? ""}&limit=${
      limit ?? ""
    }&search=${search ?? ""}&sortBy=${sortBy ?? ""}&sortOrder=${
      sortOrder ?? ""
    }&status=${status ?? ""}&startDate=${startDate ?? ""}&endDate=${
      endDate ?? ""
    }`,
  });

  return result;
};

export const downloadPaymentHistory = async (
  queryParams?: string
): Promise<DownloadPaymentHistory> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: `/admin/paymentHistory/download?${queryParams}`,
  });

  return result;
};
