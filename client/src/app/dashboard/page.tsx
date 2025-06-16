import { getOverview } from "@/services/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  Calendar,
  DollarSign,
  Infinity,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProcessChart } from "@/components/dashboard/process-chart";
import { PaymentsTable } from "@/components/dashboard/payments-table";

export default async function Page() {
  const overview = await getOverview();

  if (!overview.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            Failed to load overview
          </h2>
          <p className="text-muted-foreground">{overview.message}</p>
        </div>
      </div>
    );
  }

  const { data } = overview;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCredit = (credit: number | null) => {
    if (credit === null) {
      return "Unlimited";
    }
    return credit.toLocaleString();
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Monitor your usage, credits, and payment history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Total Processes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Processes
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-1">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalProcess.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time processes</p>
          </CardContent>
        </Card>

        {/* Current Month Processes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <div className="rounded-full bg-primary/10 p-1">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.currentMonthProcess.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Processes this month
            </p>
          </CardContent>
        </Card>

        {/* API Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Credits</CardTitle>
            <div className="rounded-full bg-primary/10 p-1">
              {data.creditRemaining === null ? (
                <Infinity className="h-4 w-4 text-primary" />
              ) : (
                <Zap className="h-4 w-4 text-primary" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCredit(data.creditRemaining)}
            </div>
            <div className="flex items-center pt-1">
              {data.creditRemaining === null ? (
                <Badge variant="secondary" className="text-xs">
                  Unlimited Plan
                </Badge>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Credits remaining
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Web Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Web Credits</CardTitle>
            <div className="rounded-full bg-primary/10 p-1">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.webCreditRemaining.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Web credits left</p>
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <div className="rounded-full bg-primary/10 p-1">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalPaymentSpent)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Process Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Activity</CardTitle>
            <CardDescription>Last 6 months processing volume</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ProcessChart data={data.last6MonthProcess} />
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <PaymentsTable payments={data.last5Payments} />
      </div>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
          <CardDescription>
            Quick overview of your account status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Processing Status
              </span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Active</span>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Plan Type
              </span>
              <span className="text-sm">
                {data.creditRemaining === null ? "Unlimited" : "Limited"}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Last Payment
              </span>
              <span className="text-sm">
                {data.last5Payments.length > 0
                  ? formatCurrency(data.last5Payments[0].amount)
                  : "No payments yet"}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Monthly Usage
              </span>
              <span className="text-sm">
                {data.currentMonthProcess.toLocaleString()} processes
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
