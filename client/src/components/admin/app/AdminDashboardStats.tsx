"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AreaChart } from "@/components/ui/area-chart";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DollarSign,
  Key,
  RefreshCw,
  Users,
  XCircle,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdminOverviewQuery } from "@/services/queries/admin-dashboard";
import { AdminDashboardSkeleton } from "@/components/admin/admin-dashboard-skeleton";

export default function DashboardStats() {
  const { data, isLoading, error, refetch } = useAdminOverviewQuery();

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "h:mm a");
    } catch {
      return "";
    }
  };

  const formatMonthYear = (monthYear: string) => {
    try {
      const [year, month] = monthYear.split("-");
      return format(
        new Date(Number.parseInt(year), Number.parseInt(month) - 1),
        "MMM yyyy"
      );
    } catch {
      return monthYear;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return <AdminDashboardSkeleton showHeader={false} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">Error loading dashboard statistics</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!data?.success || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No data available</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          Dashboard statistics could not be loaded.
        </p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  const stats = data.data;

  // Safe fallback normalization
  const monthlyRevenue =
    (stats.revenue?.monthlyRevenueList || ((stats.revenue as unknown as Record<string, Record<string, number>>)?.monthlyBreakdown) || {}) as Record<string, number>;
  const revenueData = Object.entries(monthlyRevenue).map(([month, value]) => ({
    label: formatMonthYear(month),
    value: value || 0,
  }));

  const monthlyProcesses = stats.appKeys?.monthlyProcessList || {};
  const processData = Object.entries(monthlyProcesses).map(([month, value]) => ({
    label: formatMonthYear(month),
    value: value || 0,
  }));

  const recentPayments =
    stats.payments?.recent || stats.recentPayments || [];

  const topUsage = stats.appKeys?.topUsage || [];
  const topSpenders = stats.payments?.topSpenders || [];
  const topReferrers = stats.topReferrers || [];

  const growthPercentage =
    stats.revenue?.growthPercentage ??
    (stats.revenue?.lastMonth && stats.revenue.lastMonth > 0
      ? ((stats.revenue.currentMonth - stats.revenue.lastMonth) /
          stats.revenue.lastMonth) *
        100
      : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenue?.total)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime revenue</p>
          </CardContent>
        </Card>

        {/* Current Month Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenue?.currentMonth)}
            </div>
            <div className="flex items-center pt-1">
              {growthPercentage > 0 ? (
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
              ) : growthPercentage < 0 ? (
                <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
              ) : null}
              <span
                className={
                  growthPercentage > 0
                    ? "text-xs text-green-500"
                    : growthPercentage < 0
                    ? "text-xs text-red-500"
                    : "text-xs text-muted-foreground"
                }
              >
                {growthPercentage !== 0
                  ? `${Math.abs(growthPercentage).toFixed(2)}% vs last month`
                  : "No change vs last month"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Previous Month Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previous Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenue?.lastMonth)}
            </div>
            <p className="text-xs text-muted-foreground">Last month&apos;s revenue</p>
          </CardContent>
        </Card>

        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.users?.total ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.users?.newThisMonth ?? 0} new this month
            </p>
          </CardContent>
        </Card>

        {/* App Keys / Active Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">APP Users</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.appKeys?.total ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.appKeys?.active ?? 0} active keys
            </p>
          </CardContent>
        </Card>

        {/* Current Premium Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.appKeys?.activePremium ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.appKeys?.subscriptionPlanCount ?? 0} subs,{" "}
              {stats.appKeys?.creditPlanCount ?? 0} credit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue trends</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <AreaChart
              data={revenueData}
              color="#8884d8"
              tooltipLabel="Revenue"
              valueFormatter={formatCurrency}
              yAxisFormatter={(value) => formatCurrency(value)}
            />
          </CardContent>
        </Card>

        {/* Processes Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Image Processing Overview</CardTitle>
            <CardDescription>Processing volume trends</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <AreaChart
              data={processData}
              color="#82ca9d"
              tooltipLabel="Processes"
              valueFormatter={(value) => value.toLocaleString()}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((payment, index) => {
                const userObj = payment.userId || { name: "Unknown", email: "N/A" };
                return (
                  <TableRow key={`${userObj._id || index}-${payment.createdAt}-${index}`}>
                    <TableCell>
                      <div className="flex gap-4 items-center">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${userObj.email || "user"}`}
                            alt={userObj.name || "User"}
                          />
                          <AvatarFallback>
                            {getInitials(userObj.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{userObj.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {userObj.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="capitalize text-sm text-muted-foreground">
                      {typeof payment.plan === "object" && payment.plan !== null ? (payment.plan as { name?: string; type?: string }).name || (payment.plan as { name?: string; type?: string }).type || "Standard" : (typeof payment.plan === "string" ? payment.plan : "Standard")}
                    </TableCell>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>{formatTime(payment.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
              {recentPayments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No recent payments
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Activity Breakdown: Top API Usage, Top Spenders, Top Referrers */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Top API Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Top API Usage</CardTitle>
            <CardDescription>Most active users by processes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsage.map((item, index) => (
                  <TableRow key={`${item._id || index}-${index}`}>
                    <TableCell>
                      <div className="flex gap-3 items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${item.user?.email || "user"}`}
                            alt={item.user?.name || "User"}
                          />
                          <AvatarFallback>
                            {getInitials(item.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate">
                            {item.user?.name || "User"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {item.user?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(item.count || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {topUsage.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No usage data yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Spenders */}
        <Card>
          <CardHeader>
            <CardTitle>Top Spenders</CardTitle>
            <CardDescription>Highest total payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSpenders.map((item, index) => (
                  <TableRow key={`${item._id || index}-${index}`}>
                    <TableCell>
                      <div className="flex gap-3 items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${item.user?.email || "user"}`}
                            alt={item.user?.name || "User"}
                          />
                          <AvatarFallback>
                            {getInitials(item.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate">
                            {item.user?.name || "User"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {item.user?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.totalSpent)}
                    </TableCell>
                  </TableRow>
                ))}
                {topSpenders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No spenders data yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Users with most referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Referrals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topReferrers.map((item, index) => (
                  <TableRow key={`${item._id || index}-${index}`}>
                    <TableCell>
                      <div className="flex gap-3 items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${item.user?.email || "user"}`}
                            alt={item.user?.name || "User"}
                          />
                          <AvatarFallback>
                            {getInitials(item.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate">
                            {item.user?.name || "User"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {item.user?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(item.referredCount || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {topReferrers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No referral data yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
