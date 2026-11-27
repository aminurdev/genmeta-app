"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CACHE_TIME } from "@/lib/query-cache";
import { QUERY_KEYS } from "@/services/constants";
import {
  createAiApiKey,
  deleteAiApiKey,
  getAdminList,
  getAiApiKeys,
  getSuperAdminOverview,
  toggleUserStatus,
  updateAiApiKey,
  updateUserRole,
  type ToggleStatusPayload,
  type UpdateRolePayload,
} from "@/services/super-admin";
import type { CreateAiApiKeyPayload, UpdateAiApiKeyPayload } from "@/types/admin";

export function useSuperAdminOverviewQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.superAdminOverview,
    queryFn: () => getSuperAdminOverview(),
    staleTime: CACHE_TIME.REALTIME.staleTime,
    gcTime: CACHE_TIME.REALTIME.gcTime,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useAdminListQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.superAdminStaff,
    queryFn: () => getAdminList(),
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useAiApiKeysQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.superAdminAiKeys,
    queryFn: () => getAiApiKeys(),
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
    // Keep decrypted API keys in memory only; never persist to browser storage
    meta: { persist: false },
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

export function useCreateAiApiKeyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAiApiKeyPayload) => createAiApiKey(payload),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "AI API key created successfully");
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.superAdminAiKeys });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.superAdminOverview,
        });
      } else {
        toast.error(data.message || "Failed to create AI API key");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

export function useUpdateAiApiKeyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAiApiKeyPayload) => updateAiApiKey(payload),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "AI API key updated successfully");
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.superAdminAiKeys });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.superAdminOverview,
        });
      } else {
        toast.error(data.message || "Failed to update AI API key");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });
}

export function useDeleteAiApiKeyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAiApiKey(id),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "AI API key deleted successfully");
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.superAdminAiKeys });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.superAdminOverview,
        });
      } else {
        toast.error(data.message || "Failed to delete AI API key");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred");
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
