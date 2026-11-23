"use client";

import React from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  Loader2,
  Play,
  RefreshCw,
  Square,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

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
import { cn } from "@/lib/utils";
import {
  useMaintenanceStatsQuery,
  useRefreshSchedulerMutation,
  useSchedulerStatusQuery,
  useStartSchedulerMutation,
  useStopSchedulerMutation,
  useTriggerMaintenanceMutation,
} from "@/services/queries/admin-dashboard";
import { SchedulerSkeleton } from "./scheduler-skeleton";

function safeFormatDate(value?: string | null, pattern = "MMM d, h:mm a") {
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

function SchedulerRunningBadge({ isRunning }: { isRunning: boolean }) {
  return isRunning ? (
    <Badge
      variant="outline"
      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium gap-1"
    >
      <CheckCircle2 className="h-3 w-3" />
      Running
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium gap-1"
    >
      <XCircle className="h-3 w-3" />
      Stopped
    </Badge>
  );
}

export function SchedulerDashboard() {
  const {
    data: schedulerResponse,
    isLoading: schedulerLoading,
  } = useSchedulerStatusQuery();

  const {
    data: statsResponse,
    isLoading: statsLoading,
  } = useMaintenanceStatsQuery();

  const refreshMutation = useRefreshSchedulerMutation();
  const startMutation = useStartSchedulerMutation();
  const stopMutation = useStopSchedulerMutation();
  const triggerMutation = useTriggerMaintenanceMutation();

  const schedulerStatus = schedulerResponse?.success
    ? schedulerResponse.data
    : null;
  const maintenanceStats = statsResponse?.success ? statsResponse.data : null;

  if ((schedulerLoading && !schedulerStatus) || (statsLoading && !maintenanceStats)) {
    return <SchedulerSkeleton />;
  }

  const isRunning = Boolean(schedulerStatus?.isRunning);
  const maintenance = schedulerStatus?.maintenance;
  const lastResult = maintenance?.stats?.lastResult ?? null;
  const needed = maintenanceStats?.maintenanceNeeded;
  const freeRefreshCount = needed?.freeUsersNeedingRefresh ?? 0;
  const teardownCount =
    (needed?.expiredSubscriptions ?? 0) +
    (needed?.zeroCreditPlans ?? 0) +
    (needed?.expiredCreditPlans ?? 0);
  const pendingTotal = needed?.total ?? 0;

  const lastSyncedRelative = safeFormatRelative(
    schedulerStatus?.meta?.generatedAt ||
      maintenanceStats?.meta?.generatedAt ||
      maintenanceStats?.lastChecked
  );

  const isBusy =
    refreshMutation.isPending ||
    startMutation.isPending ||
    stopMutation.isPending ||
    triggerMutation.isPending;

  const handleRefresh = async () => {
    try {
      const res = await refreshMutation.mutateAsync();
      if (res.statusRes.success && res.statsRes.success) {
        toast.success("Scheduler telemetry refreshed");
      } else {
        toast.error("Failed to refresh some scheduler telemetry");
      }
    } catch {
      toast.error("Failed to refresh scheduler");
    }
  };

  const handleToggleScheduler = async () => {
    try {
      const result = isRunning
        ? await stopMutation.mutateAsync()
        : await startMutation.mutateAsync();

      if (result.success) {
        toast.success(
          isRunning ? "Scheduler stopped" : "Scheduler started"
        );
      } else {
        toast.error(result.message || "Failed to update scheduler state");
      }
    } catch {
      toast.error("Failed to update scheduler state");
    }
  };

  const handleTriggerMaintenance = async () => {
    const toastId = toast.loading("Running daily maintenance...");
    try {
      const result = await triggerMutation.mutateAsync();
      if (result.success) {
        const refreshed = result.data?.freeUsersRefreshed ?? 0;
        const downgraded =
          (result.data?.expiredSubscriptionsDowngraded ?? 0) +
          (result.data?.zeroCreditPlansDowngraded ?? 0) +
          (result.data?.expiredCreditPlansDowngraded ?? 0);
        toast.success(
          `Maintenance completed (${refreshed} refreshed, ${downgraded} downgraded)`,
          { id: toastId }
        );
      } else {
        toast.error(result.message || "Maintenance failed", { id: toastId });
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to trigger maintenance",
        { id: toastId }
      );
    }
  };

  const planStyles: Record<string, string> = {
    free: "border-border bg-muted/60 text-foreground",
    credit: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    subscription:
      "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Scheduler
              </h1>
              {schedulerStatus && <SchedulerRunningBadge isRunning={isRunning} />}
              {lastSyncedRelative && (
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Synced {lastSyncedRelative}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Control automated daily maintenance, weekly backups, and payment
              reconciliation jobs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            <Button
              type="button"
              variant={isRunning ? "outline" : "secondary"}
              size="sm"
              onClick={handleToggleScheduler}
              disabled={isBusy}
              className={cn(
                "gap-1.5",
                isRunning
                  ? "text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  : "text-emerald-700 dark:text-emerald-400"
              )}
            >
              {startMutation.isPending || stopMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isRunning ? (
                <Square className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {isRunning ? "Stop Scheduler" : "Start Scheduler"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={isBusy} className="gap-1.5">
                  {triggerMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  Run Maintenance
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Run Daily Maintenance Now?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This immediately refreshes free daily credits and downgrades
                    expired or zero-credit plans. Currently{" "}
                    <span className="font-semibold text-foreground tabular-nums">
                      {pendingTotal.toLocaleString()}
                    </span>{" "}
                    active accounts match maintenance criteria.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleTriggerMaintenance}>
                    Run Now
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* API Error Alert */}
      {((schedulerResponse && !schedulerResponse.success) ||
        (statsResponse && !statsResponse.success)) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load scheduler telemetry</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>
              {(schedulerResponse && !schedulerResponse.success
                ? schedulerResponse.message
                : statsResponse && !statsResponse.success
                  ? statsResponse.message
                  : "Request failed") || "Request failed"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 4 Compact KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Scheduler Status
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <SchedulerRunningBadge isRunning={isRunning} />
            <p className="text-xs text-muted-foreground mt-2 truncate">
              {maintenance?.nextRun
                ? `Next: ${safeFormatDate(maintenance.nextRun)}`
                : "Scheduler paused"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Maintenance Runs
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {maintenance?.stats?.totalRuns ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              {maintenance?.stats?.successfulRuns ?? 0} passed &middot;{" "}
              {maintenance?.stats?.failedRuns ?? 0} failed
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            teardownCount > 0 && "border-amber-500/40 bg-amber-500/5"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pending Maintenance
            </CardTitle>
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                teardownCount > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              )}
            />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold tabular-nums",
                teardownCount > 0 && "text-amber-600 dark:text-amber-400"
              )}
            >
              {pendingTotal.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              {teardownCount.toLocaleString()} teardowns &middot;{" "}
              {freeRefreshCount.toLocaleString()} free (&lt;5)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Last Run
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-lg font-bold tracking-tight">
                {maintenance?.lastRun
                  ? safeFormatRelative(maintenance.lastRun) || "Recorded"
                  : "Never"}
              </div>
              {lastResult && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px]",
                    lastResult.success
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                  )}
                >
                  {lastResult.success ? "Success" : "Failed"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {maintenance?.lastRun
                ? safeFormatDate(maintenance.lastRun)
                : "Waiting for first cycle"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Cron Jobs Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Scheduled Jobs
          </CardTitle>
          <CardDescription>
            Automated cron tasks managed by the scheduler service (
            {schedulerStatus?.timezone || "UTC"})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-lg border">
            {/* Job 1: Daily Maintenance */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Daily Maintenance</span>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {maintenance?.cronExpression || "0 0 * * *"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Refreshes free daily credits and downgrades expired or depleted
                  plans
                </p>
              </div>
              <div className="text-xs text-muted-foreground sm:text-right space-y-0.5 tabular-nums">
                <p className="font-medium text-foreground">
                  {maintenance?.nextRun
                    ? `Next: ${safeFormatDate(maintenance.nextRun)}`
                    : "Paused"}
                </p>
                <p>
                  {maintenance?.lastRun
                    ? `Last: ${safeFormatRelative(maintenance.lastRun)}`
                    : "Not run yet"}
                </p>
              </div>
            </div>

            {/* Job 2: Weekly Backup */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Weekly Backup</span>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {schedulerStatus?.backup?.cronExpression || "0 12 * * 5"}
                  </Badge>
                  <Link
                    href="/admin/backup"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Open backups
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  Replicates all primary collections to the backup MongoDB
                  cluster
                </p>
              </div>
              <div className="text-xs text-muted-foreground sm:text-right space-y-0.5 tabular-nums">
                <p className="font-medium text-foreground">
                  {schedulerStatus?.backup?.nextBackup
                    ? `Next: ${safeFormatDate(schedulerStatus.backup.nextBackup)}`
                    : "Paused"}
                </p>
                <p>
                  {schedulerStatus?.backup?.lastBackup
                    ? `Last: ${safeFormatRelative(schedulerStatus.backup.lastBackup)}`
                    : "Not run in session"}
                </p>
              </div>
            </div>

            {/* Job 3: Payment Reconciliation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Payment Reconciliation
                  </span>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {schedulerStatus?.paymentReconciliation?.cronExpression ||
                      "*/10 * * * *"}
                  </Badge>
                  <Link
                    href="/admin/payments"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Open payments
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  Reconciles pending PayStation gateway transactions
                </p>
              </div>
              <div className="text-xs text-muted-foreground sm:text-right space-y-0.5 tabular-nums">
                <p className="font-medium text-foreground">
                  {schedulerStatus?.paymentReconciliation?.nextRun
                    ? `Next: ${safeFormatDate(
                        schedulerStatus.paymentReconciliation.nextRun
                      )}`
                    : "Paused"}
                </p>
                <p>
                  {schedulerStatus?.paymentReconciliation?.lastRun
                    ? `Last: ${safeFormatRelative(
                        schedulerStatus.paymentReconciliation.lastRun
                      )}`
                    : "Pending first sweep"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Bottom Section: Maintenance Queue + Plan Distribution */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Maintenance Queue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Maintenance Queue
            </CardTitle>
            <CardDescription>
              Active user accounts due for update on the next maintenance cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>Free users needing refresh (&lt; 5 credits)</span>
                </div>
                <Badge variant="outline" className="tabular-nums">
                  {freeRefreshCount}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  <span>Expired subscriptions</span>
                </div>
                <Badge variant="outline" className="tabular-nums">
                  {maintenanceStats?.maintenanceNeeded?.expiredSubscriptions ?? 0}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span>Zero-credit plans</span>
                </div>
                <Badge variant="outline" className="tabular-nums">
                  {maintenanceStats?.maintenanceNeeded?.zeroCreditPlans ?? 0}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-rose-500" />
                  <span>Expired credit plans</span>
                </div>
                <Badge variant="outline" className="tabular-nums">
                  {maintenanceStats?.maintenanceNeeded?.expiredCreditPlans ?? 0}
                </Badge>
              </div>
            </div>

            {lastResult && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    Last Run Outcome
                  </span>
                  <span className="text-muted-foreground">
                    {safeFormatDate(lastResult.timestamp)}
                  </span>
                </div>

                {lastResult.success ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                    <div>
                      Refreshed:{" "}
                      <span className="font-medium text-foreground">
                        {lastResult.freeUsersRefreshed ?? 0}
                      </span>
                    </div>
                    <div>
                      Expired subs:{" "}
                      <span className="font-medium text-foreground">
                        {lastResult.expiredSubscriptionsDowngraded ?? 0}
                      </span>
                    </div>
                    <div>
                      Zero credit:{" "}
                      <span className="font-medium text-foreground">
                        {lastResult.zeroCreditPlansDowngraded ?? 0}
                      </span>
                    </div>
                    <div>
                      Expired credit:{" "}
                      <span className="font-medium text-foreground">
                        {lastResult.expiredCreditPlansDowngraded ?? 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {lastResult.error || "Maintenance run failed"}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Plan Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Active Plan Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of active app user accounts by plan type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {maintenanceStats?.planDistribution?.length ? (
              <div className="space-y-3">
                {maintenanceStats.planDistribution.map((plan) => {
                  const key = (plan._id || "free").toLowerCase();
                  const label = key.charAt(0).toUpperCase() + key.slice(1);
                  return (
                    <div
                      key={plan._id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <Badge
                          variant="outline"
                          className={
                            planStyles[key] || "border-border bg-muted/60"
                          }
                        >
                          {label}
                        </Badge>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {plan.count.toLocaleString()} users
                        </span>
                      </div>
                      <div className="text-right tabular-nums">
                        <p className="text-sm font-medium">
                          {(plan.totalCredits || 0).toLocaleString()} credits
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(plan.avgCredits || 0).toFixed(1)} avg / user
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                No active user accounts found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
