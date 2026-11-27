"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  useOverviewQuery,
  useRemoveDesktopDeviceMutation,
} from "@/services/queries/dashboard";
import type { DesktopDevice } from "@/types/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserDashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import {
  Infinity as InfinityIcon,
  Zap,
  Sparkles,
  Download,
  RefreshCw,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Laptop,
  Monitor,
  Trash2,
  Clock,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { ProcessChart } from "@/components/dashboard/process-chart";

function formatRelativeTime(value?: string | null, fallback = "Recently"): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return formatDistanceToNow(date, { addSuffix: true });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "MMM d, h:mm a");
}

function formatPlatformLabel(platform?: string): string {
  if (!platform || platform === "unknown") return "";
  const normalized = platform.toLowerCase();
  if (normalized === "win32" || normalized === "windows") return "Windows";
  if (normalized === "darwin" || normalized === "macos") return "macOS";
  if (normalized === "linux") return "Linux";
  return platform;
}

export default function Overview() {
  const [chartView, setChartView] = useState<"7days" | "monthly">("7days");
  const [deviceToRemove, setDeviceToRemove] = useState<DesktopDevice | null>(
    null
  );

  const {
    data: overviewRes,
    isPending: isLoading,
    isRefetching,
    refetch,
    isError,
    error,
  } = useOverviewQuery();

  const removeDeviceMutation = useRemoveDesktopDeviceMutation();

  const handleRefresh = async () => {
    const res = await refetch();
    if (res.isError || !res.data?.success) {
      toast.error(
        (res.data && !res.data.success ? res.data.message : null) ||
        (res.error as Error)?.message ||
        "Failed to refresh dashboard data"
      );
      return;
    }
    toast.success("Dashboard data refreshed");
  };

  const handleConfirmRemoveDevice = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    if (!deviceToRemove || removeDeviceMutation.isPending) return;

    try {
      const res = await removeDeviceMutation.mutateAsync(
        deviceToRemove.deviceId
      );
      if (res.success) {
        toast.success(res.message || "Desktop device removed");
        setDeviceToRemove(null);
      } else {
        toast.error(res.message || "Failed to remove desktop device");
        await refetch();
        setDeviceToRemove(null);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove desktop device"
      );
      await refetch();
      setDeviceToRemove(null);
    }
  };

  if (isLoading) {
    return <UserDashboardSkeleton />;
  }

  if (isError || !overviewRes?.success || !overviewRes.data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[350px] rounded-xl border border-dashed border-destructive/40 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold text-foreground">
          Failed to load overview data
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {overviewRes?.message ||
            (error as Error)?.message ||
            "An unexpected error occurred while fetching your dashboard."}
        </p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const data = overviewRes.data;

  const user = data.user || { name: "Creator", email: "", isVerified: false };
  const plan = data.plan || {
    type: data.appUser?.planType || "free",
    name: data.appUser?.planName || "Free Tier",
  };
  const credit = data.credit ?? data.appUser?.creditRemaining ?? 0;
  const remainingDays = data.remainingDays ?? data.appUser?.daysLeft ?? null;
  const totalProcess = data.totalProcess ?? data.appUser?.totalProcess ?? 0;
  const todayProcess = data.todayProcess ?? data.appUser?.todayUsage ?? 0;
  const thisMonthProcess =
    data.currentMonthProcess ?? data.appUser?.thisMonthUsage ?? 0;

  const last7DaysProcess =
    data.last7DaysProcess || data.appUser?.last7DaysProcess || [];
  const last6MonthProcess =
    data.last6MonthProcess || data.appUser?.last6MonthProcess || [];
  const recentHistory = data.recentHistory || [];

  const devices = data.appUser?.devices || [];
  const maxDevices = data.appUser?.maxDevices ?? 2;
  const deviceRemoval = data.appUser?.deviceRemoval ?? {
    canRemoveDevice: true,
    lastDeviceRemovalAt: null,
    nextDeviceRemovalAt: null,
    remainingMs: 0,
  };

  const activeChartData =
    chartView === "7days" ? last7DaysProcess : last6MonthProcess;
  const chartWindowTotal = activeChartData.reduce(
    (sum, item) => sum + (item.count || 0),
    0
  );

  const isSubscription = plan.type === "subscription";
  const isAccountRestricted = Boolean(
    data.appUser?.isSuspended || data.appUser?.isManuallyDisabled
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user.name}
            </h1>
            <Badge
              variant={isSubscription ? "default" : "secondary"}
              className="capitalize text-xs font-medium"
            >
              {plan.name || plan.type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your AI processing quota, connected desktop devices, and daily
            activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button asChild variant="secondary" size="sm" className="gap-2">
            <Link href="/download">
              <Download className="h-4 w-4" />
              Download App
            </Link>
          </Button>

          <Button asChild size="sm" className="gap-2">
            <Link href="/pricing">
              <Sparkles className="h-4 w-4" />
              Upgrade Plan
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Four Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Current Plan
            </CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {plan.name || plan.type}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>
                {remainingDays !== null && remainingDays !== undefined
                  ? `${remainingDays} days remaining`
                  : isSubscription
                    ? "Auto-renew active"
                    : "Permanent quota"}
              </span>
              <Link
                href="/pricing"
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                Manage <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Process Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Available Credits
            </CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1.5">
              {isSubscription || credit === null ? (
                <span className="flex items-center gap-1.5 text-foreground">
                  <InfinityIcon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-normal text-muted-foreground">
                    Unlimited
                  </span>
                </span>
              ) : (
                credit.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isSubscription
                ? "Full subscription access"
                : plan.type === "free"
                  ? "Daily free quota"
                  : "Pay-as-you-go balance"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Today's Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Today&apos;s Output
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayProcess.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Files processed today
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Total Lifetime Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Processed
            </CardTitle>
            <Layers className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProcess.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {thisMonthProcess.toLocaleString()} processed this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Analytics & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Process Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Processing Activity
                </CardTitle>
                <Badge variant="secondary" className="text-[11px] font-mono">
                  {chartWindowTotal.toLocaleString()} files
                </Badge>
              </div>
              <CardDescription>
                {chartView === "7days"
                  ? "Files processed in the last 7 days."
                  : "Monthly files processed over the last 6 months."}
              </CardDescription>
            </div>
            <div className="flex items-center rounded-lg border bg-muted p-0.5 self-start sm:self-auto">
              <Button
                variant={chartView === "7days" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-md"
                onClick={() => setChartView("7days")}
              >
                7 Days
              </Button>
              <Button
                variant={chartView === "monthly" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-md"
                onClick={() => setChartView("monthly")}
              >
                6 Months
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full pt-2">
              {chartView === "7days" ? (
                <ProcessChart data={last7DaysProcess} type="daily" />
              ) : (
                <ProcessChart data={last6MonthProcess} type="monthly" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column (1/3): Account Quota & Quick Info */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Account Quota
              </CardTitle>
              <CardDescription>Device and subscription limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2.5">
                  <Laptop className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Authorized Devices
                  </span>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {devices.length} / {maxDevices} Devices
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2.5">
                  {isAccountRestricted ? (
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                  ) : user.isVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm font-medium">Account Status</span>
                </div>
                {isAccountRestricted ? (
                  <Badge
                    variant="outline"
                    className="text-destructive border-destructive/30 bg-destructive/10 text-xs"
                  >
                    {data.appUser?.isSuspended ? "Suspended" : "Inactive"}
                  </Badge>
                ) : user.isVerified ? (
                  <Badge
                    variant="outline"
                    className="text-emerald-600 border-emerald-500/20 bg-emerald-500/10 text-xs"
                  >
                    Verified
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-amber-600 border-amber-500/20 bg-amber-500/10 text-xs"
                  >
                    Unverified
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Invested</span>
                </div>
                <span className="text-sm font-semibold">
                  ৳{(data.totalSpent || 0).toLocaleString()} BDT
                </span>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0 space-y-2">
            <Button
              asChild
              variant="outline"
              className="w-full justify-between text-xs font-medium"
            >
              <Link href="/dashboard/profile">
                <span>View Account Profile</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-between text-xs text-muted-foreground"
            >
              <Link href="/dashboard/referral">
                <span>Referral Partner Hub</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* 4. Desktop App Login Devices */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                Desktop App Devices
              </CardTitle>
              <Badge variant="outline" className="text-xs font-mono">
                {devices.length} / {maxDevices} Devices
              </Badge>
            </div>
            <CardDescription className="mt-1">
              Computers signed in to the GenMeta desktop app. You can remove 1
              desktop device every 24 hours.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!deviceRemoval.canRemoveDevice &&
            deviceRemoval.nextDeviceRemovalAt && (
              <div className="flex items-start sm:items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-300">
                <Clock className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  Daily device removal limit reached. You can remove another
                  desktop device{" "}
                  <span className="font-semibold">
                    {formatRelativeTime(deviceRemoval.nextDeviceRemovalAt)}
                  </span>{" "}
                  ({formatDateTime(deviceRemoval.nextDeviceRemovalAt)}).
                </span>
              </div>
            )}

          {devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 px-4 text-center">
              <Laptop className="h-8 w-8 text-muted-foreground mb-2.5" />
              <p className="text-sm font-medium text-foreground">
                No desktop devices signed in
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Sign in from the GenMeta desktop app to see your connected
                computers here.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5 text-xs"
              >
                <Link href="/download">
                  <Download className="h-3.5 w-3.5" />
                  Download Desktop App
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {devices.map((device) => {
                const platformLabel = formatPlatformLabel(device.platform);
                const metaParts = [
                  platformLabel && device.osVersion
                    ? `${platformLabel} ${device.osVersion}`
                    : platformLabel || device.osVersion,
                  device.arch,
                  device.ipAddress ? `IP ${device.ipAddress}` : "",
                ].filter(Boolean);

                const isRemovingThis =
                  removeDeviceMutation.isPending &&
                  removeDeviceMutation.variables === device.deviceId;

                return (
                  <div
                    key={device.deviceId}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                        <Monitor className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {device.deviceName || "Desktop Device"}
                          </span>
                          {device.appVersion && (
                            <Badge
                              variant="secondary"
                              className="text-[11px] font-mono"
                            >
                              v{device.appVersion}
                            </Badge>
                          )}
                        </div>
                        {metaParts.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {metaParts.join(" · ")}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Last active {formatRelativeTime(device.lastActiveAt)}
                          {device.firstLoginAt
                            ? ` · First signed in ${formatDateTime(device.firstLoginAt)}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        !deviceRemoval.canRemoveDevice ||
                        removeDeviceMutation.isPending
                      }
                      onClick={() => setDeviceToRemove(device)}
                      title={
                        !deviceRemoval.canRemoveDevice
                          ? "You can only remove 1 desktop device every 24 hours"
                          : "Remove desktop device"
                      }
                      className="self-start sm:self-auto gap-1.5 text-destructive hover:text-destructive"
                    >
                      {isRemovingThis ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Recent Activity Ledger */}
      {recentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Recent Transactions
            </CardTitle>
            <CardDescription>
              Your latest plan upgrades and credit renewals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-left text-xs font-medium text-muted-foreground">
                      <th className="p-3">Reference / TrxID</th>
                      <th className="p-3">Plan / Item</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentHistory.slice(0, 5).map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="p-3 font-mono text-xs text-muted-foreground">
                          {item.trxID || item._id.slice(0, 10)}
                        </td>
                        <td className="p-3 font-medium capitalize">
                          {item.plan?.name || item.plan?.type || "Standard"}
                        </td>
                        <td className="p-3 font-semibold">
                          ৳{(item.amount || 0).toLocaleString()} BDT
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Badge
                            variant={
                              item.status?.toLowerCase() === "completed"
                                ? "default"
                                : "secondary"
                            }
                            className="text-[11px] capitalize"
                          >
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog for Desktop Device Removal */}
      <AlertDialog
        open={Boolean(deviceToRemove)}
        onOpenChange={(open) => {
          if (!open && !removeDeviceMutation.isPending) {
            setDeviceToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove desktop device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign out and unlink{" "}
              <span className="font-semibold text-foreground">
                {deviceToRemove?.deviceName || "this desktop device"}
              </span>{" "}
              from your GenMeta desktop license. You can only remove 1 desktop
              device every 24 hours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeDeviceMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemoveDevice}
              disabled={removeDeviceMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {removeDeviceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Device"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
