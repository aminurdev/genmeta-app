"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Gift,
  Globe,
  History,
  Infinity as InfinityIcon,
  KeyRound,
  Laptop,
  Loader2,
  Monitor,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAddCreditsMutation,
  useAppUserDetailsQuery,
  useDeleteAppUserMutation,
  useRefreshAppUserDetailsMutation,
  useResetDeviceMutation,
  useUpdateAppUserStatusMutation,
} from "@/services/queries/admin-dashboard";
import type { AdminDesktopDevice } from "@/types/admin";
import { UserProfileSkeleton } from "@/components/admin/users/users-skeleton";
import {
  UpgradePlanDialog,
  type UpgradePlanTargetUser,
} from "@/components/admin/users/upgrade-plan-dialog";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function formatBdt(amount: number | undefined | null): string {
  const numeric = Number(amount) || 0;
  return `৳${numeric.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value?: string | null, fallback = "—"): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return format(parsed, "MMM d, yyyy · h:mm a");
}

function formatDateOnly(value?: string | null, fallback = "—"): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return format(parsed, "MMM d, yyyy");
}

function formatRelativeTime(value?: string | null, fallback = "Never"): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return formatDistanceToNow(parsed, { addSuffix: true });
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

function formatMonthLabel(monthStr?: string): string {
  if (!monthStr) return "";
  const parts = monthStr.split("-").map((p) => Number.parseInt(p, 10));
  if (parts.length >= 2 && parts.slice(0, 2).every(Number.isFinite)) {
    return format(new Date(parts[0], parts[1] - 1, 1), "MMM yy");
  }
  return monthStr;
}

function formatPlatformLabel(platform?: string): string {
  if (!platform || platform === "unknown") return "";
  const normalized = platform.toLowerCase();
  if (normalized === "win32" || normalized === "windows") return "Windows";
  if (normalized === "darwin" || normalized === "macos") return "macOS";
  if (normalized === "linux") return "Linux";
  return platform;
}

function getInitials(name?: string): string {
  if (!name) return "U";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return initials || "U";
}

export default function AppUserDetailsPage({ userId }: { userId: string }) {
  const router = useRouter();
  const [chartView, setChartView] = useState<"7days" | "6months">("7days");
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [addCreditDialogOpen, setAddCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("100");
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);

  const {
    data: detailsRes,
    isPending: isLoading,
    isRefetching,
    error,
    refetch,
  } = useAppUserDetailsQuery(userId);

  const refreshMutation = useRefreshAppUserDetailsMutation(userId);
  const resetDeviceMutation = useResetDeviceMutation();
  const statusMutation = useUpdateAppUserStatusMutation();
  const deleteMutation = useDeleteAppUserMutation();
  const addCreditsMutation = useAddCreditsMutation();

  const isRefreshing = refreshMutation.isPending || isRefetching;

  const copyToClipboard = async (text: string, label = "Copied to clipboard") => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleRefresh = async () => {
    try {
      const res = await refreshMutation.mutateAsync();
      if (res.success) {
        toast.success("User profile refreshed");
      } else {
        toast.error(res.message || "Failed to refresh user profile");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh user profile"
      );
    }
  };

  const handleResetDevices = async (deviceId?: string) => {
    if (!detailsRes?.success || !detailsRes.data) return;
    const targetUserId =
      detailsRes.data.user.id || detailsRes.data.appUser.userId;
    if (deviceId) setRemovingDeviceId(deviceId);
    try {
      const res = await resetDeviceMutation.mutateAsync({
        userId: targetUserId,
        deviceId,
      });
      if (res.success) {
        toast.success(
          res.message ||
          (deviceId
            ? "Desktop device removed"
            : "All desktop devices reset")
        );
      } else {
        toast.error(res.message || "Failed to update desktop devices");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update desktop devices"
      );
    } finally {
      setRemovingDeviceId(null);
    }
  };

  const handleToggleStatus = async (mode: "suspend" | "reactivate") => {
    if (!detailsRes?.success || !detailsRes.data) return;
    const targetUserId =
      detailsRes.data.user.id || detailsRes.data.appUser.userId;
    try {
      const res = await statusMutation.mutateAsync({
        userId: targetUserId,
        mode,
      });
      if (res.success) {
        toast.success(
          res.message ||
          `App user ${mode === "suspend" ? "suspended" : "reactivated"}`
        );
      } else {
        toast.error(res.message || `Failed to ${mode} app user`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to ${mode} app user`
      );
    }
  };

  const handleDelete = async () => {
    if (!detailsRes?.success || !detailsRes.data) return;
    const targetUserId =
      detailsRes.data.user.id ||
      detailsRes.data.appUser.userId ||
      detailsRes.data.appUser.username;
    try {
      const res = await deleteMutation.mutateAsync(targetUserId);
      if (res.success) {
        toast.success("App user desktop profile deleted");
        router.push("/admin/users");
      } else {
        toast.error(res.message || "Failed to delete app user");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete app user"
      );
    }
  };

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailsRes?.success || !detailsRes.data) return;
    const credits = Number.parseInt(creditAmount, 10);
    if (!Number.isFinite(credits) || credits < 1) {
      toast.error("Please enter a valid positive credit amount");
      return;
    }

    const targetUserId =
      detailsRes.data.user.id || detailsRes.data.appUser.userId;
    try {
      const res = await addCreditsMutation.mutateAsync({
        userId: targetUserId,
        credits,
      });
      if (res.success) {
        toast.success(res.message || `${credits} credits added`);
        setAddCreditDialogOpen(false);
        setCreditAmount("100");
      } else {
        toast.error(res.message || "Failed to add credits");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add credits");
    }
  };

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  if (error || !detailsRes?.success || !detailsRes?.data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[380px] rounded-xl border border-dashed border-destructive/40 text-center">
        <XCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold">
          Failed to load user profile
        </h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
          {(detailsRes && !detailsRes.success ? detailsRes.message : null) ||
            (error instanceof Error ? error.message : null) ||
            "The requested user or desktop license could not be found."}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/users" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Link>
          </Button>
          <Button onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { user, appUser, payments, paymentSummary, referral, security, meta } =
    detailsRes.data;

  const isSubscription = appUser.plan.type === "subscription";
  const devices: AdminDesktopDevice[] = appUser.devices || [];
  const activeSessions = security?.sessions || [];

  const activeChartData =
    chartView === "7days"
      ? (appUser.last7DaysProcess || []).map((pt) => ({
        label: formatDayLabel(pt.date),
        value: pt.count || 0,
      }))
      : (appUser.last6MonthProcess || []).map((pt) => ({
        label: formatMonthLabel(pt.month),
        value: pt.count || 0,
      }));

  const chartWindowTotal = activeChartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const upgradeTargetUser: UpgradePlanTargetUser = {
    userId: user.id,
    username: appUser.username,
    name: user.name,
    email: user.email,
    status: appUser.status,
    isActive: appUser.isActive,
    maxDevices: appUser.maxDevices,
    credit: appUser.credit,
    expiresAt: appUser.expiresAt,
    plan: appUser.plan,
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Navigation & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="h-9 w-9 shrink-0"
          >
            <Link href="/admin/users" aria-label="Back to Users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                User &amp; License Profile
              </h1>
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-0.5 rounded-full border bg-muted/50">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Synced {formatRelativeTime(meta?.generatedAt, "now")}</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Complete platform identity, desktop license telemetry, payments,
              and security sessions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setUpgradeDialogOpen(true)}
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            <span>Upgrade / Plan</span>
          </Button>

          {!isSubscription && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAddCreditDialogOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Credits</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Hero Identity Card */}
      <Card>
        <CardContent className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
            <Avatar className="h-14 w-14 border shrink-0">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold truncate">
                  {user.name}
                </h2>
                <Badge variant="secondary" className="capitalize text-xs">
                  {user.role}
                </Badge>
                {user.isVerified ? (
                  <Badge
                    variant="outline"
                    className="text-xs gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs gap-1 text-amber-600 dark:text-amber-400 border-amber-500/25 bg-amber-500/10"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Unverified
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize text-xs",
                    appUser.status === "suspended"
                      ? "text-destructive border-destructive/25 bg-destructive/10"
                      : "text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
                  )}
                >
                  License: {appUser.status}
                </Badge>
                {user.isDisabled && (
                  <Badge variant="destructive" className="text-xs">
                    Account Disabled
                  </Badge>
                )}
                {user.isLocked && (
                  <Badge variant="destructive" className="text-xs">
                    Login Locked
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.email, "Email copied")}
                  className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <span className="truncate">{user.email}</span>
                  <Copy className="h-3 w-3 shrink-0" />
                </button>
                <span>·</span>
                <span>Joined {formatDateOnly(user.createdAt)}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  Providers:{" "}
                  {user.loginProvider.map((p) => (
                    <Badge
                      key={p}
                      variant="outline"
                      className="text-[10px] capitalize px-1.5 py-0"
                    >
                      {p}
                    </Badge>
                  ))}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {appUser.status === "active" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus("suspend")}
                disabled={statusMutation.isPending}
                className="gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-600"
              >
                {statusMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldAlert className="h-4 w-4" />
                )}
                Suspend License
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus("reactivate")}
                disabled={statusMutation.isPending}
                className="gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-600"
              >
                {statusMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Reactivate License
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Trash2 className="h-4 w-4" />
                  Delete Profile
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Desktop Profile?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes the desktop App User license, plan,
                    and device bindings for{" "}
                    <span className="font-semibold text-foreground">
                      {user.name}
                    </span>
                    . Their web account will remain intact.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Profile"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* 3. Four Core Profile KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Current Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Current Plan
            </CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl sm:text-2xl font-bold capitalize truncate">
                {appUser.plan.name || appUser.plan.type}
              </span>
              {appUser.isExpired && (
                <Badge variant="destructive" className="text-[10px]">
                  Expired
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>
                {appUser.expiresAt
                  ? appUser.remainingDays !== null && appUser.remainingDays > 0
                    ? `${appUser.remainingDays} days left`
                    : `Exp ${formatDateOnly(appUser.expiresAt)}`
                  : isSubscription
                    ? "Active subscription"
                    : "Permanent free tier"}
              </span>
              <button
                type="button"
                onClick={() => setUpgradeDialogOpen(true)}
                className="text-primary hover:underline font-medium"
              >
                Change
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Available Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Available Credits
            </CardTitle>
            <KeyRound className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1.5">
              {isSubscription || appUser.credit === null ? (
                <span className="inline-flex items-center gap-1.5">
                  <InfinityIcon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-normal text-muted-foreground">
                    Unlimited
                  </span>
                </span>
              ) : (
                appUser.credit.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isSubscription
                ? "Unlimited subscription access"
                : appUser.lastCreditRefresh
                  ? `Last refresh ${appUser.lastCreditRefresh}`
                  : "Pay-as-you-go balance"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Processing Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Processed
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-bold">
                {appUser.totalProcess.toLocaleString()}
              </span>
              <Badge
                variant="outline"
                className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
              >
                {appUser.successRate}% ok
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {appUser.todayProcess.toLocaleString()} today ·{" "}
              {appUser.currentMonthProcess.toLocaleString()} this mo (
              {appUser.totalFailedProcess} failed)
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Lifetime Spend & Referrals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Lifetime Spend
            </CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBdt(paymentSummary.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {paymentSummary.totalCount} payment
              {paymentSummary.totalCount === 1 ? "" : "s"} · Referral bal{" "}
              {formatBdt(referral.availableBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Row 1: Processing Activity Chart + Account & Security Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Usage Chart (7 cols) */}
        <Card className="xl:col-span-7 min-w-0 flex flex-col justify-between">
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
                  ? "Daily files processed over the last 7 UTC days"
                  : "Monthly files processed over the last 6 months"}
              </CardDescription>
            </div>
            <div className="flex items-center rounded-lg border bg-muted p-0.5 self-start sm:self-auto shrink-0">
              <Button
                type="button"
                variant={chartView === "7days" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-md"
                onClick={() => setChartView("7days")}
              >
                7 Days
              </Button>
              <Button
                type="button"
                variant={chartView === "6months" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-md"
                onClick={() => setChartView("6months")}
              >
                6 Months
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AreaChart
              data={activeChartData}
              height={260}
              yAxisWidth={44}
              color={chartView === "7days" ? "#10b981" : "#3b82f6"}
              tooltipLabel="Files"
              valueFormatter={(v) => `${v.toLocaleString()} files`}
            />

            {appUser.recentFailures.length > 0 && (
              <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-destructive">
                  <span>Recent Processing Failures (Last 3 Days)</span>
                  <span>
                    {appUser.recentFailures.reduce(
                      (s, f) => s + f.count,
                      0
                    )}{" "}
                    errors
                  </span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto text-xs text-muted-foreground">
                  {appUser.recentFailures.map((fail) => (
                    <div key={fail.date} className="flex flex-wrap gap-1.5">
                      <span className="font-mono text-foreground">
                        {fail.date}:
                      </span>
                      <span>
                        {fail.count} failed
                        {fail.errorMessages.length > 0
                          ? ` (${fail.errorMessages.slice(0, 2).join("; ")})`
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account & Security Overview (5 cols) */}
        <Card className="xl:col-span-5 min-w-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Account &amp; Security Overview
            </CardTitle>
            <CardDescription>
              User metadata, authentication state, and active web sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y rounded-lg border text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-muted-foreground">User ID</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.id, "User ID copied")}
                  className="inline-flex items-center gap-1.5 font-mono text-xs hover:text-primary"
                >
                  <span>{user.id}</span>
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-muted-foreground">Last Login</span>
                <span className="font-medium text-right">
                  {formatDateTime(user.lastLoginAt, "Never logged in")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-muted-foreground">Password Changed</span>
                <span className="text-right">
                  {formatDateTime(user.passwordChangedAt, "Not changed")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-muted-foreground">Last Plan Change</span>
                <span className="text-right">
                  {formatDateTime(appUser.lastPlanChange)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-muted-foreground">Last Known IP</span>
                <span className="font-mono text-xs">
                  {user.ipAddress || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-muted-foreground">
                  Failed Login Attempts
                </span>
                <span className="font-mono">
                  {user.failedLoginAttempts}
                  {user.isLocked ? " (Locked)" : ""}
                </span>
              </div>
              {user.referredBy && (
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <span className="text-muted-foreground">Referred By</span>
                  <span className="text-right truncate max-w-[200px]">
                    {user.referredBy.referrerName ||
                      user.referredBy.referrerEmail ||
                      user.referredBy.referralCode}
                  </span>
                </div>
              )}
            </div>

            {/* Active Web Sessions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Web Sessions
                </span>
                <Badge variant="outline" className="text-[11px] font-mono">
                  {security.activeSessionsCount} active
                </Badge>
              </div>
              {activeSessions.length === 0 ? (
                <p className="text-xs text-muted-foreground rounded-lg border border-dashed py-4 text-center">
                  No active web browser sessions
                </p>
              ) : (
                <div className="divide-y rounded-lg border max-h-44 overflow-y-auto">
                  {activeSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {session.deviceName}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {session.ipAddress || "Unknown IP"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {formatRelativeTime(session.lastActiveAt, "Active")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Tabbed Management Details */}
      <Card>
        <Tabs defaultValue="devices" className="w-full">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-base font-semibold">
                License Telemetry &amp; Ledgers
              </CardTitle>
              <CardDescription>
                Manage bound desktop computers, inspect transactions, plan
                changes, and referral stats.
              </CardDescription>
            </div>
            <TabsList className="grid w-full md:w-auto grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="devices" className="text-xs py-1.5 gap-1.5">
                <Laptop className="h-3.5 w-3.5" />
                Devices ({devices.length})
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs py-1.5 gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Payments ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs py-1.5 gap-1.5">
                <History className="h-3.5 w-3.5" />
                Plan History ({appUser.planHistory.length})
              </TabsTrigger>
              <TabsTrigger value="referral" className="text-xs py-1.5 gap-1.5">
                <Gift className="h-3.5 w-3.5" />
                Referral
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            {/* TAB 1: Desktop Devices */}
            <TabsContent value="devices" className="mt-0 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-mono text-xs">
                    {devices.length} / {appUser.maxDevices} Devices Bound
                  </Badge>
                  {!appUser.deviceRemoval.canRemoveDevice &&
                    appUser.deviceRemoval.nextDeviceRemovalAt && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Self-service cooldown until{" "}
                        {formatDateTime(
                          appUser.deviceRemoval.nextDeviceRemovalAt
                        )}
                      </span>
                    )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    resetDeviceMutation.isPending || devices.length === 0
                  }
                  onClick={() => handleResetDevices()}
                  className="gap-1.5 self-start sm:self-auto"
                >
                  {resetDeviceMutation.isPending && !removingDeviceId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Smartphone className="h-3.5 w-3.5" />
                  )}
                  Reset All Devices
                </Button>
              </div>

              {devices.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 px-4 text-center">
                  <Laptop className="h-9 w-9 text-muted-foreground/60 mb-2.5" />
                  <p className="text-sm font-medium">
                    No desktop computers bound
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    When this user signs in via the GenMeta desktop app, device
                    hardware details will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y rounded-lg border">
                  {devices.map((device) => {
                    const platformLabel = formatPlatformLabel(device.platform);
                    const metaParts = [
                      platformLabel && device.osVersion
                        ? `${platformLabel} ${device.osVersion}`
                        : platformLabel || device.osVersion,
                      device.arch,
                      device.cpuModel,
                      device.ipAddress ? `IP ${device.ipAddress}` : "",
                    ].filter(Boolean);

                    const isRemoving = removingDeviceId === device.deviceId;

                    return (
                      <div
                        key={device.deviceId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                            <Monitor className="h-4 w-4" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">
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
                              <code className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {device.deviceId.slice(0, 12)}...
                              </code>
                            </div>
                            {metaParts.length > 0 && (
                              <p className="text-xs text-muted-foreground break-words">
                                {metaParts.join(" · ")}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Last active{" "}
                              {formatRelativeTime(device.lastActiveAt)}
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
                          disabled={resetDeviceMutation.isPending}
                          onClick={() => handleResetDevices(device.deviceId)}
                          className="self-start sm:self-auto gap-1.5 text-destructive hover:text-destructive shrink-0"
                        >
                          {isRemoving ? (
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
            </TabsContent>

            {/* TAB 2: Payment History */}
            <TabsContent value="payments" className="mt-0">
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 px-4 text-center">
                  <CreditCard className="h-9 w-9 text-muted-foreground/60 mb-2.5" />
                  <p className="text-sm font-medium">No payment transactions</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Online checkouts and manual admin payments will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Gateway</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <div className="space-y-0.5">
                                <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                                  {payment.trxID}
                                </code>
                                {payment.note && (
                                  <p className="text-[11px] text-muted-foreground">
                                    {payment.note}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {payment.plan?.name || "Standard"}
                                </span>
                                <span className="text-[11px] text-muted-foreground capitalize">
                                  {payment.plan?.type}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="capitalize text-xs"
                              >
                                {payment.gateway}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatBdt(payment.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="capitalize text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
                              >
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                              {formatDateTime(payment.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden divide-y rounded-lg border">
                    {payments.map((payment) => (
                      <div key={payment.id} className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">
                            {payment.plan?.name || payment.plan?.type}
                          </span>
                          <span className="font-semibold text-sm">
                            {formatBdt(payment.amount)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <code className="font-mono">{payment.trxID}</code>
                          <Badge
                            variant="outline"
                            className="capitalize text-[10px]"
                          >
                            {payment.gateway}
                          </Badge>
                          <span>{formatDateOnly(payment.createdAt)}</span>
                        </div>
                        {payment.note && (
                          <p className="text-xs text-muted-foreground">
                            {payment.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* TAB 3: Plan History */}
            <TabsContent value="history" className="mt-0">
              {appUser.planHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 px-4 text-center">
                  <History className="h-9 w-9 text-muted-foreground/60 mb-2.5" />
                  <p className="text-sm font-medium">No plan change logs yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manual upgrades, purchases, and automatic downgrades will be
                    logged here.
                  </p>
                </div>
              ) : (
                <div className="divide-y rounded-lg border">
                  {appUser.planHistory.map((entry, idx) => (
                    <div
                      key={entry._id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 text-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Badge
                          variant="outline"
                          className="capitalize text-xs shrink-0"
                        >
                          {entry.planType}
                        </Badge>
                        <span className="text-xs sm:text-sm text-foreground truncate">
                          {entry.reason || "Plan updated"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDateTime(entry.changedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 4: Referral Program */}
            <TabsContent value="referral" className="mt-0">
              {!referral.exists ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 px-4 text-center">
                  <Gift className="h-9 w-9 text-muted-foreground/60 mb-2.5" />
                  <p className="text-sm font-medium">
                    Referral profile not initialized
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This user has not opened their referral partner hub yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-lg border p-3.5 space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Referral Code
                      </span>
                      <div className="flex items-center justify-between">
                        <code className="font-mono font-semibold text-base">
                          {referral.referralCode}
                        </code>
                        {referral.referralCode && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              copyToClipboard(
                                referral.referralCode!,
                                "Referral code copied"
                              )
                            }
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border p-3.5 space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Available Balance
                      </span>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {formatBdt(referral.availableBalance)}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        bKash: {referral.withdrawAccount || "Not set"}
                      </p>
                    </div>

                    <div className="rounded-lg border p-3.5 space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Total Earned / Paid
                      </span>
                      <div className="text-lg font-bold">
                        {formatBdt(referral.totalEarned)}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Paid out: {formatBdt(referral.totalWithdrawn)}
                      </p>
                    </div>

                    <div className="rounded-lg border p-3.5 space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Invited &amp; Pending
                      </span>
                      <div className="text-lg font-bold">
                        {referral.referredCount} users
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {referral.pendingWithdrawalsCount} pending (
                        {formatBdt(referral.pendingWithdrawalsAmount)})
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <Link href={`/admin/referral/${user.id}`}>
                        <Wallet className="h-4 w-4" />
                        Open Full Referral Ledger
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Reusable Plan Upgrade Modal */}
      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        user={upgradeTargetUser}
      />

      {/* Add Credits Modal */}
      <Dialog open={addCreditDialogOpen} onOpenChange={setAddCreditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Add Credits
            </DialogTitle>
            <DialogDescription>
              Grant additional processing credits to{" "}
              <span className="font-medium text-foreground">{user.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCredits} className="space-y-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="profile-credit-amount">Credit Amount</Label>
              <Input
                id="profile-credit-amount"
                type="number"
                min="1"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                required
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[50, 100, 500, 1000].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setCreditAmount(String(preset))}
                  >
                    +{preset}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddCreditDialogOpen(false)}
                disabled={addCreditsMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addCreditsMutation.isPending}>
                {addCreditsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Credits"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
