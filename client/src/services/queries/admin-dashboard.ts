"use client";

import { QUERY_KEYS } from "@/services/constants";
import { useQuery } from "@tanstack/react-query";
import {
  getAdminOverview,
  getAllUsers,
  getUserStats,
  getPaymentsHistory,
  downloadPaymentHistory,
  getAllReferral,
  getAllReferralByUserId,
  getPricingPlans,
  getPromoCodes,
  getSchedulerStatus,
  getMaintenanceStats,
} from "../admin-dashboard";
import type { GetPaymentsHistoryParams } from "@/types/admin";

export function useAdminOverviewQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.adminOverview,
    queryFn: getAdminOverview,
  });
}

export function useUserStatsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.usersStats,
    queryFn: getUserStats,
  });
}

export function useAllUsersQuery(queryParams: string) {
  return useQuery({
    queryKey: QUERY_KEYS.allUsers(queryParams),
    queryFn: () => getAllUsers(queryParams),
  });
}

export function usePaymentsHistoryQuery(params: GetPaymentsHistoryParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.paymentsHistory(params),
    queryFn: () => getPaymentsHistory(params),
  });
}

export function useDownloadPaymentHistoryQuery(
  queryParams?: string,
  enabled = false
) {
  return useQuery({
    queryKey: QUERY_KEYS.downloadPayments(queryParams ?? ""),
    queryFn: () => downloadPaymentHistory(queryParams),
    enabled,
  });
}

export function useAllReferralQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.allReferral,
    queryFn: getAllReferral,
  });
}

export function useReferralByUserIdQuery(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.referralByUser(userId),
    queryFn: () => getAllReferralByUserId(userId),
    enabled: !!userId,
  });
}

export function usePricingPlansQuery(params?: {
  isActive?: boolean;
  type?: "subscription" | "credit";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: QUERY_KEYS.pricingPlans(params),
    queryFn: () => getPricingPlans(params),
  });
}

export function usePromoCodesQuery(params?: {
  active?: boolean;
  appliesTo?: "subscription" | "credit" | "both";
}) {
  return useQuery({
    queryKey: QUERY_KEYS.promoCodes(params),
    queryFn: () => getPromoCodes(params),
  });
}

export function useSchedulerStatusQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.schedulerStatus,
    queryFn: getSchedulerStatus,
  });
}

export function useMaintenanceStatsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.maintenanceStats,
    queryFn: getMaintenanceStats,
  });
}
