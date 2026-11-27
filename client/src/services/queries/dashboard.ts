"use client";

import { CACHE_TIME } from "@/lib/query-cache";
import { QUERY_KEYS } from "@/services/constants";
import {
  getActiveSessions,
  logoutAllSessions,
  revokeSession,
} from "@/services/auth-services";
import {
  getOverview,
  getProfile,
  getReferralDetails,
  removeDesktopDevice,
  requestWithdraw,
} from "@/services/dashboard";
import { RequestWithdrawPayload } from "@/types/dashboard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useOverviewQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.overview,
    queryFn: getOverview,
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useProfileQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getProfile,
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useActiveSessionsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.activeSessions,
    queryFn: getActiveSessions,
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
    meta: { persist: false },
  });
}

export function useReferralDetailsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.referralDetails,
    queryFn: getReferralDetails,
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.overview });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeSessions });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.referralDetails });
  };
}

export function useRemoveDesktopDeviceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => removeDesktopDevice(deviceId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.overview });
    },
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => revokeSession(sessionId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeSessions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
}

export function useLogoutAllSessionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logoutAllSessions(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeSessions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
}

export function useRequestWithdrawMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RequestWithdrawPayload) => requestWithdraw(payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.referralDetails });
    },
  });
}
