"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Overview } from "@/components/admin/overview";
import { RecentSales } from "@/components/admin/recent-sales";
import { Search } from "@/components/admin/search";
import { TokenUsage } from "@/components/admin/token-usage";
import {
  UsersIcon,
  ImageIcon,
  Coins,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useDashboardAnalytics } from "@/hooks/use-dashboard-analytics";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data, loading, error } = useDashboardAnalytics();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500">
            Error Loading Dashboard
          </h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const metrics = data?.keyMetrics;
  if (!metrics) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center gap-2">
            <Search />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UsersIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {metrics.totalUsers.count.toLocaleString()}
                  </div>
                  {metrics.totalUsers.growth !== null && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      {metrics.totalUsers.growth >= 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                      )}
                      <span
                        className={
                          metrics.totalUsers.growth >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {metrics.totalUsers.growth >= 0 ? "+" : ""}
                        {metrics.totalUsers.growth}%
                      </span>{" "}
                      from last month
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Images Processed
              </CardTitle>
              <ImageIcon className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {metrics.imagesProcessed.count.toLocaleString()}
                  </div>
                  {metrics.imagesProcessed.growth !== null && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      {metrics.imagesProcessed.growth >= 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                      )}
                      <span
                        className={
                          metrics.imagesProcessed.growth >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {metrics.imagesProcessed.growth >= 0 ? "+" : ""}
                        {metrics.imagesProcessed.growth}%
                      </span>{" "}
                      from last month
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tokens Purchased
              </CardTitle>
              <Coins className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {metrics.tokensPurchased.count.toLocaleString()}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {metrics.tokensPurchased.growth >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={
                        metrics.tokensPurchased.growth >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {metrics.tokensPurchased.growth >= 0 ? "+" : ""}
                      {metrics.tokensPurchased.growth}%
                    </span>{" "}
                    from last month
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ৳{metrics.totalRevenue.amount.toLocaleString()}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {metrics.totalRevenue.growth >= 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={
                        metrics.totalRevenue.growth >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {metrics.totalRevenue.growth >= 0 ? "+" : ""}
                      {metrics.totalRevenue.growth}%
                    </span>{" "}
                    from last month
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>
                Revenue trends over the past 6 months
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {loading ? (
                <Skeleton className="h-[350px]" />
              ) : (
                <Overview data={data?.monthlyData || []} />
              )}
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payment activities</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[350px]" />
              ) : (
                <RecentSales transactions={data?.recentTransactions || []} />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Token Usage & Purchases</CardTitle>
            <CardDescription>Monthly token activity comparison</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {loading ? (
              <Skeleton className="h-[350px]" />
            ) : (
              <TokenUsage data={data?.monthlyData || []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
