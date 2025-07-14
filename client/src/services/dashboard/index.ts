import { apiRequest } from "../api";

export interface Overview {
  success: boolean;
  message: string;
  data: {
    user: {
      name: string;
      email: string;
      isVerified: boolean;
      loginProvider: string[];
    };
    appKey: {
      exists: boolean;
      totalProcess: number;
      todayUsage: number;
      thisMonthUsage: number;
      last6MonthProcess: {
        month: string; // e.g., "2025-07"
        count: number;
      }[];
      last7DaysProcess: {
        day: string; // e.g., "2025-07-06"
        count: number;
      }[];
      creditRemaining: number | null | typeof Infinity;
      planType: "free" | "credit" | "subscription";
      planId: string | null;
      expiresAt: string | null;
      daysLeft: number | null;
      isSuspended: boolean;
      isManuallyDisabled: boolean;
    };
    payments: {
      totalSpent: number;
      last5Payments: {
        id: string;
        trxID: string;
        plan: {
          id: string;
          type: string;
        };
        amount: number;
        createdAt: string;
      }[];
    };
  };
}

export interface Profile {
  success: boolean;
  message: string;
  data: {
    name: string;
    email: string;
    avatar: string;
    loginProvider: string[];
    isVerified: boolean;
    isDisabled: boolean;
    createdAt: string; // ISO date string
    role: string;
    appKey?: {
      plan: {
        type: "subscription" | "credit" | "free";
        id?: string;
        name?: string;
      };
      totalProcess: number;
      credit: number | null; // null when subscription
      isActive: boolean;
      status: "active" | "suspended";
      expiresAt: string | null;
    } | null;
  };
}

export const getOverview = async (): Promise<Overview> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: "/users/dashboard/overview",
  });

  return result;
};

export const getProfile = async (): Promise<Profile> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: "/users/dashboard/profile",
  });

  return result;
};
