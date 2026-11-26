"use client";

import React from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  Clock,
  KeyRound,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { useUserStatsQuery } from "@/services/queries/admin-dashboard";
import { AreaChart } from "@/components/ui/area-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatisticsContentProps {
  onSyncPlans?: () => void;
  isSyncing?: boolean;
}

function formatDayLabel(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map((p) => Number.parseInt(p, 10));
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return format(new Date(parts[0], parts[1] - 1, parts[2]), "MMM d");
  }
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? dateStr : format(parsed, "MMM d");
}

function StatsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3.5 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-7">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[220px] w-full" />
          </CardContent>
        </Card>
        <Card className="xl:col-span-5">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function StatisticsContent({
  onSyncPlans,
  isSyncing = false,
}: StatisticsContentProps) {
  const { data, isLoading, error, refetch } = useUserStatsQuery();

  if (isLoading) {
    return <StatsLoadingState />;
  }

  if (error || !data?.success || !data?.data) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-dashed border-destructive/40 p-4">
        <div className="flex items-center gap-2.5 text-sm">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-muted-foreground">
            {(data && !data.success ? data.message : null) ||
              (error instanceof Error ? error.message : null) ||
              "Unable to load user statistics."}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  const stats = data.data;
  const totalUsers = stats.totalUsers ?? 0;
  const totalDenominator = Math.max(totalUsers, 1);

  const subCount = stats.usersByPlan?.subscription ?? 0;
  const creditCount = stats.usersByPlan?.credit ?? 0;
  const freeCount = stats.usersByPlan?.free ?? 0;
  const uninitCount = stats.usersByPlan?.uninitialized ?? 0;

  const subPct = Math.round((subCount / totalDenominator) * 100);
  const creditPct = Math.round((creditCount / totalDenominator) * 100);
  const freePct = Math.round((freeCount / totalDenominator) * 100);
  const uninitPct = Math.round((uninitCount / totalDenominator) * 100);

  const verificationRate =
    totalUsers > 0
      ? Math.round((stats.verifiedUsers / totalUsers) * 100)
      : 0;
  const paidConversion =
    stats.activeAppUsers > 0
      ? Number(((stats.activePremiumUsers / stats.activeAppUsers) * 100).toFixed(1))
      : 0;

  const registrationChartData = (stats.dailyNewUsers || []).map((item) => ({
    label: formatDayLabel(item.date),
    value: item.count || 0,
  }));

  return (
    <div className="space-y-6">
      {stats.expiredPendingDowngrade > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm">
          <div className="flex items-start sm:items-center gap-2.5 text-blue-800 dark:text-blue-200">
            <Clock className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-xs sm:text-sm">
              <span className="font-semibold">
                {stats.expiredPendingDowngrade} expired paid account
                {stats.expiredPendingDowngrade === 1 ? "" : "s"}
              </span>{" "}
              still marked as paid — sync to downgrade expired.
            </span>
          </div>
          {onSyncPlans && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSyncing}
              onClick={onSyncPlans}
              className="h-7 text-xs shrink-0 self-start sm:self-auto border-blue-500/30 bg-background/80 gap-1.5"
            >
              <RefreshCw
                className={cn("h-3 w-3", isSyncing && "animate-spin")}
              />
              Sync Plans
            </Button>
          )}
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-bold">
                {totalUsers.toLocaleString()}
              </span>
              <Badge variant="secondary" className="text-[11px] font-mono">
                {verificationRate}% verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +{stats.newUsersThisMonth.toLocaleString()} this mo · +
              {stats.newUsers24h.toLocaleString()} in 24h
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.activeUsers.toLocaleString()} active ·{" "}
              {stats.suspendedUsers.toLocaleString()} disabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Premium
            </CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-bold">
                {stats.activePremiumUsers.toLocaleString()}
              </span>
              <Badge variant="secondary" className="text-[11px] font-mono">
                {paidConversion}% conv
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {subCount.toLocaleString()} subscriptions ·{" "}
              {creditCount.toLocaleString()} credit packs
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Active non-expired Users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Desktop Users
            </CardTitle>
            <KeyRound className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeAppUsers.toLocaleString()}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / {stats.totalAppUsers.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.totalDevices.toLocaleString()} bound desktop devices
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.suspendedAppUsers.toLocaleString()} suspended ·{" "}
              {uninitCount.toLocaleString()} uninitialized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Platform Processes
            </CardTitle>
            <Layers className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-bold">
                {stats.totalProcesses.toLocaleString()}
              </span>
              <Badge
                variant="outline"
                className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
              >
                {stats.processSuccessRate}% ok
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.avgProcessesPerUser.toFixed(1)} avg files per user
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.totalFailedProcesses.toLocaleString()} failed total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Registration Chart + Plan & Role Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-7 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  New Registrations (7 Days)
                </CardTitle>
                <Badge variant="secondary" className="text-[11px] font-mono">
                  +{stats.newUsers7d} users
                </Badge>
              </div>
              <CardDescription>
                Daily platform signups across the last 7 UTC days
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={registrationChartData}
              height={220}
              yAxisWidth={36}
              color="#3b82f6"
              tooltipLabel="Signups"
              valueFormatter={(v) => `${v.toLocaleString()} users`}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-5 min-w-0 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Plan &amp; Role Distribution
            </CardTitle>
            <CardDescription>
              License tier breakdown across all {totalUsers.toLocaleString()} accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Subscriptions</span>
                  <span className="font-mono text-muted-foreground">
                    {subCount} ({subPct}%)
                  </span>
                </div>
                <Progress value={subPct} className="h-1.5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Credit Packs</span>
                  <span className="font-mono text-muted-foreground">
                    {creditCount} ({creditPct}%)
                  </span>
                </div>
                <Progress value={creditPct} className="h-1.5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Free Tier</span>
                  <span className="font-mono text-muted-foreground">
                    {freeCount} ({freePct}%)
                  </span>
                </div>
                <Progress value={freePct} className="h-1.5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">
                    Uninitialized (Web Only)
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {uninitCount} ({uninitPct}%)
                  </span>
                </div>
                <Progress value={uninitPct} className="h-1.5" />
              </div>
            </div>

            {Array.isArray(stats.roleDistribution) &&
              stats.roleDistribution.length > 0 && (
                <div className="pt-3 border-t flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Roles:
                  </span>
                  {stats.roleDistribution.map((roleItem) => (
                    <Badge
                      key={roleItem._id || "unknown"}
                      variant="outline"
                      className="text-xs capitalize font-normal"
                    >
                      {roleItem._id || "user"}:{" "}
                      <span className="font-semibold ml-1">
                        {roleItem.count}
                      </span>
                    </Badge>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
