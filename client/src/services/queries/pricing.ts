"use client";

import { useQuery } from "@tanstack/react-query";
import { CACHE_TIME } from "@/lib/query-cache";
import { detectVisitorCountry } from "@/lib/currency";
import { getAllPricing, getPaymentStatus } from "../pricing";
import { QUERY_KEYS } from "../constants";

const PENDING_PAYMENT_STATUSES = new Set([
  "pending",
  "processing",
  "initiated",
]);

export function useAllPricing() {
  return useQuery({
    queryKey: QUERY_KEYS.allPricing,
    queryFn: () => getAllPricing(),
    staleTime: CACHE_TIME.STATIC.staleTime,
    gcTime: CACHE_TIME.STATIC.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useVisitorCountryQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.visitorCountry,
    queryFn: detectVisitorCountry,
    enabled: options?.enabled ?? true,
    staleTime: CACHE_TIME.STATIC.staleTime,
    gcTime: CACHE_TIME.STATIC.gcTime,
    refetchOnWindowFocus: false,
    retry: 0,
  });
}

export function usePaymentStatusQuery(
  invoiceNumber?: string,
  options?: {
    pollIntervalMs?: number;
    maxAutoPolls?: number;
  }
) {
  const pollIntervalMs = options?.pollIntervalMs ?? 2500;
  const maxAutoPolls = options?.maxAutoPolls ?? 4;

  return useQuery({
    queryKey: QUERY_KEYS.paymentStatus(invoiceNumber ?? ""),
    queryFn: () => getPaymentStatus(invoiceNumber!, { refresh: true }),
    enabled: Boolean(invoiceNumber),
    staleTime: CACHE_TIME.DEFAULT.staleTime,
    gcTime: CACHE_TIME.DEFAULT.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
    refetchInterval: (query) => {
      const res = query.state.data;
      const status = res?.success ? res.data?.transaction?.status : undefined;
      const updates = query.state.dataUpdateCount;
      if (status && PENDING_PAYMENT_STATUSES.has(status) && updates <= maxAutoPolls) {
        return pollIntervalMs;
      }
      return false;
    },
  });
}
