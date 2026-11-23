import { ApiErrorResponse, ApiResponse, AxiosApiError } from "@/types";
import { api } from "./api-client";

export interface BackupMeta {
  generatedAt: string;
  refreshed?: boolean;
}

export interface BackupConnectionTest {
  success: boolean;
  configured: boolean;
  message: string;
  database: string | null;
  latencyMs: number | null;
  collectionsCount: number | null;
  checkedAt: string;
  error?: string | null;
  meta?: BackupMeta;
}

export interface BackupCollectionResult {
  collection: string;
  success: boolean;
  documentsCount: number;
  message?: string;
  error?: string | null;
}

export interface BackupTriggeredByUser {
  id?: string;
  name?: string;
  email?: string;
}

export interface BackupHistoryItem {
  _id: string;
  timestamp: string;
  success: boolean;
  durationMs: number;
  duration: string;
  collections: {
    total: number;
    successful: number;
    failed: number;
  };
  totalDocuments: number;
  results: BackupCollectionResult[];
  triggeredBy: "manual" | "scheduled" | string;
  triggeredByUser?: BackupTriggeredByUser | null;
  sourceDatabase?: string | null;
  targetDatabase?: string | null;
  error?: string | null;
}

export interface BackupResult extends BackupHistoryItem {
  code?: string;
  startedAt?: string | null;
  message?: string;
}

export interface BackupSourceCollectionInfo {
  name: string;
  documentsCount: number;
}

export interface BackupSourceCollectionsSummary {
  database: string;
  totalCollections: number;
  totalDocuments: number;
  collections: BackupSourceCollectionInfo[];
}

export interface BackupSchedulerInfo {
  isRunning: boolean;
  cronExpression: string;
  timezone: string;
}

export interface BackupStatus {
  isConfigured: boolean;
  isRunning: boolean;
  currentRunStartedAt: string | null;
  sourceDatabase: string;
  targetDatabase: string;
  lastBackup: BackupHistoryItem | null;
  nextScheduledBackup: string | null;
  scheduler: BackupSchedulerInfo;
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  successRate: number;
  avgDurationMs: number;
  sourceCollections: BackupSourceCollectionsSummary;
  meta?: BackupMeta;
}

export interface GetBackupHistoryParams {
  page?: number;
  limit?: number;
  status?: "all" | "success" | "failed";
  triggeredBy?: "all" | "manual" | "scheduled";
  search?: string;
  refresh?: boolean;
}

export interface BackupHistorySummary {
  total: number;
  successful: number;
  failed: number;
  manual: number;
  scheduled: number;
}

export interface BackupHistoryPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BackupHistoryResponse {
  history: BackupHistoryItem[];
  summary: BackupHistorySummary;
  pagination: BackupHistoryPagination;
  meta?: BackupMeta;
}

function toApiError(
  error: unknown,
  fallbackMessage: string
): ApiErrorResponse {
  const err = error as AxiosApiError;
  if (err?.response?.data && typeof err.response.data === "object") {
    return {
      success: false,
      statusCode: err.response.data.statusCode ?? err.response.status ?? 500,
      message: err.response.data.message || fallbackMessage,
      code: err.response.data.code,
      data: err.response.data.data ?? null,
    };
  }

  return {
    success: false,
    statusCode: err?.response?.status ?? 500,
    message: error instanceof Error ? error.message : fallbackMessage,
    data: null,
  };
}

export const testBackupConnection = async (options?: {
  refresh?: boolean;
}): Promise<ApiResponse<BackupConnectionTest> | ApiErrorResponse> => {
  try {
    const result = await api.get("/backup/test-connection", {
      params: options?.refresh ? { refresh: "true" } : undefined,
      timeout: 60000,
    });
    return result.data;
  } catch (error) {
    return toApiError(error, "Failed to test backup database connection");
  }
};

export const getBackupStatus = async (options?: {
  refresh?: boolean;
}): Promise<ApiResponse<BackupStatus> | ApiErrorResponse> => {
  try {
    const result = await api.get("/backup/status", {
      params: options?.refresh ? { refresh: "true" } : undefined,
    });
    return result.data;
  } catch (error) {
    return toApiError(error, "Failed to load backup status");
  }
};

export const triggerBackup = async (): Promise<
  ApiResponse<BackupResult> | ApiErrorResponse
> => {
  try {
    const result = await api.post(
      "/backup/trigger",
      {},
      {
        timeout: 300000, // 5 minutes to allow full collections backup without timing out
      }
    );
    return result.data;
  } catch (error) {
    return toApiError(error, "Failed to trigger database backup");
  }
};

export const getBackupHistory = async (
  params?: GetBackupHistoryParams
): Promise<ApiResponse<BackupHistoryResponse> | ApiErrorResponse> => {
  try {
    const query: Record<string, string | number> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.status && params.status !== "all") query.status = params.status;
    if (params?.triggeredBy && params.triggeredBy !== "all") {
      query.triggeredBy = params.triggeredBy;
    }
    if (params?.search?.trim()) query.search = params.search.trim();
    if (params?.refresh) query.refresh = "true";

    const result = await api.get("/backup/history", { params: query });
    return result.data;
  } catch (error) {
    return toApiError(error, "Failed to fetch backup history");
  }
};
