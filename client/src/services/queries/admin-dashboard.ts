import { QUERY_KEYS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "../admin-dashboard";

export function useAdminOverviewQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.adminOverview,
    queryFn: getAdminOverview,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
