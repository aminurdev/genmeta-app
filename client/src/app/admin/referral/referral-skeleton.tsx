import React from "react";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReferralTableSkeletonProps {
  rows?: number;
}

export function ReferralTableSkeleton({ rows = 10 }: ReferralTableSkeletonProps) {
  return (
    <>
      <div className="hidden md:block rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Referrer</TableHead>
              <TableHead>Referral Code</TableHead>
              <TableHead className="text-right">Referrals</TableHead>
              <TableHead className="text-right">Total Earned</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">Pending Payouts</TableHead>
              <TableHead>Payout Account</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24 rounded-md" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <Skeleton className="h-5 w-10 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-20 rounded-full ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-28 rounded-md" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Skeleton className="h-8 w-20 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden divide-y rounded-lg border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-12 rounded-md" />
              <Skeleton className="h-12 rounded-md" />
              <Skeleton className="h-12 rounded-md" />
              <Skeleton className="h-12 rounded-md" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 w-9 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ReferralSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Referral Management
            </h1>
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor affiliate performance, wallet balances, and payout requests.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled className="gap-2 self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Referrers", icon: Users },
          { label: "Total Earned", icon: TrendingUp },
          { label: "Available Balance", icon: Wallet },
          { label: "Pending Withdrawals", icon: Clock },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3.5 w-36" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Directory Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Referrer Directory
          </CardTitle>
          <CardDescription>
            Review referral performance and process payout requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <Skeleton className="h-9 flex-1" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>

          <ReferralTableSkeleton rows={rows} />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-1.5">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReferralDetailSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" disabled className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3.5 w-64" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Hero Card */}
      <Card>
        <CardContent className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-56" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-28 rounded-md" />
                <Skeleton className="h-6 w-32 rounded-md" />
              </div>
            </div>
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
        </CardContent>
      </Card>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Available Balance", icon: Wallet },
          { label: "Total Earned", icon: TrendingUp },
          { label: "Pending Payouts", icon: Clock },
          { label: "Total Paid Out", icon: DollarSign },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3.5 w-32" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-full max-w-lg rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
