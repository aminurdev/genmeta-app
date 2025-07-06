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
        userId: {
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

export const getAdminOverview = async (): Promise<AdminOverview> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: "/admin/dashboard/stats",
  });

  return result;
};
