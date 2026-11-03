"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/services/constants";
import {
  getSuperAdminOverview,
  getAdminList,
  updateUserRole,
  toggleUserStatus,
  UpdateRolePayload,
  ToggleStatusPayload,
} from "@/services/super-admin";
import { toast } from "sonner";

export function useSuperAdminOverviewQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.superAdminOverview,
    queryFn: getSuperAdminOverview,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Real-time server telemetry every 30s
    refetchOnWindowFocus: false,
  });
}

export function useAdminListQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.superAdminStaff,
    queryFn: getAdminList,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.superAdminOverview });
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
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.superAdminOverview });
      } else {
        toast.error(data.message || "Failed to update account status");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}
