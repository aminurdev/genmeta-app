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
  CreditCard,
  DollarSign,
  Key,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdminOverviewQuery } from "@/services/queries/admin-dashboard";
import Loading from "@/app/admin/loading";

export default function DashboardStats() {
  const { data, isLoading, error, refetch } = useAdminOverviewQuery();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    return format(
      new Date(Number.parseInt(year), Number.parseInt(month) - 1),
      "MMM yyyy"
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">
          Error loading dashboard statistics
        </h3>
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

  const revenueData = Object.entries(stats.revenue.monthlyRevenueList).map(
    ([month, value]) => ({
      label: formatMonthYear(month),
      value,
    })
  );

  const processData = Object.entries(stats.appKeys.monthlyProcessList).map(
    ([month, value]) => ({
      label: formatMonthYear(month),
      value,
    })
  );

  return (
    <div className=" space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="flex gap-4 overflow-x-auto whitespace-nowrap pb-2">
        {/* Total Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenue.total)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime revenue</p>
          </CardContent>
        </Card>

        {/* Monthly Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenue.currentMonth)}
            </div>
            <div className="flex items-center pt-1">
              {stats.revenue.growthPercentage > 0 ? (
                <ArrowUpIcon className="mr-1 h-3 w-3 text-green-500" />
              ) : stats.revenue.growthPercentage < 0 ? (
                <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
              ) : null}
              <span
                className={
                  stats.revenue.growthPercentage > 0
                    ? "text-xs text-green-500"
                    : stats.revenue.growthPercentage < 0
                    ? "text-xs text-red-500"
                    : "text-xs text-muted-foreground"
                }
              >
                {stats.revenue.growthPercentage !== 0
                  ? `${Math.abs(stats.revenue.growthPercentage).toFixed(
                      2
                    )}% from last month`
                  : "No change from last month"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Last Month Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Previous Month
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenue.lastMonth)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last month&apos;s revenue
            </p>
          </CardContent>
        </Card>

        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.users.newThisMonth} new this month
            </p>
          </CardContent>
        </Card>

        {/* APP Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">APP Users</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appKeys.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.appKeys.newThisMonth} new this month
            </p>
          </CardContent>
        </Card>

        {/* Current Premium Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              Current Premium Users
            </CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.appKeys.activePremium}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.appKeys.subscriptionPlanCount} subscription and{" "}
              {stats.appKeys.creditPlanCount} credit
            </p>
          </CardContent>
        </Card>

        {/* Payments Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.payments.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.payments.newThisMonth} new this month
            </p>
          </CardContent>
        </Card>
      </div>

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
              yAxisFormatter={(value) => `$${value}`}
            />
          </CardContent>
        </Card>

        {/* Images Process Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Image Processing Overview</CardTitle>
            <CardDescription>Monthly image processing trends</CardDescription>
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
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.payments.recent.map((payment, index) => (
                <TableRow
                  key={`${payment.userId?._id}-${payment.createdAt}-${index}`}
                >
                  <TableCell>
                    <div className="flex gap-4">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${payment.userId?.email}`}
                          alt={payment.userId?.name}
                        />
                        <AvatarFallback>
                          {getInitials(payment.userId?.name ?? "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {payment.userId?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {payment.userId?.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>{formatDate(payment.createdAt)}</TableCell>
                  <TableCell>{formatTime(payment.createdAt)}</TableCell>
                </TableRow>
              ))}
              {stats.payments.recent.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
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
    </div>
  );
}
