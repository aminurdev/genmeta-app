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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Key,
  RefreshCw,
  Users,
  Activity,
  ArrowUpIcon,
} from "lucide-react";

interface AdminDashboardSkeletonProps {
  showHeader?: boolean;
}

export function AdminDashboardSkeleton({ showHeader = true }: AdminDashboardSkeletonProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* 1. Header Bar - Static labels & real button */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor platform statistics, user activity, and system performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* 2. 6 Summary Cards - Real titles & icons, only dynamic numbers skeletonized */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Revenue */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <Skeleton className="h-8 w-24" />
            <p className="text-xs text-muted-foreground">Lifetime revenue</p>
          </CardContent>
        </Card>

        {/* Current Month */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <Skeleton className="h-8 w-20" />
            <div className="flex items-center pt-0.5">
              <ArrowUpIcon className="mr-1 h-3 w-3 text-muted-foreground/40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>

        {/* Previous Month */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previous Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <Skeleton className="h-8 w-20" />
            <p className="text-xs text-muted-foreground">Last month&apos;s revenue</p>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <Skeleton className="h-8 w-16" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>+</span>
              <Skeleton className="h-3 w-8" />
              <span>new this month</span>
            </div>
          </CardContent>
        </Card>

        {/* APP Users */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">APP Users</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <Skeleton className="h-8 w-16" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Skeleton className="h-3 w-8" />
              <span>active keys</span>
            </div>
          </CardContent>
        </Card>

        {/* Premium Users */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <Skeleton className="h-8 w-16" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Skeleton className="h-3 w-10" />
              <span>subs, active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 2 Area Charts - Static titles & axes, animated SVG wave skeleton */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue trends</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-end pt-2 pb-4">
            <div className="w-full h-[220px] relative flex items-end">
              <svg className="w-full h-full opacity-20 text-primary" viewBox="0 0 500 200" preserveAspectRatio="none">
                <path
                  d="M0,150 Q70,90 140,110 T280,60 T420,95 T500,40 L500,200 L0,200 Z"
                  fill="currentColor"
                />
                <path
                  d="M0,150 Q70,90 140,110 T280,60 T420,95 T500,40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
            </div>
            <div className="flex justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
              {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m, idx) => (
                <span key={idx}>{m}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Processing Chart */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Image Processing Overview</CardTitle>
            <CardDescription>Processing volume trends</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-end pt-2 pb-4">
            <div className="w-full h-[220px] relative flex items-end">
              <svg className="w-full h-full opacity-20 text-emerald-500" viewBox="0 0 500 200" preserveAspectRatio="none">
                <path
                  d="M0,130 Q80,160 160,80 T320,120 T440,50 T500,70 L500,200 L0,200 Z"
                  fill="currentColor"
                />
                <path
                  d="M0,130 Q80,160 160,80 T320,120 T440,50 T500,70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
            </div>
            <div className="flex justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
              {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m, idx) => (
                <span key={idx}>{m}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Recent Payments Table - Static headers, dynamic rows */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <TableRow key={row}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-28 sm:w-36" />
                          <Skeleton className="h-3 w-36 sm:w-48 font-mono" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-16" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 5. 3-Column Activity Breakdown - Static headers, dynamic rows */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {[
          { title: "Top API Usage", desc: "Most active users by processes", colHeader: "Count" },
          { title: "Top Spenders", desc: "Highest contributing accounts", colHeader: "Total Spent" },
          { title: "Top Referrers", desc: "Leading referral affiliates", colHeader: "Earnings" },
        ].map((section, idx) => (
          <Card key={idx} className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription className="text-xs">{section.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">{section.colHeader}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3, 4].map((item) => (
                      <TableRow key={item}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                            <div className="space-y-1">
                              <Skeleton className="h-3.5 w-24" />
                              <Skeleton className="h-2.5 w-32 font-mono" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Skeleton className="h-4 w-12" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboardSkeleton;
