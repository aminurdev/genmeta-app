"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  Filter,
  HardDrive,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import PaginationView from "@/components/pagination-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  BackupCollectionResult,
  BackupConnectionTest,
  BackupHistoryItem,
  GetBackupHistoryParams,
} from "@/services/backup-services";
import {
  useBackupConnectionQuery,
  useBackupHistoryQuery,
  useBackupStatusQuery,
  useRefreshBackupDashboardMutation,
  useTestBackupConnectionMutation,
  useTriggerBackupMutation,
} from "@/services/queries/backup-queries";
import {
  BackupHistoryTableSkeleton,
  BackupSkeleton,
} from "./backup-skeleton";

function safeFormatDate(value?: string | null, pattern = "MMM d, yyyy · h:mm a") {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, pattern);
}

function safeFormatRelative(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return formatDistanceToNow(d, { addSuffix: true });
}

function formatDurationMs(ms?: number | null) {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

function StatusBadge({ success }: { success: boolean }) {
  return success ? (
    <Badge
      variant="outline"
      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium gap-1"
    >
      <CheckCircle2 className="h-3 w-3" />
      Success
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium gap-1"
    >
      <XCircle className="h-3 w-3" />
      Failed
    </Badge>
  );
}

function TriggerBadge({ triggeredBy }: { triggeredBy: string }) {
  const isScheduled = triggeredBy === "scheduled";
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium gap-1 text-xs",
        isScheduled
          ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
          : "bg-muted text-foreground"
      )}
    >
      {isScheduled ? (
        <Clock className="h-3 w-3" />
      ) : (
        <User className="h-3 w-3" />
      )}
      {isScheduled ? "Scheduled" : "Manual"}
    </Badge>
  );
}

export function BackupDashboard() {
  // History filters & pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [triggerFilter, setTriggerFilter] = useState<"all" | "manual" | "scheduled">("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Source collection filter
  const [collectionSearch, setCollectionSearch] = useState("");

  // Inspect dialog state
  const [selectedRun, setSelectedRun] = useState<BackupHistoryItem | null>(null);
  const [dialogCollectionFilter, setDialogCollectionFilter] = useState("");
  const [dialogStatusFilter, setDialogStatusFilter] = useState<"all" | "success" | "failed">("all");

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const historyParams = useMemo<GetBackupHistoryParams>(
    () => ({
      page,
      limit,
      status: statusFilter,
      triggeredBy: triggerFilter,
      search: debouncedSearch || undefined,
    }),
    [page, limit, statusFilter, triggerFilter, debouncedSearch]
  );

  const {
    data: connectionResponse,
    isPending: connectionLoading,
  } = useBackupConnectionQuery();

  const {
    data: statusResponse,
    isPending: statusLoading,
    refetch: refetchStatus,
  } = useBackupStatusQuery();

  const {
    data: historyResponse,
    isPending:  historyLoading,
    isFetching: historyFetching,
  } = useBackupHistoryQuery(historyParams);

  const testConnectionMutation = useTestBackupConnectionMutation();
  const refreshDashboardMutation = useRefreshBackupDashboardMutation();
  const triggerBackupMutation = useTriggerBackupMutation();

  const statusData = statusResponse?.success ? statusResponse.data : null;
  const connectionData: BackupConnectionTest | null = connectionResponse?.success
    ? connectionResponse.data
    : connectionResponse && !connectionResponse.success && connectionResponse.data
      ? (connectionResponse.data as unknown as BackupConnectionTest)
      : null;

  const historyPayload = historyResponse?.success ? historyResponse.data : null;
  const historyItems = useMemo(
    () => historyPayload?.history ?? [],
    [historyPayload]
  );
  const historySummary = historyPayload?.summary ?? {
    total: 0,
    successful: 0,
    failed: 0,
    manual: 0,
    scheduled: 0,
  };
  const pagination = historyPayload?.pagination ?? {
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  };

  const lastBackup = statusData?.lastBackup ?? null;
  const isBackupRunning = Boolean(
    triggerBackupMutation.isPending || statusData?.isRunning
  );
  const isRefreshing =
    refreshDashboardMutation.isPending || testConnectionMutation.isPending;

  const lastSyncedRelative = safeFormatRelative(
    statusData?.meta?.generatedAt ||
      historyPayload?.meta?.generatedAt ||
      connectionData?.meta?.generatedAt
  );

  // Map last backup per-collection sync result for fast lookup alongside live collections
  const lastSyncByCollection = useMemo(() => {
    const map = new Map<string, BackupCollectionResult>();
    if (lastBackup?.results) {
      for (const item of lastBackup.results) {
        map.set(item.collection, item);
      }
    }
    return map;
  }, [lastBackup]);

  const filteredSourceCollections = useMemo(() => {
    const list = statusData?.sourceCollections?.collections ?? [];
    const term = collectionSearch.trim().toLowerCase();
    if (!term) return list;
    return list.filter((col) => col.name.toLowerCase().includes(term));
  }, [statusData?.sourceCollections?.collections, collectionSearch]);

  const filteredDialogResults = useMemo(() => {
    const list = selectedRun?.results ?? [];
    const term = dialogCollectionFilter.trim().toLowerCase();
    return list.filter((item) => {
      if (dialogStatusFilter === "success" && !item.success) return false;
      if (dialogStatusFilter === "failed" && item.success) return false;
      if (term && !item.collection.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [selectedRun, dialogCollectionFilter, dialogStatusFilter]);

  const hasActiveHistoryFilters =
    statusFilter !== "all" ||
    triggerFilter !== "all" ||
    Boolean(debouncedSearch);

  // Handlers
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
      setPage(1);
    }, 350);
  };

  const handleResetHistoryFilters = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setTriggerFilter("all");
    setPage(1);
  };

  const handleOpenInspect = (item: BackupHistoryItem) => {
    setDialogCollectionFilter("");
    setDialogStatusFilter("all");
    setSelectedRun(item);
  };

  const handleRefreshAll = async () => {
    try {
      const res = await refreshDashboardMutation.mutateAsync(historyParams);
      if (res.statusRes.success && res.historyRes.success) {
        toast.success("Backup status and history refreshed");
      } else {
        toast.warning("Refreshed with partial warnings");
      }
    } catch {
      toast.error("Failed to refresh backup telemetry");
    }
  };

  const handleTestConnection = async () => {
    const toastId = toast.loading("Testing backup database connection...");
    try {
      const result = await testConnectionMutation.mutateAsync();
      if (result.success && result.data) {
        const latency =
          result.data.latencyMs != null ? ` (${result.data.latencyMs}ms)` : "";
        const cols =
          result.data.collectionsCount != null
            ? ` · ${result.data.collectionsCount} collections`
            : "";
        toast.success(
          `Connected to ${result.data.database || "backup DB"}${latency}${cols}`,
          { id: toastId }
        );
      } else {
        const failedData = result.data as Partial<BackupConnectionTest> | null;
        const reason = failedData?.error || result.message;
        toast.error(reason || "Backup database connection failed", {
          id: toastId,
        });
      }
    } catch {
      toast.error("Failed to test backup database connection", {
        id: toastId,
      });
    }
  };

  const handleTriggerBackup = async () => {
    const toastId = toast.loading(
      "Database backup in progress... Please wait."
    );
    try {
      const result = await triggerBackupMutation.mutateAsync();
      if (result.success) {
        const docs = result.data?.totalDocuments?.toLocaleString() ?? "0";
        const dur = result.data?.duration ?? "";
        toast.success(
          `Backup completed (${docs} docs synced${dur ? ` in ${dur}` : ""})`,
          { id: toastId }
        );
      } else {
        toast.error(result.message || "Backup completed with errors", {
          id: toastId,
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to trigger backup";
      toast.error(message, { id: toastId });
    }
  };

  // Only show full-page skeleton on initial status load
  if (statusLoading && !statusData) {
    return <BackupSkeleton />;
  }

  const lastSnapshotProgress =
    lastBackup && lastBackup.collections.total > 0
      ? Math.round(
          (lastBackup.collections.successful / lastBackup.collections.total) *
            100
        )
      : 0;

  const isConnectionHealthy = Boolean(
    connectionResponse?.success && connectionData?.success
  );
  const isConnectionUnconfigured = Boolean(
    (statusData && !statusData.isConfigured) ||
      (connectionData && connectionData.configured === false)
  );

  const showingFrom =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const showingTo = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Database Backups
              </h1>

              {statusData?.sourceDatabase && statusData?.targetDatabase && (
                <Badge
                  variant="outline"
                  className="font-mono text-[11px] font-medium gap-1 bg-muted/40"
                >
                  <span>{statusData.sourceDatabase}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span>{statusData.targetDatabase}</span>
                </Badge>
              )}

              {isBackupRunning ? (
                <Badge
                  variant="outline"
                  className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-medium gap-1.5"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Sync in progress
                </Badge>
              ) : lastSyncedRelative ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Synced {lastSyncedRelative}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor MongoDB cluster replication, inspect collection snapshots,
              and trigger on-demand database syncs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={refreshDashboardMutation.isPending}
              className="gap-1.5"
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  refreshDashboardMutation.isPending && "animate-spin"
                )}
              />
              Refresh
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testConnectionMutation.isPending || isRefreshing}
              className="gap-1.5"
            >
              {testConnectionMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Activity className="h-3.5 w-3.5" />
              )}
              Test Connection
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={isBackupRunning || isConnectionUnconfigured}
                  className="gap-1.5"
                >
                  {isBackupRunning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Backing Up...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      Run Backup Now
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start Manual Database Backup</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3 text-sm text-muted-foreground pt-1">
                      <p>
                        This will mirror all non-system collections from the
                        primary cluster to the backup database. Existing backup
                        collections will be replaced with current snapshots.
                      </p>
                      {statusData && (
                        <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Replication route
                            </span>
                            <span className="font-mono font-medium text-foreground">
                              {statusData.sourceDatabase} &rarr;{" "}
                              {statusData.targetDatabase}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Collections
                            </span>
                            <span className="font-medium tabular-nums text-foreground">
                              {statusData.sourceCollections.totalCollections}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Estimated documents
                            </span>
                            <span className="font-medium tabular-nums text-foreground">
                              {statusData.sourceCollections.totalDocuments.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleTriggerBackup}>
                    Start Backup
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {statusResponse && !statusResponse.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load backup telemetry</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{statusResponse.message}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchStatus()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isConnectionUnconfigured && (
        <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Backup Target Not Configured</AlertTitle>
          <AlertDescription>
            <code>MONGODB_BACKUP_URI</code> is not set in the server
            environment. Add it to enable backup execution and target
            diagnostics.
          </AlertDescription>
        </Alert>
      )}

      {isBackupRunning && (
        <Alert className="border-blue-500/40 bg-blue-500/10 text-blue-900 dark:text-blue-300">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          <AlertTitle>Database Backup Running</AlertTitle>
          <AlertDescription>
            Syncing collections sequentially from{" "}
            <span className="font-mono font-medium">
              {statusData?.sourceDatabase}
            </span>{" "}
            to{" "}
            <span className="font-mono font-medium">
              {statusData?.targetDatabase}
            </span>
            {statusData?.currentRunStartedAt
              ? ` (started ${safeFormatRelative(statusData.currentRunStartedAt)})`
              : ""}
            . Concurrent runs are locked until completion.
          </AlertDescription>
        </Alert>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Connection Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Connection Health
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {(connectionLoading && !connectionResponse) ||
            testConnectionMutation.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-3.5 w-40" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {isConnectionUnconfigured ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    >
                      Not Configured
                    </Badge>
                  ) : isConnectionHealthy ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 gap-1"
                    >
                      <XCircle className="h-3 w-3" />
                      Disconnected
                    </Badge>
                  )}

                  {connectionData?.latencyMs != null && (
                    <span className="text-xs font-mono text-muted-foreground tabular-nums">
                      {connectionData.latencyMs}ms
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs mt-2 truncate",
                    !isConnectionHealthy &&
                      !isConnectionUnconfigured &&
                      connectionData?.error
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-muted-foreground"
                  )}
                  title={connectionData?.error || undefined}
                >
                  {!isConnectionHealthy &&
                  !isConnectionUnconfigured &&
                  connectionData?.error
                    ? connectionData.error
                    : `${
                        connectionData?.database ||
                        statusData?.targetDatabase ||
                        "—"
                      }${
                        connectionData?.collectionsCount != null
                          ? ` · ${connectionData.collectionsCount} collections`
                          : ""
                      }`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Backup Reliability */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Backup Reliability
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-2xl font-bold tabular-nums">
                {(statusData?.totalBackups ?? 0).toLocaleString()}
              </div>
              {(statusData?.totalBackups ?? 0) > 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs tabular-nums",
                    (statusData?.successRate ?? 0) >= 90
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  )}
                >
                  {statusData?.successRate}% pass
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
              {statusData?.successfulBackups ?? 0} passed &middot;{" "}
              {statusData?.failedBackups ?? 0} failed &middot; Avg{" "}
              {formatDurationMs(statusData?.avgDurationMs)}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Last Snapshot */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Last Snapshot
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-lg font-bold tracking-tight">
                {lastBackup?.timestamp
                  ? safeFormatRelative(lastBackup.timestamp) || "Recorded"
                  : "Never"}
              </div>
              {lastBackup && <StatusBadge success={lastBackup.success} />}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums truncate">
              {lastBackup
                ? `${lastBackup.totalDocuments.toLocaleString()} docs · ${lastBackup.duration}`
                : "Run a manual backup or wait for schedule"}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Automated Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Automated Schedule
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold truncate">
                {statusData?.nextScheduledBackup
                  ? safeFormatDate(
                      statusData.nextScheduledBackup,
                      "MMM d, h:mm a"
                    )
                  : statusData?.scheduler?.isRunning
                    ? "Not scheduled"
                    : "Scheduler paused"}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px]",
                  statusData?.scheduler?.isRunning
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {statusData?.scheduler?.isRunning ? "Active" : "Paused"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1.5">
              <span className="text-xs font-mono text-muted-foreground truncate">
                {statusData?.scheduler?.cronExpression || "0 12 * * 5"} (
                {statusData?.scheduler?.timezone || "UTC"})
              </span>
              <Link
                href="/admin/scheduler"
                className="text-xs font-medium text-primary hover:underline shrink-0"
              >
                Configure
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zero-Tab Operational Workspace: Live Source Collections + Latest Backup Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Source Database Collections Inventory */}
        <Card className="xl:col-span-7">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base font-semibold">
                    Source Database Inventory
                  </CardTitle>
                  {statusData?.sourceCollections?.database && (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {statusData.sourceCollections.database}
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-0.5 tabular-nums">
                  {statusData?.sourceCollections?.totalCollections ?? 0}{" "}
                  collections &middot;{" "}
                  {(
                    statusData?.sourceCollections?.totalDocuments ?? 0
                  ).toLocaleString()}{" "}
                  estimated documents
                </CardDescription>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                placeholder="Filter collections by name..."
                className="pl-9 pr-8 h-9"
              />
              {collectionSearch && (
                <button
                  type="button"
                  onClick={() => setCollectionSearch("")}
                  aria-label="Clear collection filter"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {filteredSourceCollections.length > 0 ? (
              <div className="max-h-[340px] overflow-y-auto rounded-md border divide-y">
                {filteredSourceCollections.map((col) => {
                  const lastSyncedCol = lastSyncByCollection.get(col.name);
                  return (
                    <div
                      key={col.name}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-mono text-xs sm:text-sm font-medium truncate">
                          {col.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {col.documentsCount.toLocaleString()} docs
                        </span>

                        {lastSyncedCol ? (
                          lastSyncedCol.success ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] tabular-nums"
                            >
                              Synced ({lastSyncedCol.documentsCount.toLocaleString()})
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[11px]"
                            >
                              Failed
                            </Badge>
                          )
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[11px] text-muted-foreground"
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                {collectionSearch
                  ? `No collections matching "${collectionSearch}"`
                  : "No user collections detected in primary database."}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Latest Backup Snapshot Breakdown */}
        <Card className="xl:col-span-5 flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">
                Latest Backup Snapshot
              </CardTitle>
              {lastBackup && (
                <div className="flex items-center gap-1.5">
                  <TriggerBadge triggeredBy={lastBackup.triggeredBy} />
                  <StatusBadge success={lastBackup.success} />
                </div>
              )}
            </div>
            <CardDescription>
              {lastBackup
                ? `${safeFormatDate(lastBackup.timestamp)} (${safeFormatRelative(lastBackup.timestamp) || "recorded"})`
                : "No backup snapshot recorded yet"}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between gap-4">
            {lastBackup ? (
              <>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Duration
                      </p>
                      <p className="text-base font-semibold font-mono tabular-nums mt-0.5">
                        {lastBackup.duration}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Documents
                      </p>
                      <p className="text-base font-semibold tabular-nums mt-0.5">
                        {lastBackup.totalDocuments.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Collections
                      </p>
                      <p className="text-base font-semibold tabular-nums mt-0.5">
                        {lastBackup.collections.successful}/
                        {lastBackup.collections.total}
                        {lastBackup.collections.failed > 0 && (
                          <span className="text-xs font-normal text-rose-600 dark:text-rose-400 ml-1">
                            ({lastBackup.collections.failed} failed)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Target DB
                      </p>
                      <p className="text-sm font-mono font-medium truncate mt-1">
                        {lastBackup.targetDatabase ||
                          statusData?.targetDatabase ||
                          "—"}
                      </p>
                    </div>
                  </div>

                  {/* Collection Sync Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Collection sync completeness
                      </span>
                      <span className="font-medium tabular-nums">
                        {lastSnapshotProgress}%
                      </span>
                    </div>
                    <Progress value={lastSnapshotProgress} className="h-2" />
                  </div>

                  {lastBackup.triggeredByUser?.name && (
                    <div className="text-xs text-muted-foreground">
                      Initiated by{" "}
                      <span className="font-medium text-foreground">
                        {lastBackup.triggeredByUser.name}
                      </span>
                      {lastBackup.triggeredByUser.email
                        ? ` (${lastBackup.triggeredByUser.email})`
                        : ""}
                    </div>
                  )}

                  {lastBackup.error && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-medium">Snapshot Warning / Error</p>
                        <p className="break-words">{lastBackup.error}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleOpenInspect(lastBackup)}
                >
                  <Eye className="h-4 w-4" />
                  Inspect Collection Breakdown (
                  {lastBackup.results?.length || 0})
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 px-4 text-center space-y-3">
                <Database className="h-10 w-10 text-muted-foreground/40" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    No backup snapshots yet
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Trigger your first manual backup above to create a full
                    snapshot across your collections.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full-Width Backup History Table & Mobile Cards */}
      <Card id="backup-history">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Backup History Log
                </CardTitle>
                <Badge variant="secondary" className="tabular-nums text-xs">
                  {pagination.total.toLocaleString()} runs
                </Badge>
              </div>
              <CardDescription>
                Persistent execution audit trail for manual and scheduled
                backups
              </CardDescription>
            </div>
            {historyFetching && !historyLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating...
              </span>
            )}
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  {
                    key: "all" as const,
                    label: "All",
                    count: historySummary.total,
                  },
                  {
                    key: "success" as const,
                    label: "Success",
                    count: historySummary.successful,
                  },
                  {
                    key: "failed" as const,
                    label: "Failed",
                    count: historySummary.failed,
                  },
                ] as const
              ).map((pill) => {
                const active = statusFilter === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(pill.key);
                      setPage(1);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={cn(
                        "tabular-nums text-[11px]",
                        active ? "opacity-80" : "text-muted-foreground"
                      )}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search + Trigger Filter + Reset */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 lg:max-w-xl lg:justify-end">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  placeholder="Search by admin, collection, DB, or error..."
                  className="pl-9 pr-8 h-9"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => handleSearchInputChange("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Select
                value={triggerFilter}
                onValueChange={(value) => {
                  setTriggerFilter(value as "all" | "manual" | "scheduled");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[165px] h-9">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="All Triggers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Triggers ({historySummary.total})
                  </SelectItem>
                  <SelectItem value="manual">
                    Manual ({historySummary.manual})
                  </SelectItem>
                  <SelectItem value="scheduled">
                    Scheduled ({historySummary.scheduled})
                  </SelectItem>
                </SelectContent>
              </Select>

              {hasActiveHistoryFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetHistoryFilters}
                  className="h-9 px-2.5 text-xs gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {historyLoading || historyFetching ? (
            <BackupHistoryTableSkeleton rows={limit} />
          ) : historyItems.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Collections</TableHead>
                      <TableHead className="text-right">Documents</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyItems.map((backup) => (
                      <TableRow key={backup._id}>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium whitespace-nowrap">
                              {safeFormatDate(backup.timestamp)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {safeFormatRelative(backup.timestamp)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge success={backup.success} />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <TriggerBadge triggeredBy={backup.triggeredBy} />
                            {backup.triggeredByUser?.name && (
                              <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                {backup.triggeredByUser.name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums text-sm">
                          <span className="font-medium">
                            {backup.collections.successful}
                          </span>
                          <span className="text-muted-foreground">
                            /{backup.collections.total}
                          </span>
                          {backup.collections.failed > 0 && (
                            <span className="text-xs text-rose-600 dark:text-rose-400 ml-1.5">
                              ({backup.collections.failed} err)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {backup.totalDocuments.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {backup.duration}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => handleOpenInspect(backup)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Inspect
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y rounded-lg border">
                {historyItems.map((backup) => (
                  <div key={backup._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge success={backup.success} />
                        <TriggerBadge triggeredBy={backup.triggeredBy} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground tabular-nums">
                        {backup.duration}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        {safeFormatDate(backup.timestamp)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {safeFormatRelative(backup.timestamp)}
                        {backup.triggeredByUser?.name
                          ? ` · by ${backup.triggeredByUser.name}`
                          : ""}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/40 p-2.5 text-xs">
                      <div>
                        <p className="text-muted-foreground">Collections</p>
                        <p className="font-semibold tabular-nums">
                          {backup.collections.successful}/
                          {backup.collections.total}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Documents</p>
                        <p className="font-semibold tabular-nums">
                          {backup.totalDocuments.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target</p>
                        <p className="font-mono truncate">
                          {backup.targetDatabase || "backup"}
                        </p>
                      </div>
                    </div>

                    {backup.error && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 break-words">
                        {backup.error}
                      </p>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-8 gap-1.5 text-xs"
                      onClick={() => handleOpenInspect(backup)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Inspect Collection Details
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed py-12 px-4 text-center space-y-3">
              <Database className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {hasActiveHistoryFilters
                    ? "No matching backup runs"
                    : "No backup history recorded"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {hasActiveHistoryFilters
                    ? "Try adjusting your status, trigger, or search filters."
                    : "Completed and failed backup runs will appear here automatically."}
                </p>
              </div>
              {hasActiveHistoryFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetHistoryFilters}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="tabular-nums">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {showingFrom}&ndash;{showingTo}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {pagination.total.toLocaleString()}
                </span>{" "}
                runs
              </span>

              <div className="flex items-center gap-1.5">
                <span>Rows:</span>
                <Select
                  value={String(limit)}
                  onValueChange={(value) => {
                    setLimit(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[72px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <PaginationView
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              handlePageChange={setPage}
              isLoading={historyFetching}
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-Collection Backup Run Inspection Dialog */}
      <Dialog
        open={Boolean(selectedRun)}
        onOpenChange={(open) => {
          if (!open) setSelectedRun(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2 pr-6">
              <DialogTitle>Backup Run Details</DialogTitle>
              {selectedRun && (
                <>
                  <StatusBadge success={selectedRun.success} />
                  <TriggerBadge triggeredBy={selectedRun.triggeredBy} />
                </>
              )}
            </div>
            <DialogDescription>
              {selectedRun
                ? `${safeFormatDate(selectedRun.timestamp, "PPpp")} · ${
                    selectedRun.sourceDatabase || statusData?.sourceDatabase || "main"
                  } → ${
                    selectedRun.targetDatabase || statusData?.targetDatabase || "backup"
                  }`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedRun && (
            <div className="space-y-4 overflow-y-auto pr-1">
              {/* Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Duration
                  </p>
                  <p className="text-sm font-semibold font-mono tabular-nums mt-0.5">
                    {selectedRun.duration}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Collections
                  </p>
                  <p className="text-sm font-semibold tabular-nums mt-0.5">
                    {selectedRun.collections.successful}/
                    {selectedRun.collections.total}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Documents
                  </p>
                  <p className="text-sm font-semibold tabular-nums mt-0.5">
                    {selectedRun.totalDocuments.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Initiator
                  </p>
                  <p className="text-sm font-medium truncate mt-0.5">
                    {selectedRun.triggeredBy === "scheduled"
                      ? "Cron Scheduler"
                      : selectedRun.triggeredByUser?.name || "Admin"}
                  </p>
                </div>
              </div>

              {selectedRun.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Run Error</AlertTitle>
                  <AlertDescription className="break-words">
                    {selectedRun.error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Collection Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={dialogCollectionFilter}
                    onChange={(e) => setDialogCollectionFilter(e.target.value)}
                    placeholder="Filter collections in this snapshot..."
                    className="pl-9 h-9"
                  />
                </div>
                <Select
                  value={dialogStatusFilter}
                  onValueChange={(value) =>
                    setDialogStatusFilter(
                      value as "all" | "success" | "failed"
                    )
                  }
                >
                  <SelectTrigger className="w-full sm:w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Synced Only</SelectItem>
                    <SelectItem value="failed">Failed Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Per-Collection Table */}
              {filteredDialogResults.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Collection</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Documents</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDialogResults.map((col) => (
                        <TableRow key={col.collection}>
                          <TableCell className="font-mono text-xs sm:text-sm font-medium">
                            {col.collection}
                          </TableCell>
                          <TableCell>
                            <StatusBadge success={col.success} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {col.documentsCount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[260px] break-words">
                            {col.error ? (
                              <span className="text-rose-600 dark:text-rose-400">
                                {col.error}
                              </span>
                            ) : (
                              col.message || "Synced"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                  {selectedRun.results?.length
                    ? "No collections match the current filter."
                    : "No per-collection breakdown was recorded for this run."}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
