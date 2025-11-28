"use client";

import { QUERY_KEYS } from "@/lib/constants";
import {
  getOverview,
  getProfile,
  getReferralDetails,
} from "@/services/dashboard";
import { useQuery } from "@tanstack/react-query";

export function useOverviewQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.overview,
    queryFn: getOverview,
  });
}

export function useProfileQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getProfile,
  });
}

export function useReferralDetailsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.referralDetails,
    queryFn: getReferralDetails,
  });
}
