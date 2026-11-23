"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCheck,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Terminal,
  X,
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
import { AreaChart } from "@/components/ui/area-chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useAdminProcessErrorsQuery,
  useBulkUpdateProcessErrorStatusMutation,
  useRefreshAdminProcessErrorsMutation,
  useUpdateProcessErrorStatusMutation,
} from "@/services/queries/admin-dashboard";
import type {
  AdminProcessErrorLog,
  GetAdminProcessErrorsParams,
  ProcessErrorStatus,
} from "@/types/admin";
import { ErrorsSkeleton, ErrorsTableSkeleton } from "./errors-skeleton";

type DateWindow = "all" | "today" | "7d" | "30d";
type SortOption = "recent" | "failedCount" | "date_asc";

function toUtcDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDateKeyLabel(dateStr?: string): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("-").map((p) => Number.parseInt(p, 10));
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return format(new Date(parts[0], parts[1] - 1, parts[2]), "MMM d, yyyy");
  }
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? dateStr : format(parsed, "MMM d, yyyy");
}

function formatShortChartDate(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map((p) => Number.parseInt(p, 10));
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return format(new Date(parts[0], parts[1] - 1, parts[2]), "MMM d");
  }
  return dateStr;
}

function safeFormatRelative(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDistanceToNow(parsed, { addSuffix: true });
}

function safeFormatDateTime(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, "MMM d, yyyy · h:mm a");
}

function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return parts || "U";
}

function ErrorStatusBadge({ status }: { status: ProcessErrorStatus }) {
  if (status === "resolved") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium gap-1 text-[11px]"
      >
        <CheckCircle2 className="h-3 w-3" />
        Resolved
      </Badge>
    );
  }
  if (status === "ignored") {
    return (
      <Badge
        variant="outline"
        className="border-border bg-muted/60 text-muted-foreground font-medium gap-1 text-[11px]"
      >
        <EyeOff className="h-3 w-3" />
        Ignored
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium gap-1 text-[11px]"
    >
      <AlertTriangle className="h-3 w-3" />
      Unresolved
    </Badge>
  );
}

function PlanTypeBadge({ type }: { type?: string }) {
  const normalized = (type || "free").toLowerCase();
  if (normalized === "subscription") {
    return (
      <Badge
        variant="outline"
        className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] capitalize"
      >
        Subscription
      </Badge>
    );
  }
  if (normalized === "credit") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] capitalize"
      >
        Credit
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px] capitalize">
      Free
    </Badge>
  );
}

export function AdminErrorsDashboard() {
  // Query & filter state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [statusFilter, setStatusFilter] = useState<"all" | ProcessErrorStatus>("all");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "credit" | "subscription">("all");
  const [dateWindow, setDateWindow] = useState<DateWindow>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selection & triage modal state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectLog, setInspectLog] = useState<AdminProcessErrorLog | null>(null);
  const [inspectNote, setInspectNote] = useState("");
  const [resolveAllNote, setResolveAllNote] = useState("");
  const [resolveAllDialogOpen, setResolveAllDialogOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const dateBounds = useMemo(() => {
    if (dateWindow === "all") return { startDate: undefined, endDate: undefined };
    const now = new Date();
    const endDate = toUtcDateKey(now);
    const start = new Date(now);
    if (dateWindow === "7d") {
      start.setUTCDate(start.getUTCDate() - 6);
    } else if (dateWindow === "30d") {
      start.setUTCDate(start.getUTCDate() - 29);
    }
    return { startDate: toUtcDateKey(start), endDate };
  }, [dateWindow]);

  const queryParams = useMemo<GetAdminProcessErrorsParams>(
    () => ({
      page,
      limit,
      status: statusFilter,
      planType: planFilter,
      search: debouncedSearch || undefined,
      startDate: dateBounds.startDate,
      endDate: dateBounds.endDate,
      sortBy:
        sortOption === "failedCount"
          ? "failedCount"
          : sortOption === "date_asc"
            ? "date"
            : "recent",
      sortOrder: sortOption === "date_asc" ? "asc" : "desc",
    }),
    [page, limit, statusFilter, planFilter, debouncedSearch, dateBounds, sortOption]
  );

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useAdminProcessErrorsQuery(queryParams);

  const refreshMutation = useRefreshAdminProcessErrorsMutation();
  const updateStatusMutation = useUpdateProcessErrorStatusMutation();
  const bulkUpdateMutation = useBulkUpdateProcessErrorStatusMutation();

  const payload = response?.success ? response.data : null;
  const logs = useMemo(() => payload?.logs ?? [], [payload]);
  const summary = payload?.summary ?? {
    totalErrorLogs: 0,
    unresolvedLogs: 0,
    resolvedLogs: 0,
    ignoredLogs: 0,
    totalFailures: 0,
    unresolvedFailures: 0,
    todayFailures: 0,
    last7DaysFailures: 0,
    affectedUsersCount: 0,
    totalAffectedUsersCount: 0,
    last7DaysTrend: [],
    topErrorMessages: [],
  };
  const pagination = payload?.pagination ?? {
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  };

  // Clear stale row selections when current page results change
  const visibleLogIds = useMemo(() => logs.map((l) => l._id), [logs]);
  const activeSelectedIds = useMemo(
    () => selectedIds.filter((id) => visibleLogIds.includes(id)),
    [selectedIds, visibleLogIds]
  );

  const allVisibleSelected =
    visibleLogIds.length > 0 && activeSelectedIds.length === visibleLogIds.length;

  const trendChartData = useMemo(
    () =>
      (summary.last7DaysTrend ?? []).map((point) => ({
        label: formatShortChartDate(point.date),
        value: point.failedCount || 0,
      })),
    [summary.last7DaysTrend]
  );

  const resolutionRate = useMemo(() => {
    if (summary.totalErrorLogs <= 0) return 100;
    const triaged = summary.resolvedLogs + summary.ignoredLogs;
    return Math.round((triaged / summary.totalErrorLogs) * 100);
  }, [summary.totalErrorLogs, summary.resolvedLogs, summary.ignoredLogs]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    planFilter !== "all" ||
    dateWindow !== "all" ||
    sortOption !== "recent" ||
    Boolean(debouncedSearch);

  const lastSyncedRelative = safeFormatRelative(payload?.meta?.generatedAt);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
      setPage(1);
    }, 350);
  };

  const applyQuickSearch = (term: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchInput(term);
    setDebouncedSearch(term.trim());
    setPage(1);
  };

  const handleResetFilters = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setPlanFilter("all");
    setDateWindow("all");
    setSortOption("recent");
    setPage(1);
  };

  const handleRefresh = async () => {
    try {
      const res = await refreshMutation.mutateAsync(queryParams);
      if (res.success) {
        toast.success("Processing error logs refreshed");
      } else {
        toast.error(res.message || "Failed to refresh error logs");
      }
    } catch {
      toast.error("Failed to refresh error logs");
    }
  };

  const toggleRowSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedIds(visibleLogIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleOpenInspect = (log: AdminProcessErrorLog) => {
    setInspectLog(log);
    setInspectNote(log.resolutionNote || "");
  };

  const handleSingleStatusUpdate = async (
    log: AdminProcessErrorLog,
    status: ProcessErrorStatus,
    note?: string | null
  ) => {
    try {
      const res = await updateStatusMutation.mutateAsync({
        errorLogId: log._id,
        payload: {
          status,
          ...(note !== undefined ? { resolutionNote: note || null } : {}),
        },
      });
      if (res.success) {
        toast.success(`Marked error log as ${status}`);
        if (inspectLog?._id === log._id && res.data) {
          setInspectLog(res.data);
          setInspectNote(res.data.resolutionNote || "");
        }
      } else {
        toast.error(res.message || "Failed to update error log status");
      }
    } catch {
      toast.error("Failed to update error log status");
    }
  };

  const handleBulkStatusUpdate = async (status: ProcessErrorStatus) => {
    if (activeSelectedIds.length === 0) return;
    try {
      const res = await bulkUpdateMutation.mutateAsync({
        ids: activeSelectedIds,
        status,
      });
      if (res.success) {
        const count = res.data?.modifiedCount ?? activeSelectedIds.length;
        toast.success(`Updated ${count} error log${count === 1 ? "" : "s"} to ${status}`);
        setSelectedIds([]);
      } else {
        toast.error(res.message || "Failed to update selected error logs");
      }
    } catch {
      toast.error("Failed to update selected error logs");
    }
  };

  const handleResolveAllUnresolved = async () => {
    try {
      const res = await bulkUpdateMutation.mutateAsync({
        resolveAllUnresolved: true,
        status: "resolved",
        resolutionNote: resolveAllNote.trim() || null,
      });
      if (res.success) {
        const count = res.data?.modifiedCount ?? 0;
        toast.success(
          `Marked ${count} unresolved error log${count === 1 ? "" : "s"} as resolved`
        );
        setResolveAllDialogOpen(false);
        setResolveAllNote("");
        setSelectedIds([]);
      } else {
        toast.error(res.message || "Failed to resolve all error logs");
      }
    } catch {
      toast.error("Failed to resolve all error logs");
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Unable to copy to clipboard");
    }
  };

  if (isLoading && !payload) {
    return <ErrorsSkeleton />;
  }

  const showingFrom =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const showingTo = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                App Processing Errors
              </h1>

              {summary.unresolvedLogs > 0 ? (
                <Badge
                  variant="outline"
                  className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-medium gap-1.5"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {summary.unresolvedLogs.toLocaleString()} Unresolved
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium gap-1.5"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  All Clear
                </Badge>
              )}

              {lastSyncedRelative && (
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Synced {lastSyncedRelative}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor desktop app processing failures reported by clients, identify recurring error messages, and triage affected users.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshMutation.isPending}
              className="gap-1.5"
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  refreshMutation.isPending && "animate-spin"
                )}
              />
              Refresh
            </Button>

            {summary.unresolvedLogs > 0 && (
              <AlertDialog
                open={resolveAllDialogOpen}
                onOpenChange={setResolveAllDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    disabled={bulkUpdateMutation.isPending}
                    className="gap-1.5"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Resolve All Unresolved
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Resolve All Unresolved Error Logs?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark all {summary.unresolvedLogs.toLocaleString()} unresolved
                      error log{summary.unresolvedLogs === 1 ? "" : "s"} ({summary.unresolvedFailures.toLocaleString()} failed jobs) as resolved. New failures on a future run will automatically reopen a user&apos;s daily log.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2 py-2">
                    <Label htmlFor="resolve-all-note" className="text-xs">
                      Resolution note (optional)
                    </Label>
                    <Textarea
                      id="resolve-all-note"
                      placeholder="e.g., Mitigated upstream AI quota spike in v2.4.1"
                      value={resolveAllNote}
                      onChange={(e) => setResolveAllNote(e.target.value)}
                      maxLength={500}
                      rows={3}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleResolveAllUnresolved();
                      }}
                      disabled={bulkUpdateMutation.isPending}
                    >
                      {bulkUpdateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Resolving...
                        </>
                      ) : (
                        "Confirm Resolve All"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* API Error Alert */}
      {response && !response.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load processing errors</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{response.message || "Request failed"}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Unresolved Logs
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {summary.unresolvedLogs.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
              {summary.unresolvedFailures.toLocaleString()} failed jobs &middot;{" "}
              {summary.affectedUsersCount.toLocaleString()} user
              {summary.affectedUsersCount === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Failed Today (UTC)
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {summary.todayFailures.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
              {summary.last7DaysFailures.toLocaleString()} failures in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Failed Jobs
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {summary.totalFailures.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
              {summary.totalErrorLogs.toLocaleString()} error log
              {summary.totalErrorLogs === 1 ? "" : "s"} &middot;{" "}
              {summary.totalAffectedUsersCount.toLocaleString()} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Resolution Rate
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-2xl font-bold tabular-nums">
                {resolutionRate}%
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {summary.resolvedLogs + summary.ignoredLogs} / {summary.totalErrorLogs}
              </span>
            </div>
            <Progress value={resolutionRate} className="h-1.5 mt-2" />
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
              {summary.resolvedLogs.toLocaleString()} resolved &middot;{" "}
              {summary.ignoredLogs.toLocaleString()} ignored
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Insights Row: 7-Day Trend + Top Recurring Errors */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-7 min-w-0">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">
                  7-Day Failure Trend
                </CardTitle>
                <CardDescription>
                  Daily failed desktop processing jobs over the last 7 UTC days
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-[11px] font-mono">
                {summary.last7DaysFailures.toLocaleString()} failures
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={trendChartData}
              height={230}
              yAxisWidth={44}
              color="#f43f5e"
              tooltipLabel="Failed Jobs"
              emptyMessage="No failed jobs in the last 7 days"
              valueFormatter={(value) => `${value.toLocaleString()} failed`}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-5 min-w-0">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">
                  Top Recurring Errors
                </CardTitle>
                <CardDescription>
                  Click an error message to filter affected logs
                </CardDescription>
              </div>
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {summary.topErrorMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 px-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/70 mb-2" />
                <p className="text-sm font-medium">No recurring error messages</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Detailed error strings appear here when desktop clients report failures.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
                {summary.topErrorMessages.map((item) => {
                  const isActiveSearch = debouncedSearch === item.message;
                  return (
                    <button
                      key={item.message}
                      type="button"
                      onClick={() =>
                        applyQuickSearch(isActiveSearch ? "" : item.message)
                      }
                      className={cn(
                        "w-full text-left rounded-lg border p-2.5 transition-colors hover:bg-muted/60",
                        isActiveSearch && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-mono text-foreground line-clamp-2 break-all">
                          {item.message}
                        </p>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[11px] font-mono tabular-nums"
                        >
                          {item.occurrences}x
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {item.affectedUsers} affected user
                        {item.affectedUsers === 1 ? "" : "s"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Logs Table Card */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Processing Error Logs
              </CardTitle>
              <CardDescription>
                Daily user processing failures aggregated from desktop client usage reports
              </CardDescription>
            </div>

            {isFetching && !isLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating...
              </span>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col gap-3">
            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: "all", label: "All", count: summary.totalErrorLogs },
                  {
                    key: "unresolved",
                    label: "Unresolved",
                    count: summary.unresolvedLogs,
                  },
                  {
                    key: "resolved",
                    label: "Resolved",
                    count: summary.resolvedLogs,
                  },
                  {
                    key: "ignored",
                    label: "Ignored",
                    count: summary.ignoredLogs,
                  },
                ] as const
              ).map((tab) => {
                const active = statusFilter === tab.key;
                return (
                  <Button
                    key={tab.key}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => {
                      setStatusFilter(tab.key);
                      setPage(1);
                    }}
                    className="h-8 text-xs gap-1.5"
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] tabular-nums",
                        active
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {tab.count.toLocaleString()}
                    </span>
                  </Button>
                );
              })}
            </div>

            {/* Search & Secondary Selects */}
            <div className="flex flex-col lg:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user name, email, error message, or note..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 pr-8 h-9"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => applyQuickSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={planFilter}
                  onValueChange={(val) => {
                    setPlanFilter(
                      val as "all" | "free" | "credit" | "subscription"
                    );
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="credit">Credit Pack</SelectItem>
                    <SelectItem value="free">Free Tier</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={dateWindow}
                  onValueChange={(val) => {
                    setDateWindow(val as DateWindow);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today (UTC)</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortOption}
                  onValueChange={(val) => {
                    setSortOption(val as SortOption);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[155px] h-9 text-xs">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="failedCount">Most Failures</SelectItem>
                    <SelectItem value="date_asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-9 text-xs gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Bulk Selection Action Bar */}
          {activeSelectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2.5">
              <span className="text-xs font-medium">
                {activeSelectedIds.length} log
                {activeSelectedIds.length === 1 ? "" : "s"} selected
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bulkUpdateMutation.isPending}
                  onClick={() => handleBulkStatusUpdate("resolved")}
                  className="h-7 text-xs gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Mark Resolved
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bulkUpdateMutation.isPending}
                  onClick={() => handleBulkStatusUpdate("ignored")}
                  className="h-7 text-xs gap-1"
                >
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  Ignore
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bulkUpdateMutation.isPending}
                  onClick={() => handleBulkStatusUpdate("unresolved")}
                  className="h-7 text-xs gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
                  Reopen
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="h-7 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <ErrorsTableSkeleton rows={limit} />
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 px-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500/70 mb-2.5" />
              <h3 className="text-sm font-semibold">
                {hasActiveFilters
                  ? "No error logs match your filters"
                  : "No processing errors recorded"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                {hasActiveFilters
                  ? "Try clearing or adjusting your search term, status, or date window."
                  : "Desktop processing failures reported by client apps will appear here automatically."}
              </p>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="mt-4"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={(checked) =>
                            toggleSelectAllVisible(Boolean(checked))
                          }
                          aria-label="Select all visible error logs"
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Date / Last Seen</TableHead>
                      <TableHead>Failures</TableHead>
                      <TableHead>Error Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const isChecked = activeSelectedIds.includes(log._id);
                      const primaryError =
                        log.errors[0] || "Failed processing run (no error text)";
                      const extraErrorCount = Math.max(0, log.errors.length - 1);
                      const lastSeenRel = safeFormatRelative(log.lastErrorAt);

                      return (
                        <TableRow
                          key={log._id}
                          className={cn(isChecked && "bg-muted/40")}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                toggleRowSelection(log._id, Boolean(checked))
                              }
                              aria-label={`Select error log for ${log.user.email}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={log.user.avatar || undefined} />
                                <AvatarFallback className="text-[11px]">
                                  {getInitials(log.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {log.user._id ? (
                                    <Link
                                      href={`/admin/users/${log.user._id}`}
                                      className="text-sm font-medium hover:text-primary hover:underline truncate max-w-[150px]"
                                    >
                                      {log.user.name}
                                    </Link>
                                  ) : (
                                    <span className="text-sm font-medium truncate max-w-[150px]">
                                      {log.user.name}
                                    </span>
                                  )}
                                  <PlanTypeBadge type={log.appUser?.plan?.type} />
                                </div>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {log.user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="text-xs font-medium tabular-nums">
                                {formatDateKeyLabel(log.date)}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {lastSeenRel || "Recorded"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                                  {log.failedCount.toLocaleString()}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-mono tabular-nums"
                                >
                                  {log.failureRate}% fail
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground tabular-nums">
                                {Math.max(log.fileCount, log.processCount).toLocaleString()}{" "}
                                succeeded
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <button
                              type="button"
                              onClick={() => handleOpenInspect(log)}
                              className="text-left group block w-full"
                            >
                              <p className="text-xs font-mono text-foreground truncate group-hover:text-primary">
                                {primaryError}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {extraErrorCount > 0 && (
                                  <span className="text-[11px] text-muted-foreground">
                                    +{extraErrorCount} more message
                                    {extraErrorCount === 1 ? "" : "s"}
                                  </span>
                                )}
                                {log.resolutionNote && (
                                  <span className="text-[11px] text-muted-foreground truncate">
                                    Note: {log.resolutionNote}
                                  </span>
                                )}
                              </div>
                            </button>
                          </TableCell>
                          <TableCell>
                            <ErrorStatusBadge status={log.errorStatus} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenInspect(log)}
                                className="h-8 px-2.5 text-xs gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Inspect
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label="Triage actions"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuLabel>Triage Status</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {log.errorStatus !== "resolved" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleSingleStatusUpdate(log, "resolved")
                                      }
                                      className="gap-2"
                                    >
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      Mark Resolved
                                    </DropdownMenuItem>
                                  )}
                                  {log.errorStatus !== "ignored" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleSingleStatusUpdate(log, "ignored")
                                      }
                                      className="gap-2"
                                    >
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                      Ignore
                                    </DropdownMenuItem>
                                  )}
                                  {log.errorStatus !== "unresolved" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleSingleStatusUpdate(log, "unresolved")
                                      }
                                      className="gap-2"
                                    >
                                      <RotateCcw className="h-4 w-4 text-rose-500" />
                                      Reopen
                                    </DropdownMenuItem>
                                  )}
                                  {log.user._id && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem asChild>
                                        <Link
                                          href={`/admin/users/${log.user._id}`}
                                          className="gap-2"
                                        >
                                          <ArrowUpRight className="h-4 w-4" />
                                          View User Profile
                                        </Link>
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y rounded-lg border overflow-hidden">
                {logs.map((log) => {
                  const isChecked = activeSelectedIds.includes(log._id);
                  const primaryError =
                    log.errors[0] || "Failed processing run (no error text)";

                  return (
                    <div
                      key={log._id}
                      className={cn("p-4 space-y-3", isChecked && "bg-muted/40")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              toggleRowSelection(log._id, Boolean(checked))
                            }
                            aria-label={`Select error log for ${log.user.email}`}
                          />
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={log.user.avatar || undefined} />
                            <AvatarFallback className="text-[11px]">
                              {getInitials(log.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {log.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {log.user.email}
                            </p>
                          </div>
                        </div>
                        <ErrorStatusBadge status={log.errorStatus} />
                      </div>

                      <div className="rounded-md bg-muted/50 px-2.5 py-2">
                        <p className="text-xs font-mono line-clamp-2 break-all">
                          {primaryError}
                        </p>
                        {log.errors.length > 1 && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            +{log.errors.length - 1} more message
                            {log.errors.length - 1 === 1 ? "" : "s"}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                            {log.failedCount} failed
                          </span>
                          <span>&middot;</span>
                          <span>{formatDateKeyLabel(log.date)}</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenInspect(log)}
                          className="h-7 px-2.5 text-xs gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Inspect
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    Showing {showingFrom}&ndash;{showingTo} of{" "}
                    {pagination.total.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>Rows:</span>
                    <Select
                      value={String(limit)}
                      onValueChange={(val) => {
                        setLimit(Number(val));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <PaginationView
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  handlePageChange={(nextPage) => setPage(nextPage)}
                  isLoading={isFetching}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Inspect Error Details Dialog */}
      <Dialog
        open={Boolean(inspectLog)}
        onOpenChange={(open) => {
          if (!open) setInspectLog(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {inspectLog && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
                  <DialogTitle className="text-lg flex items-center gap-2">
                    <span>Processing Error Details</span>
                    <ErrorStatusBadge status={inspectLog.errorStatus} />
                  </DialogTitle>
                </div>
                <DialogDescription>
                  Recorded for {formatDateKeyLabel(inspectLog.date)} (last updated{" "}
                  {safeFormatDateTime(inspectLog.lastErrorAt)})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* User Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={inspectLog.user.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(inspectLog.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">
                          {inspectLog.user.name}
                        </span>
                        <PlanTypeBadge type={inspectLog.appUser?.plan?.type} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {inspectLog.user.email}
                      </p>
                    </div>
                  </div>
                  {inspectLog.user._id && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1 shrink-0 self-start sm:self-auto"
                    >
                      <Link href={`/admin/users/${inspectLog.user._id}`}>
                        Open User Profile
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[11px] text-muted-foreground">Failed Jobs</p>
                    <p className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {inspectLog.failedCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[11px] text-muted-foreground">Processed</p>
                    <p className="text-base font-bold tabular-nums">
                      {inspectLog.processCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[11px] text-muted-foreground">Files</p>
                    <p className="text-base font-bold tabular-nums">
                      {inspectLog.fileCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[11px] text-muted-foreground">Failure Rate</p>
                    <p className="text-base font-bold tabular-nums">
                      {inspectLog.failureRate}%
                    </p>
                  </div>
                </div>

                {/* Error Messages List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">
                      Error Messages ({inspectLog.errors.length})
                    </Label>
                    {inspectLog.errors.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            inspectLog.errors.join("\n"),
                            "All error messages copied"
                          )
                        }
                        className="h-7 px-2 text-xs gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy All
                      </Button>
                    )}
                  </div>

                  {inspectLog.errors.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      No detailed error strings were sent by the desktop client for this failure count.
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-1.5 rounded-lg border bg-muted/20 p-2.5">
                      {inspectLog.errors.map((msg, idx) => (
                        <div
                          key={`${idx}-${msg.slice(0, 24)}`}
                          className="flex items-start justify-between gap-2 rounded border bg-background px-2.5 py-2"
                        >
                          <code className="text-xs font-mono break-all text-foreground">
                            {msg}
                          </code>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              copyToClipboard(msg, "Error message copied")
                            }
                            className="h-6 w-6 shrink-0"
                            aria-label="Copy error message"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resolution History */}
                {inspectLog.resolvedAt && (
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    Marked as{" "}
                    <span className="font-medium text-foreground">
                      {inspectLog.errorStatus}
                    </span>
                    {inspectLog.resolvedBy?.name || inspectLog.resolvedBy?.email
                      ? ` by ${inspectLog.resolvedBy.name || inspectLog.resolvedBy.email}`
                      : ""}{" "}
                    on {safeFormatDateTime(inspectLog.resolvedAt)}.
                  </div>
                )}

                {/* Triage Note */}
                <div className="space-y-1.5">
                  <Label htmlFor="inspect-resolution-note" className="text-xs">
                    Resolution Note (optional)
                  </Label>
                  <Textarea
                    id="inspect-resolution-note"
                    placeholder="Add root cause, ticket reference, or action taken..."
                    value={inspectNote}
                    onChange={(e) => setInspectNote(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="flex-wrap gap-2">
                {inspectLog.errorStatus !== "unresolved" && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={updateStatusMutation.isPending}
                    onClick={() =>
                      handleSingleStatusUpdate(inspectLog, "unresolved", inspectNote)
                    }
                    className="gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
                    Reopen as Unresolved
                  </Button>
                )}
                {inspectLog.errorStatus !== "ignored" && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={updateStatusMutation.isPending}
                    onClick={() =>
                      handleSingleStatusUpdate(inspectLog, "ignored", inspectNote)
                    }
                    className="gap-1.5"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    Ignore
                  </Button>
                )}
                {inspectLog.errorStatus !== "resolved" && (
                  <Button
                    type="button"
                    disabled={updateStatusMutation.isPending}
                    onClick={() =>
                      handleSingleStatusUpdate(inspectLog, "resolved", inspectNote)
                    }
                    className="gap-1.5"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Mark Resolved
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
