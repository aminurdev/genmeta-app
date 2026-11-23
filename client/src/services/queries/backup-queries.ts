"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { QUERY_KEYS } from "@/services/constants";
import {
  getBackupHistory,
  getBackupStatus,
  testBackupConnection,
  triggerBackup,
  type GetBackupHistoryParams,
} from "../backup-services";

export const BACKUP_QUERY_KEYS = {
  all: ["admin", "backup"] as const,
  connection: ["admin", "backup", "connection"] as const,
  status: ["admin", "backup", "status"] as const,
  historyRoot: ["admin", "backup", "history"] as const,
  history: (params?: GetBackupHistoryParams) =>
    ["admin", "backup", "history", params ?? {}] as const,
};

export function useBackupConnectionQuery() {
  return useQuery({
    queryKey: BACKUP_QUERY_KEYS.connection,
    queryFn: () => testBackupConnection(),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useBackupStatusQuery() {
  return useQuery({
    queryKey: BACKUP_QUERY_KEYS.status,
    queryFn: () => getBackupStatus(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useBackupHistoryQuery(params?: GetBackupHistoryParams) {
  return useQuery({
    queryKey: BACKUP_QUERY_KEYS.history(params),
    queryFn: () => getBackupHistory(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useTestBackupConnectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => testBackupConnection({ refresh: true }),
    onSuccess: (res) => {
      queryClient.setQueryData(BACKUP_QUERY_KEYS.connection, res);
    },
  });
}

export function useRefreshBackupDashboardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (historyParams?: GetBackupHistoryParams) => {
      const [statusRes, historyRes, connectionRes] = await Promise.all([
        getBackupStatus({ refresh: true }),
        getBackupHistory({ ...historyParams, refresh: true }),
        testBackupConnection({ refresh: true }),
      ]);
      return { statusRes, historyRes, connectionRes, historyParams };
    },
    onSuccess: ({ statusRes, historyRes, connectionRes, historyParams }) => {
      if (statusRes.success) {
        queryClient.setQueryData(BACKUP_QUERY_KEYS.status, statusRes);
      }
      if (historyRes.success) {
        queryClient.setQueryData(
          BACKUP_QUERY_KEYS.history(historyParams),
          historyRes
        );
      }
      queryClient.setQueryData(BACKUP_QUERY_KEYS.connection, connectionRes);
      queryClient.invalidateQueries({
        queryKey: BACKUP_QUERY_KEYS.historyRoot,
        exact: false,
      });
    },
  });
}

export function useTriggerBackupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerBackup,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: BACKUP_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedulerStatus });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenanceStats });
    },
  });
}
