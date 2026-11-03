import { ApiErrorResponse, ApiResponse } from "@/types";
import { api } from "./api-client";

export interface BackupConnectionTest {
  success: boolean;
  message: string;
  database?: string;
}

export interface BackupCollectionResult {
  collection: string;
  success: boolean;
  documentCount: number;
  error?: string;
}

export interface BackupResult {
  success: boolean;
  timestamp: string;
  duration: string;
  collections: {
    total: number;
    successful: number;
    failed: number;
  };
  totalDocuments: number;
  results: BackupCollectionResult[];
}

export interface BackupHistoryItem {
  _id: string;
  timestamp: string;
  success: boolean;
  duration: string;
  collections: {
    total: number;
    successful: number;
    failed: number;
  };
  totalDocuments: number;
  triggeredBy: string;
  error?: string;
}

export interface BackupStatus {
  lastBackup: BackupHistoryItem | null;
  nextScheduledBackup: string | null;
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
}

export const testBackupConnection = async (): Promise<
  ApiResponse<BackupConnectionTest> | ApiErrorResponse
> => {
  const result = await api.get("/backup/test-connection", {
    timeout: 60000, // 60 seconds timeout for remote backup db connection ping
  });
  return result.data;
};

export const getBackupStatus = async (): Promise<
  ApiResponse<BackupStatus> | ApiErrorResponse
> => {
  const result = await api.get("/backup/status");
  return result.data;
};

export const triggerBackup = async (): Promise<
  ApiResponse<BackupResult> | ApiErrorResponse
> => {
  const result = await api.post("/backup/trigger", null, {
    timeout: 300000, // 5 minutes (300,000ms) to allow full database collections backup without timing out
  });
  return result.data;
};

export const getBackupHistory = async (): Promise<
  ApiResponse<BackupHistoryItem[]> | ApiErrorResponse
> => {
  const result = await api.get("/backup/history");
  return result.data;
};
