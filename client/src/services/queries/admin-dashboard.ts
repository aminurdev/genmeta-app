"use client";

import { CACHE_TIME } from "@/lib/query-cache";
import { QUERY_KEYS } from "@/services/constants";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getAdminOverview,
  getAllUsers,
  getAppUserDetails,
  getUserStats,
  getPaymentsHistory,
  downloadPaymentHistory,
  getAdminPaymentTransactions,
  reconcilePaymentByInvoice,
  reconcilePendingPayments,
  verifyPaystationTrx,
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
  getAdminProcessErrors,
  updateAdminProcessErrorStatus,
  bulkUpdateAdminProcessErrorStatus,
} from "../admin-dashboard";
import type {
  BulkUpdateProcessErrorStatusPayload,
  CreateAppUserPayload,
  GetAdminPaymentTransactionsParams,
  GetAdminProcessErrorsParams,
  GetAllReferralsParams,
  GetPaymentsHistoryParams,
  GetPricingPlansParams,
  GetPromoCodesParams,
  UpdateAppUserPayload,
  UpdateProcessErrorStatusPayload,
  UpdateWithdrawalPayload,
} from "@/types/admin";

export function useAdminOverviewQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.adminOverview,
    queryFn: () => getAdminOverview(),
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
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
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useAllUsersQuery(queryParams: string) {
  return useQuery({
    queryKey: QUERY_KEYS.allUsers(queryParams),
    queryFn: () => getAllUsers(queryParams),
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useAppUserDetailsQuery(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.appUserDetails(userId),
    queryFn: () => getAppUserDetails(userId),
    enabled: Boolean(userId),
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
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
      queryClient.invalidateQueries({
        queryKey: ["users", "all"],
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminOverview,
        refetchType: "inactive",
      });
    },
  });
}

export function useRefreshAppUserDetailsMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => getAppUserDetails(userId, { refresh: true }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.setQueryData(QUERY_KEYS.appUserDetails(userId), res);
      }
      queryClient.invalidateQueries({
        queryKey: ["users"],
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminOverview,
        refetchType: "inactive",
      });
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
    mutationFn: (userIdOrUsername: string) => deleteAppUser(userIdOrUsername),
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
    mutationFn: ({ userId, deviceId }: { userId: string; deviceId?: string }) =>
      resetDeviceId(userId, deviceId),
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
    mutationFn: ({ userId, mode }: { userId: string; mode: "suspend" | "reactivate" }) =>
      updateUserStats(userId, mode),
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
    mutationFn: ({ userId, credits }: { userId: string; credits: number }) =>
      addCredits(userId, credits),
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
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useAdminPaymentTransactionsQuery(
  params: GetAdminPaymentTransactionsParams = {}
) {
  return useQuery({
    queryKey: QUERY_KEYS.adminPaymentTransactions(params),
    queryFn: () => getAdminPaymentTransactions(params),
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useRefreshPaymentsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentsParams,
      transactionsParams,
    }: {
      paymentsParams?: GetPaymentsHistoryParams;
      transactionsParams?: GetAdminPaymentTransactionsParams;
    }) => {
      const [paymentsRes, transactionsRes] = await Promise.all([
        getPaymentsHistory(paymentsParams, { refresh: true }),
        getAdminPaymentTransactions(transactionsParams, { refresh: true }),
      ]);
      return {
        paymentsRes,
        transactionsRes,
        paymentsParams: paymentsParams ?? {},
        transactionsParams: transactionsParams ?? {},
      };
    },
    onSuccess: ({
      paymentsRes,
      transactionsRes,
      paymentsParams,
      transactionsParams,
    }) => {
      if (paymentsRes.success) {
        queryClient.setQueryData(
          QUERY_KEYS.paymentsHistory(paymentsParams),
          paymentsRes
        );
      }
      if (transactionsRes.success) {
        queryClient.setQueryData(
          QUERY_KEYS.adminPaymentTransactions(transactionsParams),
          transactionsRes
        );
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "paymentHistory"],
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "payments", "transactions"],
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminOverview,
        refetchType: "inactive",
      });
    },
  });
}

export function useExportPaymentsCsvMutation() {
  return useMutation({
    mutationFn: (params: GetPaymentsHistoryParams = {}) =>
      downloadPaymentHistory(params),
  });
}

export function useReconcilePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceNumber: string) =>
      reconcilePaymentByInvoice(invoiceNumber),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "paymentHistory"] });
        queryClient.invalidateQueries({
          queryKey: ["admin", "payments", "transactions"],
        });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOverview });
        queryClient.invalidateQueries({ queryKey: ["users"] });
      }
    },
  });
}

export function useReconcilePendingPaymentsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (limit: number = 20) => reconcilePendingPayments(limit),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "paymentHistory"] });
        queryClient.invalidateQueries({
          queryKey: ["admin", "payments", "transactions"],
        });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOverview });
        queryClient.invalidateQueries({ queryKey: ["users"] });
      }
    },
  });
}

export function useVerifyPaystationTrxMutation() {
  return useMutation({
    mutationFn: (trxId: string) => verifyPaystationTrx(trxId),
  });
}

export function useAllReferralQuery(params?: GetAllReferralsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.allReferral(params),
    queryFn: () => getAllReferral(params),
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useRefreshReferralsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: GetAllReferralsParams) =>
      getAllReferral(params, { refresh: true }),
    onSuccess: (res, params) => {
      if (res.success) {
        queryClient.setQueryData(QUERY_KEYS.allReferral(params), res);
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "referral"],
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminWithdrawalNotifications,
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminOverview,
        refetchType: "inactive",
      });
    },
  });
}

export function useReferralByUserIdQuery(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.referralByUser(userId),
    queryFn: () => getAllReferralByUserId(userId),
    enabled: Boolean(userId),
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useRefreshReferralByUserMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => getAllReferralByUserId(userId, { refresh: true }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.setQueryData(QUERY_KEYS.referralByUser(userId), res);
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "referral"],
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminWithdrawalNotifications,
        refetchType: "inactive",
      });
    },
  });
}

export function usePricingPlansQuery(params?: GetPricingPlansParams) {
  return useQuery({
    queryKey: QUERY_KEYS.pricingPlans(params),
    queryFn: () => getPricingPlans(params),
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function usePromoCodesQuery(params?: GetPromoCodesParams) {
  return useQuery({
    queryKey: QUERY_KEYS.promoCodes(params),
    queryFn: () => getPromoCodes(params),
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useRefreshPricingManagementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      plansParams,
      promoParams,
    }: {
      plansParams?: GetPricingPlansParams;
      promoParams?: GetPromoCodesParams;
    }) => {
      const [plansRes, promoRes] = await Promise.all([
        getPricingPlans(plansParams, { refresh: true }),
        getPromoCodes(promoParams, { refresh: true }),
      ]);
      return { plansRes, promoRes, plansParams, promoParams };
    },
    onSuccess: ({ plansRes, promoRes, plansParams, promoParams }) => {
      if (plansRes.success) {
        queryClient.setQueryData(QUERY_KEYS.pricingPlans(plansParams), plansRes);
      }
      if (promoRes.success) {
        queryClient.setQueryData(QUERY_KEYS.promoCodes(promoParams), promoRes);
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "pricing", "plans"],
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "promo", "codes"],
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: ["pricing", "all"],
        refetchType: "inactive",
      });
    },
  });
}

export function useSchedulerStatusQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.schedulerStatus,
    queryFn: () => getSchedulerStatus(),
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useMaintenanceStatsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.maintenanceStats,
    queryFn: () => getMaintenanceStats(),
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useRefreshSchedulerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const [statusRes, statsRes] = await Promise.all([
        getSchedulerStatus({ refresh: true }),
        getMaintenanceStats({ refresh: true }),
      ]);
      return { statusRes, statsRes };
    },
    onSuccess: ({ statusRes, statsRes }) => {
      if (statusRes.success) {
        queryClient.setQueryData(QUERY_KEYS.schedulerStatus, statusRes);
      }
      if (statsRes.success) {
        queryClient.setQueryData(QUERY_KEYS.maintenanceStats, statsRes);
      }
    },
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
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "pricing", "plans"] });
        queryClient.invalidateQueries({ queryKey: ["pricing", "all"] });
      }
    },
  });
}

export function useUpdatePricingPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePricingPlan>[1] }) =>
      updatePricingPlan(id, data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "pricing", "plans"] });
        queryClient.invalidateQueries({ queryKey: ["pricing", "all"] });
      }
    },
  });
}

export function useDeletePricingPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePricingPlan,
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "pricing", "plans"] });
        queryClient.invalidateQueries({ queryKey: ["pricing", "all"] });
      }
    },
  });
}

// Promo Code Mutations
export function useCreatePromoCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPromoCode,
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "promo", "codes"] });
      }
    },
  });
}

export function useUpdatePromoCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePromoCode>[1] }) =>
      updatePromoCode(id, data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "promo", "codes"] });
      }
    },
  });
}

export function useDeletePromoCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePromoCode,
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "promo", "codes"] });
      }
    },
  });
}

// Scheduler Mutations
export function useStartSchedulerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startScheduler,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedulerStatus });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenanceStats });
      queryClient.invalidateQueries({ queryKey: ["admin", "backup", "status"] });
    },
  });
}

export function useStopSchedulerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stopScheduler,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedulerStatus });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenanceStats });
      queryClient.invalidateQueries({ queryKey: ["admin", "backup", "status"] });
    },
  });
}

export function useTriggerMaintenanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerMaintenance,
    onSuccess: () => {
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
    mutationFn: ({ userId, withdrawalId, status, trx, notes }: UpdateWithdrawalPayload) =>
      updateWithdrawal(userId, withdrawalId, status, trx, notes),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.referralByUser(variables.userId),
        });
        queryClient.invalidateQueries({ queryKey: ["admin", "referral"] });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.adminWithdrawalNotifications,
        });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOverview });
      }
    },
  });
}

export function useWithdrawalNotificationsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.adminWithdrawalNotifications,
    queryFn: getWithdrawalNotifications,
    staleTime: CACHE_TIME.REALTIME.staleTime,
    gcTime: CACHE_TIME.REALTIME.gcTime,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAdminProcessErrorsQuery(
  params: GetAdminProcessErrorsParams = {}
) {
  return useQuery({
    queryKey: QUERY_KEYS.adminProcessErrors(params),
    queryFn: () => getAdminProcessErrors(params),
    placeholderData: keepPreviousData,
    staleTime: CACHE_TIME.REALTIME.staleTime,
    gcTime: CACHE_TIME.REALTIME.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useRefreshAdminProcessErrorsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: GetAdminProcessErrorsParams = {}) =>
      getAdminProcessErrors(params, { refresh: true }),
    onSuccess: (res, params) => {
      if (res.success) {
        queryClient.setQueryData(QUERY_KEYS.adminProcessErrors(params), res);
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "errors"],
        refetchType: "inactive",
      });
    },
  });
}

export function useUpdateProcessErrorStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      errorLogId,
      payload,
    }: {
      errorLogId: string;
      payload: UpdateProcessErrorStatusPayload;
    }) => updateAdminProcessErrorStatus(errorLogId, payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "errors"] });
      }
    },
  });
}

export function useBulkUpdateProcessErrorStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkUpdateProcessErrorStatusPayload) =>
      bulkUpdateAdminProcessErrorStatus(payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "errors"] });
      }
    },
  });
}
