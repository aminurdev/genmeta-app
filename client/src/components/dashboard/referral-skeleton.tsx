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
  ArrowUpRight,
  Copy,
  DollarSign,
  Gift,
  RefreshCw,
  Share2,
  Users,
  Wallet,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ReferralDashboardSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in-50 duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Referral Program
            </h1>
            <Skeleton className="h-5 w-36 rounded-md" />
          </div>
          <p className="text-sm text-muted-foreground">
            Refer friends to GenMeta and earn a referral bonus when they
            subscribe to any package.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* 2. Referral Bonus Rule Callout */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-3.5 w-36" />
      </div>

      {/* 3. Four-Card KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { title: "Available Balance", icon: Wallet },
          { title: "Total Earned", icon: DollarSign },
          { title: "Total Withdrawn", icon: ArrowUpRight },
          { title: "Referred Users", icon: Users },
        ].map(({ title, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3.5 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-lg">Share & Earn</CardTitle>
            <CardDescription>
              Invite creators with your unique referral URL or code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <div className="flex flex-col sm:flex-row gap-2">
                <Skeleton className="h-9 flex-1 rounded-md" />
                <div className="flex gap-2">
                  <Button variant="outline" disabled className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button disabled className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-20 rounded" />
              </div>
              <Skeleton className="h-7 w-24 rounded-md" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-lg">Withdraw Funds</CardTitle>
            <CardDescription>
              Request payout to your bKash Personal account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <Button disabled className="w-full gap-2">
              <Wallet className="h-4 w-4" />
              Request Withdrawal
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 5. Tabbed Activity Table Skeleton */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Referral Activity</CardTitle>
            <CardDescription>
              Track referred signups, bonus credits unlocked by package
              subscriptions, and payouts.
            </CardDescription>
          </div>
          <Skeleton className="h-9 w-full md:w-72 rounded-lg" />
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>User</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Package Status</TableHead>
                  <TableHead className="text-right">Bonus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((row) => (
                  <TableRow key={row}>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-28 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReferralDashboardSkeleton;
