"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    testBackupConnection,
    getBackupStatus,
    triggerBackup,
    getBackupHistory,
} from "../backup-services";

const BACKUP_QUERY_KEYS = {
    connection: ["admin", "backup", "connection"],
    status: ["admin", "backup", "status"],
    history: ["admin", "backup", "history"],
};

export function useBackupConnectionQuery() {
    return useQuery({
        queryKey: BACKUP_QUERY_KEYS.connection,
        queryFn: testBackupConnection,
    });
}

export function useBackupStatusQuery() {
    return useQuery({
        queryKey: BACKUP_QUERY_KEYS.status,
        queryFn: getBackupStatus,
    });
}

export function useBackupHistoryQuery() {
    return useQuery({
        queryKey: BACKUP_QUERY_KEYS.history,
        queryFn: getBackupHistory,
    });
}

export function useTriggerBackupMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: triggerBackup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BACKUP_QUERY_KEYS.status });
            queryClient.invalidateQueries({ queryKey: BACKUP_QUERY_KEYS.history });
        },
    });
}
