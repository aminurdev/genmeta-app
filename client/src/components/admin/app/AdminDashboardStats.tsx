"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Gift,
  KeyRound,
  Layers,
  RefreshCw,
  Settings2,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAdminOverviewQuery,
  useRefreshAdminOverviewMutation,
} from "@/services/queries/admin-dashboard";
import type { AdminDashboardStats } from "@/types/admin";
import { useAuth } from "@/hooks/use-auth";
import { AdminDashboardSkeleton } from "@/components/admin/admin-dashboard-skeleton";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function formatBdt(amount: number | undefined | null): string {
  const numeric = Number(amount) || 0;
  return `৳${numeric.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function formatCompactBdt(value: number): string {
  const numeric = Number(value) || 0;
  if (Math.abs(numeric) >= 1_000_000) {
    return `৳${(numeric / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(numeric) >= 1_000) {
    return `৳${(numeric / 1_000).toFixed(numeric % 1_000 === 0 ? 0 : 1)}k`;
  }
  return `৳${numeric.toLocaleString("en-US")}`;
}

function formatCompactNumber(value: number): string {
  const numeric = Number(value) || 0;
  if (Math.abs(numeric) >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(numeric) >= 1_000) {
    return `${(numeric / 1_000).toFixed(numeric % 1_000 === 0 ? 0 : 1)}k`;
  }
  return numeric.toLocaleString("en-US");
}

function formatDateLabel(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map((p) => Number.parseInt(p, 10));
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return format(new Date(parts[0], parts[1] - 1, parts[2]), "MMM d");
  }
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? dateStr : format(parsed, "MMM d");
}

function formatMonthLabel(monthStr?: string): string {
  if (!monthStr) return "";
  const parts = monthStr.split("-").map((p) => Number.parseInt(p, 10));
  if (parts.length >= 2 && parts.slice(0, 2).every(Number.isFinite)) {
    return format(new Date(parts[0], parts[1] - 1, 1), "MMM yy");
  }
  return monthStr;
}

function formatDateTime(value?: string | null): { date: string; time: string } {
  if (!value) return { date: "N/A", time: "" };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: "N/A", time: "" };
  return {
    date: format(parsed, "MMM d, yyyy"),
    time: format(parsed, "h:mm a"),
  };
}

function formatRelativeTime(value?: string | null): string {
  if (!value) return "Just now";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Just now";
  return formatDistanceToNow(parsed, { addSuffix: true });
}

function getInitials(name?: string): string {
  if (!name) return "U";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return initials || "U";
}

function GrowthPill({ value }: { value: number }) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium border",
        isPositive &&
          "text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10",
        isNegative &&
          "text-destructive border-destructive/25 bg-destructive/10",
        !isPositive &&
          !isNegative &&
          "text-muted-foreground border-border bg-muted/50"
      )}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : isNegative ? (
        <ArrowDownRight className="h-3 w-3" />
      ) : null}
      {value === 0 ? "0%" : `${Math.abs(value).toFixed(1)}%`}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status?: string }) {
  const normalized = (status || "Completed").toLowerCase();
  if (normalized === "completed" || normalized === "success") {
    return (
      <Badge
        variant="outline"
        className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10 capitalize"
      >
        {status || "Completed"}
      </Badge>
    );
  }
  if (normalized === "pending") {
    return (
      <Badge
        variant="outline"
        className="text-[11px] font-medium text-amber-600 dark:text-amber-400 border-amber-500/25 bg-amber-500/10 capitalize"
      >
        {status}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-[11px] font-medium text-destructive border-destructive/25 bg-destructive/10 capitalize"
    >
      {status || "Unknown"}
    </Badge>
  );
}

export default function DashboardStats() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superAdmin";
  const [revenueRange, setRevenueRange] = useState<"7days" | "6months">("6months");
  const [processRange, setProcessRange] = useState<"7days" | "6months">("7days");

  const {
    data,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useAdminOverviewQuery();

  const refreshMutation = useRefreshAdminOverviewMutation();
  const isRefreshing = refreshMutation.isPending || isRefetching;

  const handleRefresh = async () => {
    try {
      const res = await refreshMutation.mutateAsync();
      if (res.success) {
        const synced = res.data?.meta?.syncedExpiredPlans ?? 0;
        if (synced > 0) {
          toast.success(
            `Dashboard refreshed & ${synced} expired plan${synced === 1 ? "" : "s"} synced`
          );
        } else {
          toast.success("Dashboard statistics refreshed");
        }
      } else {
        toast.error(res.message || "Failed to refresh dashboard statistics");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh dashboard statistics"
      );
    }
  };

  if (isLoading) {
    return <AdminDashboardSkeleton showHeader={true} />;
  }

  if (isError || !data?.success || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[380px] rounded-xl border border-dashed border-destructive/40 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold text-foreground">
          Failed to load admin statistics
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {(data && !data.success ? data.message : null) ||
            (error instanceof Error ? error.message : null) ||
            "An unexpected error occurred while loading platform metrics."}
        </p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="mt-4 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const stats: AdminDashboardStats = data.data;
  const { revenue, users, appUsers, processes, payments, referrals, meta } = stats;

  // Normalize chart series
  const revenueChartData =
    revenueRange === "7days"
      ? (revenue.last7DaysRevenue || []).map((point) => ({
          label: formatDateLabel(point.date),
          value: point.amount || 0,
        }))
      : (revenue.last6MonthRevenue || []).map((point) => ({
          label: formatMonthLabel(point.month),
          value: point.amount || 0,
        }));

  const revenueWindowTotal = revenueChartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const processChartData =
    processRange === "7days"
      ? (appUsers.last7DaysProcess || []).map((point) => ({
          label: formatDateLabel(point.date),
          value: point.count || 0,
        }))
      : (appUsers.last6MonthProcess || []).map((point) => ({
          label: formatMonthLabel(point.month),
          value: point.count || 0,
        }));

  const processWindowTotal = processChartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // Plan mix percentages
  const totalAppUsers = Math.max(appUsers.total || 0, 1);
  const subPct = Math.round((appUsers.subscriptionPlanCount / totalAppUsers) * 100);
  const creditPct = Math.round((appUsers.creditPlanCount / totalAppUsers) * 100);
  const freePct = Math.round((appUsers.freePlanCount / totalAppUsers) * 100);
  const suspendedPct = Math.round((appUsers.suspended / totalAppUsers) * 100);

  // Revenue plan split
  const subRevAmount = revenue.byPlanType?.subscription?.amount || 0;
  const creditRevAmount = revenue.byPlanType?.credit?.amount || 0;
  const otherRevAmount = revenue.byPlanType?.other?.amount || 0;
  const totalSplitRev = Math.max(
    subRevAmount + creditRevAmount + otherRevAmount,
    1
  );
  const subRevShare = Math.round((subRevAmount / totalSplitRev) * 100);

  const recentPayments = payments.recent || stats.recentPayments || [];
  const topUsage = appUsers.topUsage || [];
  const topSpenders = payments.topSpenders || [];
  const topReferrers = stats.topReferrers || [];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Admin Overview
            </h1>
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-0.5 rounded-full border bg-muted/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Synced {formatRelativeTime(meta?.generatedAt)}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor platform revenue, user growth, processing activity, and payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </Button>
          <Button asChild variant="secondary" size="sm" className="gap-1.5">
            <Link href="/admin/users">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/admin/payments">
              <CreditCard className="h-4 w-4" />
              <span>Payments</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Conditional Operational Alert Strip */}
      {(referrals.pendingWithdrawalsCount > 0 ||
        appUsers.expiredPendingDowngrade > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {referrals.pendingWithdrawalsCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
              <div className="flex items-start sm:items-center gap-2.5 text-amber-800 dark:text-amber-200 min-w-0">
                <Wallet className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
                <span className="text-xs sm:text-sm">
                  <span className="font-semibold">
                    {referrals.pendingWithdrawalsCount} pending referral payout
                    {referrals.pendingWithdrawalsCount === 1 ? "" : "s"}
                  </span>{" "}
                  totaling{" "}
                  <span className="font-semibold">
                    {formatBdt(referrals.pendingWithdrawalsAmount)}
                  </span>{" "}
                  awaiting approval.
                </span>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-7 text-xs shrink-0 self-start sm:self-auto border-amber-500/30 bg-background/80"
              >
                <Link href="/admin/referral">
                  Review Payouts
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}

          {appUsers.expiredPendingDowngrade > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm">
              <div className="flex items-start sm:items-center gap-2.5 text-blue-800 dark:text-blue-200 min-w-0">
                <Clock className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
                <span className="text-xs sm:text-sm">
                  <span className="font-semibold">
                    {appUsers.expiredPendingDowngrade} expired paid account
                    {appUsers.expiredPendingDowngrade === 1 ? "" : "s"}
                  </span>{" "}
                  pending plan reconciliation.
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isRefreshing}
                onClick={handleRefresh}
                className="h-7 text-xs shrink-0 self-start sm:self-auto border-blue-500/30 bg-background/80 gap-1.5"
              >
                <RefreshCw
                  className={cn("h-3 w-3", isRefreshing && "animate-spin")}
                />
                Sync Plans
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 3. Primary KPI Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {formatBdt(revenue.total)}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground mt-2">
              <span>{payments.total.toLocaleString()} orders</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                +{formatBdt(revenue.today)} today
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Avg order {formatBdt(revenue.avgOrderValue)}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Monthly Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Monthly Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <div className="text-2xl font-bold tracking-tight">
                {formatBdt(revenue.currentMonth)}
              </div>
              <GrowthPill value={revenue.growthPercentage} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>{payments.newThisMonth.toLocaleString()} orders this mo</span>
              <span>Prev {formatBdt(revenue.lastMonth)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {payments.lastMonth.toLocaleString()} orders last month
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Platform Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Platform Users
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <div className="text-2xl font-bold tracking-tight">
                {users.total.toLocaleString()}
              </div>
              <GrowthPill value={users.growthPercentage} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>+{users.newThisMonth.toLocaleString()} this month</span>
              <span className="font-medium text-foreground">
                +{users.newToday.toLocaleString()} today
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {users.verificationRate}% verified ({users.verified.toLocaleString()})
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Active Premium */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Premium
            </CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <div className="text-2xl font-bold tracking-tight">
                {appUsers.activePremium.toLocaleString()}
              </div>
              <Badge variant="secondary" className="text-[11px] font-mono">
                {appUsers.conversionRate}% conv
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>{appUsers.subscriptionPlanCount.toLocaleString()} subscriptions</span>
              <span>{appUsers.creditPlanCount.toLocaleString()} credit packs</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {appUsers.active.toLocaleString()} active desktop accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Secondary Platform Pulse Row (4 Compact Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Files Processed</span>
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold">
            {processes.total.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {processes.today.toLocaleString()} today ·{" "}
            {processes.currentMonth.toLocaleString()} this mo
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Success Rate</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold">
            {processes.successRate}%
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {processes.totalFailed.toLocaleString()} failed processes
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Desktop Accounts</span>
            <KeyRound className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-lg sm:text-xl font-bold">
            {appUsers.active.toLocaleString()}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              / {appUsers.total.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {appUsers.totalDevices.toLocaleString()} linked devices
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Referral Liability</span>
            <Gift className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold">
            {formatBdt(referrals.totalAvailable)}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {referrals.pendingWithdrawalsCount} pending (
            {formatBdt(referrals.pendingWithdrawalsAmount)})
          </p>
        </div>
      </div>

      {/* 5. Interactive Dual Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="min-w-0">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Revenue Overview
                </CardTitle>
                <Badge variant="secondary" className="text-[11px] font-mono">
                  {formatBdt(revenueWindowTotal)}
                </Badge>
              </div>
              <CardDescription>
                {revenueRange === "7days"
                  ? "Daily payment collections over the last 7 days"
                  : "Monthly payment collections over the last 6 months"}
              </CardDescription>
            </div>
            <div className="flex items-center rounded-lg border bg-muted p-0.5 self-start sm:self-auto shrink-0">
              <Button
                type="button"
                variant={revenueRange === "7days" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-md"
                onClick={() => setRevenueRange("7days")}
              >
                7 Days
              </Button>
              <Button
                type="button"
                variant={revenueRange === "6months" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-md"
                onClick={() => setRevenueRange("6months")}
              >
                6 Months
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AreaChart
              data={revenueChartData}
              height={260}
              yAxisWidth={56}
              color="#3b82f6"
              tooltipLabel="Revenue"
              valueFormatter={formatBdt}
              yAxisFormatter={formatCompactBdt}
            />

            <div className="pt-2 border-t space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Subscriptions:{" "}
                  <span className="font-semibold text-foreground">
                    {formatBdt(subRevAmount)}
                  </span>{" "}
                  ({revenue.byPlanType?.subscription?.count || 0})
                </span>
                <span>
                  Credit Packs:{" "}
                  <span className="font-semibold text-foreground">
                    {formatBdt(creditRevAmount)}
                  </span>{" "}
                  ({revenue.byPlanType?.credit?.count || 0})
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex">
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${subRevShare}%` }}
                />
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${Math.max(0, 100 - subRevShare)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Processing Chart */}
        <Card className="min-w-0">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  AI Processing Activity
                </CardTitle>
                <Badge variant="secondary" className="text-[11px] font-mono">
                  {processWindowTotal.toLocaleString()} files
                </Badge>
              </div>
              <CardDescription>
                {processRange === "7days"
                  ? "Daily files processed across all desktop clients"
                  : "Monthly files processed over the last 6 months"}
              </CardDescription>
            </div>
            <div className="flex items-center rounded-lg border bg-muted p-0.5 self-start sm:self-auto shrink-0">
              <Button
                type="button"
                variant={processRange === "7days" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-md"
                onClick={() => setProcessRange("7days")}
              >
                7 Days
              </Button>
              <Button
                type="button"
                variant={processRange === "6months" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-md"
                onClick={() => setProcessRange("6months")}
              >
                6 Months
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AreaChart
              data={processChartData}
              height={260}
              yAxisWidth={48}
              color="#10b981"
              tooltipLabel="Processed"
              valueFormatter={(value) => `${value.toLocaleString()} files`}
              yAxisFormatter={formatCompactNumber}
            />

            <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  Subs:{" "}
                  <strong className="text-foreground">
                    {appUsers.subscriptionPlanCount}
                  </strong>
                </span>
                <span>
                  Credit:{" "}
                  <strong className="text-foreground">
                    {appUsers.creditPlanCount}
                  </strong>
                </span>
                <span>
                  Free:{" "}
                  <strong className="text-foreground">
                    {appUsers.freePlanCount}
                  </strong>
                </span>
                <span>
                  Suspended:{" "}
                  <strong className="text-destructive">
                    {appUsers.suspended}
                  </strong>
                </span>
              </div>
              <GrowthPill value={processes.growthPercentage} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6. Recent Payments & Plan Distribution / Operations */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Recent Payments (8 cols) */}
        <Card className="xl:col-span-8 min-w-0">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Recent Payments
                </CardTitle>
                <Badge variant="outline" className="text-[11px] font-mono">
                  {payments.newThisMonth} this month
                </Badge>
              </div>
              <CardDescription>
                Latest verified package upgrades and credit purchases
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 self-start sm:self-auto"
            >
              <Link href="/admin/payments">
                View All
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 px-4 text-center">
                <CreditCard className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium text-foreground">
                  No recent payments
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed customer transactions will appear here automatically.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop & Tablet Table */}
                <div className="hidden md:block rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Status &amp; Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPayments.map((payment, index) => {
                        const userObj = payment.userId || {
                          _id: "",
                          name: "Unknown User",
                          email: "N/A",
                          avatar: null,
                        };
                        const { date, time } = formatDateTime(payment.createdAt);

                        return (
                          <TableRow key={payment._id || index}>
                            <TableCell>
                              <div className="flex items-center gap-3 min-w-[180px]">
                                <Avatar className="h-8 w-8 border shrink-0">
                                  <AvatarImage
                                    src={userObj.avatar || undefined}
                                    alt={userObj.name}
                                  />
                                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                    {getInitials(userObj.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-sm truncate">
                                    {userObj.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {userObj.email}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium capitalize">
                                  {payment.plan?.name || "Standard"}
                                </span>
                                <span className="text-[11px] text-muted-foreground capitalize">
                                  {payment.plan?.type || "subscription"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-xs text-foreground">
                                  {payment.trxID || payment.paymentID || "—"}
                                </span>
                                <span className="text-[11px] text-muted-foreground capitalize">
                                  {payment.gateway || "paystation"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold whitespace-nowrap">
                              {formatBdt(payment.amount)}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <div className="flex flex-col items-end gap-1">
                                <PaymentStatusBadge status={payment.status} />
                                <span className="text-[11px] text-muted-foreground">
                                  {date}
                                  {time ? ` · ${time}` : ""}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y rounded-lg border">
                  {recentPayments.map((payment, index) => {
                    const userObj = payment.userId || {
                      _id: "",
                      name: "Unknown User",
                      email: "N/A",
                      avatar: null,
                    };
                    const { date, time } = formatDateTime(payment.createdAt);

                    return (
                      <div key={payment._id || index} className="p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="h-8 w-8 border shrink-0">
                              <AvatarImage
                                src={userObj.avatar || undefined}
                                alt={userObj.name}
                              />
                              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                {getInitials(userObj.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {userObj.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {userObj.email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold">
                              {formatBdt(payment.amount)}
                            </p>
                            <PaymentStatusBadge status={payment.status} />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
                          <span className="capitalize">
                            {payment.plan?.name || payment.plan?.type || "Standard"}
                          </span>
                          <span className="font-mono text-[11px]">
                            {payment.trxID || "—"}
                          </span>
                          <span>
                            {date}
                            {time ? ` · ${time}` : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Plan Breakdown & Admin Quick Links (4 cols) */}
        <Card className="xl:col-span-4 min-w-0 flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Plan Breakdown &amp; Operations
              </CardTitle>
              <CardDescription>
                Desktop license tiers and referral summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Subscriptions</span>
                    <span className="text-muted-foreground font-mono">
                      {appUsers.subscriptionPlanCount} ({subPct}%)
                    </span>
                  </div>
                  <Progress value={subPct} className="h-1.5" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Credit Packs</span>
                    <span className="text-muted-foreground font-mono">
                      {appUsers.creditPlanCount} ({creditPct}%)
                    </span>
                  </div>
                  <Progress value={creditPct} className="h-1.5" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Free Tier</span>
                    <span className="text-muted-foreground font-mono">
                      {appUsers.freePlanCount} ({freePct}%)
                    </span>
                  </div>
                  <Progress value={freePct} className="h-1.5" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-destructive">Suspended</span>
                    <span className="text-muted-foreground font-mono">
                      {appUsers.suspended} ({suspendedPct}%)
                    </span>
                  </div>
                  <Progress value={suspendedPct} className="h-1.5" />
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Referral Partners</span>
                  <span className="font-semibold">
                    {referrals.totalReferrers.toLocaleString()} (
                    {referrals.totalReferredUsers.toLocaleString()} invited)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Commissions</span>
                  <span className="font-semibold">
                    {formatBdt(referrals.totalEarned)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Paid Out</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatBdt(referrals.completedWithdrawalsAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0 space-y-1.5">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full justify-between text-xs"
            >
              <Link href="/admin/referral">
                <span className="inline-flex items-center gap-2">
                  <Gift className="h-3.5 w-3.5" />
                  Manage Referral Payouts
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs text-muted-foreground"
            >
              <Link href="/admin/manage-pricing">
                <span className="inline-flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5" />
                  Pricing &amp; Promo Codes
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            {isSuperAdmin && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs text-muted-foreground"
              >
                <Link href="/admin/scheduler">
                  <span className="inline-flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5" />
                    Scheduler &amp; Maintenance
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* 7. Top Performers Row (3 Ranked Lists) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top API Usage */}
        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Top API Usage
            </CardTitle>
            <CardDescription className="text-xs">
              Most active accounts by processed files
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topUsage.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                No processing activity recorded yet
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {topUsage.map((item, index) => {
                  const rowBody = (
                    <div className="flex items-center justify-between gap-3 p-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[11px] font-mono text-muted-foreground w-4 shrink-0">
                          #{index + 1}
                        </span>
                        <Avatar className="h-8 w-8 border shrink-0">
                          <AvatarImage
                            src={item.user?.avatar || undefined}
                            alt={item.user?.name || "User"}
                          />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(item.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.user?.name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">
                          {item.count.toLocaleString()}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-[10px] capitalize px-1.5 py-0"
                        >
                          {item.planType}
                        </Badge>
                      </div>
                    </div>
                  );

                  const profileId = item.userId || item.user?._id;
                  return profileId ? (
                    <Link
                      key={item._id || index}
                      href={`/admin/users/${encodeURIComponent(profileId)}`}
                      className="block"
                    >
                      {rowBody}
                    </Link>
                  ) : (
                    <div key={item._id || index}>{rowBody}</div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Spenders */}
        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Top Spenders
            </CardTitle>
            <CardDescription className="text-xs">
              Highest cumulative customer spend
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topSpenders.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                No customer payments recorded yet
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {topSpenders.map((item, index) => (
                  <div
                    key={item._id || index}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-mono text-muted-foreground w-4 shrink-0">
                        #{index + 1}
                      </span>
                      <Avatar className="h-8 w-8 border shrink-0">
                        <AvatarImage
                          src={item.user?.avatar || undefined}
                          alt={item.user?.name || "User"}
                        />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(item.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.user?.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {formatBdt(item.totalSpent)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.paymentCount} order
                        {item.paymentCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Top Referrers
            </CardTitle>
            <CardDescription className="text-xs">
              Leading affiliate partners by invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topReferrers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                No referral activity recorded yet
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {topReferrers.map((item, index) => {
                  const rowBody = (
                    <div className="flex items-center justify-between gap-3 p-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[11px] font-mono text-muted-foreground w-4 shrink-0">
                          #{index + 1}
                        </span>
                        <Avatar className="h-8 w-8 border shrink-0">
                          <AvatarImage
                            src={item.user?.avatar || undefined}
                            alt={item.user?.name || "User"}
                          />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(item.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.user?.name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">
                          {item.referredCount.toLocaleString()} invited
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          {formatBdt(item.totalEarned)} earned
                        </p>
                      </div>
                    </div>
                  );

                  return item.userId ? (
                    <Link
                      key={item._id || index}
                      href={`/admin/referral/${item.userId}`}
                      className="block"
                    >
                      {rowBody}
                    </Link>
                  ) : (
                    <div key={item._id || index}>{rowBody}</div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
