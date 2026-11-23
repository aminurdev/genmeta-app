"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/services/constants";
import {
  getAdminList,
  getSuperAdminOverview,
  toggleUserStatus,
  updateUserRole,
  type ToggleStatusPayload,
  type UpdateRolePayload,
} from "@/services/super-admin";

export function useSuperAdminOverviewQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.superAdminOverview,
    queryFn: () => getSuperAdminOverview(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useAdminListQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.superAdminStaff,
    queryFn: () => getAdminList(),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useRefreshSuperAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const [overviewRes, staffRes] = await Promise.all([
        getSuperAdminOverview({ refresh: true }),
        getAdminList({ refresh: true }),
      ]);
      return { overviewRes, staffRes };
    },
    onSuccess: ({ overviewRes, staffRes }) => {
      if (overviewRes.success) {
        queryClient.setQueryData(QUERY_KEYS.superAdminOverview, overviewRes);
      }
      if (staffRes.success) {
        queryClient.setQueryData(QUERY_KEYS.superAdminStaff, staffRes);
      }
    },
  });
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateRolePayload) => updateUserRole(payload),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "User role updated successfully");
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.superAdminStaff });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.superAdminOverview,
        });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usersStats });
      } else {
        toast.error(data.message || "Failed to update user role");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ToggleStatusPayload) => toggleUserStatus(payload),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Account status updated");
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.superAdminStaff });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.superAdminOverview,
        });
      } else {
        toast.error(data.message || "Failed to update account status");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}
