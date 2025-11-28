import { QUERY_KEYS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import {
  getAdminOverview,
  getAllUsers,
  getUserStats,
} from "../admin-dashboard";

export function useAdminOverviewQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.adminOverview,
    queryFn: getAdminOverview,
  });
}

export function useUserStatsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.usersStats,
    queryFn: getUserStats,
  });
}

export function useAllUsersQuery(queryParams: string) {
  return useQuery({
    queryKey: QUERY_KEYS.allUsers(queryParams),
    queryFn: () => getAllUsers(queryParams),
  });
}
