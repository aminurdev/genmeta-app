import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Key,
  Copy,
  Sparkles,
  Download,
  RefreshCw,
  Zap,
  TrendingUp,
  Layers,
  Laptop,
  CheckCircle2,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";

export function UserDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* 1. Header Banner - Static text with dynamic user & plan skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>Welcome back,</span>
              <Skeleton className="h-7 w-28 rounded-md" />
            </h1>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your AI processing quota, view your desktop App ID, and track daily activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" disabled className="gap-2">
            <Sparkles className="h-4 w-4" />
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* 2. App Key Strip - Static labels, only dynamic key is skeleton */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Desktop App ID</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Skeleton className="h-7 w-56 sm:w-64 rounded font-mono" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs font-medium">
              <Copy className="h-3.5 w-3.5" />
              Copy App ID
            </Button>
            <Button variant="secondary" size="sm" disabled className="gap-1.5 text-xs font-medium">
              <Download className="h-3.5 w-3.5" />
              Download App
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Four Core Metric Cards - Static titles & icons, dynamic values skeletonized */}
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
            <Skeleton className="h-8 w-24 mb-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <Skeleton className="h-3.5 w-28" />
              <span className="text-primary inline-flex items-center gap-0.5 font-medium">
                Manage <ArrowUpRight className="h-3 w-3" />
              </span>
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
            <Skeleton className="h-8 w-20 mb-2" />
            <p className="text-xs text-muted-foreground">Pay-as-you-go balance</p>
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
            <Skeleton className="h-8 w-16 mb-2" />
            <p className="text-xs text-muted-foreground">Files processed today</p>
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
            <Skeleton className="h-8 w-24 mb-2" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Skeleton className="h-3.5 w-10 inline-block" />
              <span>processed this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Analytics & Activity Grid - Static titles, only dynamic chart & badges are skeletons */}
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
              <Button variant="default" size="sm" className="h-7 px-2.5 text-xs rounded-md pointer-events-none">
                7 Days
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs rounded-md pointer-events-none">
                6 Months
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full pt-4 flex flex-col justify-end space-y-4">
              <div className="h-[220px] w-full flex items-end justify-between gap-2 px-2 sm:px-4 border-b border-border/40 pb-2">
                {[45, 75, 55, 90, 60, 85, 70].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <Skeleton
                      className="w-full max-w-[42px] rounded-t-md opacity-80"
                      style={{ height: `${h}%` }}
                    />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
              <div className="flex justify-between px-2 pt-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
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
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Account Status</span>
                </div>
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Invested</span>
                </div>
                <Skeleton className="h-5 w-24 rounded" />
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0 space-y-2">
            <Button variant="outline" disabled className="w-full justify-between text-xs font-medium">
              <span>View Account Profile</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" disabled className="w-full justify-between text-xs text-muted-foreground">
              <span>Referral Partner Hub</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* 5. Recent Activity Ledger */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
          <CardDescription>Your latest plan upgrades and credit renewals.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="p-3 bg-muted/50 border-b flex justify-between gap-4 text-xs font-medium text-muted-foreground uppercase">
              <span className="w-24">Plan</span>
              <span className="w-24">Amount</span>
              <span className="w-36 hidden sm:inline">Transaction ID</span>
              <span className="w-24 hidden md:inline">Date</span>
              <span className="w-16">Status</span>
            </div>
            <div className="divide-y divide-border/60">
              {[1, 2, 3].map((row) => (
                <div key={row} className="p-3.5 flex justify-between items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3.5 w-36 hidden sm:block font-mono" />
                  <Skeleton className="h-3.5 w-24 hidden md:block" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserDashboardSkeleton;
