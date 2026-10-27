"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useOverviewQuery } from "@/services/queries/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
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
} from "lucide-react";
import { toast } from "sonner";
import { ProcessChart } from "@/components/dashboard/process-chart";

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* App Key Strip Skeleton */}
      <Skeleton className="h-20 w-full rounded-xl" />

      {/* 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>

      {/* Chart & Summary Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export default function Overview() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chartView, setChartView] = useState<"7days" | "monthly">("7days");

  const {
    data: overviewRes,
    isLoading,
    isRefetching,
    refetch,
    isError,
    error,
  } = useOverviewQuery();

  const handleCopyKey = (key: string) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopied(true);
    toast.success("API Key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success("Dashboard data refreshed");
  };

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  if (isError || !overviewRes?.success || !overviewRes.data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[350px] rounded-xl border border-dashed border-destructive/40 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold text-foreground">Failed to load overview data</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {overviewRes?.message || (error as Error)?.message || "An unexpected error occurred while fetching your dashboard."}
        </p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const data = overviewRes.data;

  // Normalized data extraction
  const user = data.user || { name: "Creator", email: "" };
  const plan = data.plan || { type: data.appKey?.planType || "free", name: "Free Tier" };
  const credit = data.credit ?? data.appKey?.creditRemaining ?? 0;
  const remainingDays = data.remainingDays ?? data.appKey?.daysLeft ?? null;
  const appKeyString = data.appKey?.key || "";
  const totalProcess = data.totalProcess ?? data.appKey?.totalProcess ?? 0;
  const todayProcess = data.todayProcess ?? data.appKey?.todayUsage ?? 0;
  const thisMonthProcess = data.currentMonthProcess ?? data.appKey?.thisMonthUsage ?? 0;

  const last7DaysProcess = data.last7DaysProcess || data.appKey?.last7DaysProcess || [];
  const last6MonthProcess = data.last6MonthProcess || data.appKey?.last6MonthProcess || [];
  const recentHistory = data.recentHistory || [];

  const isSubscription = plan.type === "subscription";

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
            Manage your AI processing quota, copy your desktop app key, and track daily activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button asChild size="sm" className="gap-2">
            <Link href="/pricing">
              <Sparkles className="h-4 w-4" />
              Upgrade Plan
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. App Key Integration Strip */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Desktop App API Key</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-xs font-mono px-2 py-1 bg-muted rounded border text-foreground select-all">
                  {appKeyString
                    ? showKey
                      ? appKeyString
                      : `${appKeyString.slice(0, 8)}••••••••••••••••${appKeyString.slice(-6)}`
                    : "No App Key Generated"}
                </code>
                {appKeyString && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? "Hide key" : "Show full key"}
                  >
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {appKeyString && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyKey(appKeyString)}
                className="gap-1.5 text-xs font-medium"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Key
                  </>
                )}
              </Button>
            )}

            <Button asChild variant="secondary" size="sm" className="gap-1.5 text-xs font-medium">
              <Link href="/download">
                <Download className="h-3.5 w-3.5" />
                Download App
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Four Core Metric Cards */}
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
              <Link href="/pricing" className="text-primary hover:underline font-medium inline-flex items-center gap-0.5">
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
              {isSubscription ? (
                <span className="flex items-center gap-1.5 text-foreground">
                  <InfinityIcon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-normal text-muted-foreground">Unlimited</span>
                </span>
              ) : (
                credit.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isSubscription ? "Full subscription access" : "Pay-as-you-go balance"}
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

      {/* 4. Analytics & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Process Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold">Processing Activity</CardTitle>
              <CardDescription>
                Files processed with AI metadata generation.
              </CardDescription>
            </div>
            <div className="flex items-center rounded-lg border bg-muted p-0.5">
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
            <div className="pt-2">
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
              <CardTitle className="text-base font-semibold">Account Quota</CardTitle>
              <CardDescription>Device and subscription limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2.5">
                  <Laptop className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Authorized Devices</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  1 / 1 Device
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Account Status</span>
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/20 bg-emerald-500/10 text-xs">
                  Verified
                </Badge>
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
            <Button asChild variant="outline" className="w-full justify-between text-xs font-medium">
              <Link href="/dashboard/profile">
                <span>View Account Profile</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-between text-xs text-muted-foreground">
              <Link href="/dashboard/referral">
                <span>Referral Partner Hub</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* 5. Recent Activity Ledger */}
      {recentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
            <CardDescription>Your latest plan upgrades and credit renewals.</CardDescription>
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
                      <tr key={item._id} className="hover:bg-muted/40 transition-colors">
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
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-3 text-right">
                          <Badge
                            variant={item.status === "completed" ? "default" : "secondary"}
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
    </div>
  );
}
