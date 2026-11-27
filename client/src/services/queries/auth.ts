"use client";

import { useQuery } from "@tanstack/react-query";
import { CACHE_TIME } from "@/lib/query-cache";
import { QUERY_KEYS } from "@/services/constants";
import { getCurrentUser, type User } from "@/services/auth-services";

export function useCurrentUserQuery(options?: {
  enabled?: boolean;
  initialData?: User | null;
}) {
  return useQuery<User | null>({
    queryKey: QUERY_KEYS.currentUser,
    queryFn: () => getCurrentUser(true),
    enabled: options?.enabled ?? true,
    initialData: options?.initialData ?? undefined,
    staleTime: CACHE_TIME.AUTH.staleTime,
    gcTime: CACHE_TIME.AUTH.gcTime,
    refetchOnWindowFocus: false,
    retry: 0,
  });
}
