"use client";

import { QUERY_KEYS } from "@/services/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOverview,
  getAllUsers,
  getAppUserDetails,
  getUserStats,
  getPaymentsHistory,
  downloadPaymentHistory,
  getAllReferral,
  getAllReferralByUserId,
  getPricingPlans,
  getPromoCodes,
  getSchedulerStatus,
  getMaintenanceStats,
  createUser,
  updateUser,
  deleteAppUser,
  resetDeviceId,
  updateUserStats,
  addCredits,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  startScheduler,
  stopScheduler,
  triggerMaintenance,
  updateWithdrawal,
  getWithdrawalNotifications,
} from "../admin-dashboard";
import type {
  CreateAppUserPayload,
  GetPaymentsHistoryParams,
  UpdateAppUserPayload,
} from "@/types/admin";

export function useAdminOverviewQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.adminOverview,
    queryFn: () => getAdminOverview(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useRefreshAdminOverviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => getAdminOverview({ refresh: true }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.setQueryData(QUERY_KEYS.adminOverview, res);
      }
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminWithdrawalNotifications,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usersStats });
    },
  });
}

export function useUserStatsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.usersStats,
    queryFn: () => getUserStats(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useAllUsersQuery(queryParams: string) {
  return useQuery({
    queryKey: QUERY_KEYS.allUsers(queryParams),
    queryFn: () => getAllUsers(queryParams),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useAppUserDetailsQuery(key: string) {
  return useQuery({
    queryKey: QUERY_KEYS.appUserDetails(key),
    queryFn: () => getAppUserDetails(key),
    enabled: Boolean(key),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useRefreshUsersManagementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queryParams: string = "") => {
      const [statsRes, usersRes] = await Promise.all([
        getUserStats({ refresh: true }),
        getAllUsers(queryParams, { refresh: true }),
      ]);
      return { statsRes, usersRes, queryParams };
    },
    onSuccess: ({ statsRes, usersRes, queryParams }) => {
      if (statsRes.success) {
        queryClient.setQueryData(QUERY_KEYS.usersStats, statsRes);
      }
      if (usersRes.success) {
        queryClient.setQueryData(QUERY_KEYS.allUsers(queryParams), usersRes);
      }
      queryClient.invalidateQueries({ queryKey: ["users", "all"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOverview });
    },
  });
}

export function useRefreshAppUserDetailsMutation(key: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => getAppUserDetails(key, { refresh: true }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.setQueryData(QUERY_KEYS.appUserDetails(key), res);
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOverview });
    },
  });
}

export function useCreateAppUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAppUserPayload) => createUser(payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOverview });
      }
    },
  });
}

export function useUpdateAppUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAppUserPayload) => updateUser(payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "users", "details"] });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOverview });
      }
    },
  });
}

export function useDeleteAppUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) => deleteAppUser(username),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "users", "details"] });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOverview });
      }
    },
  });
}

export function useResetDeviceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, deviceId }: { key: string; deviceId?: string }) =>
      resetDeviceId(key, deviceId),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "users", "details"] });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOverview });
      }
    },
  });
}

export function useUpdateAppUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, mode }: { key: string; mode: "suspend" | "reactivate" }) =>
      updateUserStats(key, mode),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "users", "details"] });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOverview });
      }
    },
  });
}

export function useAddCreditsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, credits }: { key: string; credits: number }) =>
      addCredits(key, credits),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "users", "details"] });
      }
    },
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

export function useAllReferralQuery(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.allReferral(params),
    queryFn: () => getAllReferral(params),
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

// ============================================
// MUTATION HOOKS WITH CACHE INVALIDATION
// ============================================

// Pricing Plan Mutations
export function useCreatePricingPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPricingPlan,
    onSuccess: () => {
      // Invalidate all pricing plan queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["admin", "pricing", "plans"] });
      queryClient.invalidateQueries({ queryKey: ["pricing", "all"] });
    },
  });
}

export function useUpdatePricingPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePricingPlan>[1] }) =>
      updatePricingPlan(id, data),
    onSuccess: () => {
      // Invalidate all pricing plan queries
      queryClient.invalidateQueries({ queryKey: ["admin", "pricing", "plans"] });
      queryClient.invalidateQueries({ queryKey: ["pricing", "all"] });
    },
  });
}

export function useDeletePricingPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePricingPlan,
    onSuccess: () => {
      // Invalidate all pricing plan queries
      queryClient.invalidateQueries({ queryKey: ["admin", "pricing", "plans"] });
      queryClient.invalidateQueries({ queryKey: ["pricing", "all"] });
    },
  });
}

// Promo Code Mutations
export function useCreatePromoCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPromoCode,
    onSuccess: () => {
      // Invalidate all promo code queries
      queryClient.invalidateQueries({ queryKey: ["admin", "promo", "codes"] });
    },
  });
}

export function useUpdatePromoCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePromoCode>[1] }) =>
      updatePromoCode(id, data),
    onSuccess: () => {
      // Invalidate all promo code queries
      queryClient.invalidateQueries({ queryKey: ["admin", "promo", "codes"] });
    },
  });
}

export function useDeletePromoCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePromoCode,
    onSuccess: () => {
      // Invalidate all promo code queries
      queryClient.invalidateQueries({ queryKey: ["admin", "promo", "codes"] });
    },
  });
}

// Scheduler Mutations
export function useStartSchedulerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startScheduler,
    onSuccess: () => {
      // Invalidate scheduler status and maintenance stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedulerStatus });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenanceStats });
    },
  });
}

export function useStopSchedulerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stopScheduler,
    onSuccess: () => {
      // Invalidate scheduler status and maintenance stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedulerStatus });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenanceStats });
    },
  });
}

export function useTriggerMaintenanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerMaintenance,
    onSuccess: () => {
      // Invalidate all relevant queries after maintenance
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedulerStatus });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenanceStats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOverview });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usersStats });
    },
  });
}

// Referral/Withdrawal Mutations
export function useUpdateWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, withdrawalId, status, trx }: {
      userId: string;
      withdrawalId: string;
      status: string;
      trx: string;
    }) => updateWithdrawal(userId, withdrawalId, status, trx),
    onSuccess: () => {
      // Invalidate referral queries to refetch fresh data
            queryClient.invalidateQueries({ queryKey: ["admin", "referral"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminWithdrawalNotifications });
    },
  });
}

export function useWithdrawalNotificationsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.adminWithdrawalNotifications,
    queryFn: getWithdrawalNotifications,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
}