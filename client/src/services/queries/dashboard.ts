"use client";

import { QUERY_KEYS } from "@/services/constants";
import {
  getOverview,
  getProfile,
  getReferralDetails,
} from "@/services/dashboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useOverviewQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.overview,
    queryFn: getOverview,
    staleTime: 60 * 1000, // 1 minute fresh
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useProfileQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getProfile,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useReferralDetailsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.referralDetails,
    queryFn: getReferralDetails,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.overview });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.referralDetails });
  };
}
