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
  Infinity,
  TrendingUp,
  Zap,
  Shield,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessChart } from "@/components/dashboard/process-chart";
import { PaymentsTable } from "@/components/dashboard/payments-table";

interface Props {
  searchParams: Promise<{ status?: string; amount?: number; trxID?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { amount, status, trxID } = await searchParams;

  console.log(amount, status, trxID);

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
      currency: "BDT",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCredit = (credit: number | null) => {
    if (credit === null) {
      return <Infinity className="h-6 w-6 text-primary" />;
    }
    return credit.toLocaleString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = () => {
    if (data.appKey.isSuspended || data.appKey.isManuallyDisabled)
      return "destructive";
    if (data.appKey.daysLeft !== null && data.appKey.daysLeft <= 7)
      return "secondary";
    return "default";
  };

  const getStatusText = () => {
    if (data.appKey.isSuspended) return "Suspended";
    if (data.appKey.isManuallyDisabled) return "Disabled";
    return "Active";
  };

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6 pt-0 w-full">
      {/* Header with User Info */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Overview
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor your usage, credits, and payment history
          </p>
        </div>
        <Card className="w-full sm:w-fit border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-primary/10">
              <AvatarImage
                src={`https://avatar.vercel.sh/${data.user.email}`}
                alt={data.user.name}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(data.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base truncate">
                  {data.user.name}
                </span>
                {data.user.isVerified && (
                  <Shield className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                )}
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground truncate">
                {data.user.email}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Total Processes */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Processes
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-1.5 sm:p-2">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              {data.appKey.totalProcess.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time processes
            </p>
          </CardContent>
        </Card>

        {/* Today Usage */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Today
            </CardTitle>
            <div className="rounded-full bg-emerald-500/10 p-1.5 sm:p-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              {data.appKey.todayUsage.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Processes today
            </p>
          </CardContent>
        </Card>

        {/* This Month Usage */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <div className="rounded-full bg-violet-500/10 p-1.5 sm:p-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              {data.appKey.thisMonthUsage.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly processes
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              App Credits
            </CardTitle>
            <div className="rounded-full bg-amber-500/10 p-1.5 sm:p-2">
              {data.appKey.creditRemaining === null ? (
                <Infinity className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
              ) : (
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              {formatCredit(data.appKey.creditRemaining)}
            </div>
            <div className="flex items-center pt-1">
              {data.appKey.creditRemaining === null ? (
                <p className="text-xs text-muted-foreground">
                  Subscription Plan (Unlimited)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Credits remaining
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
            <div className="rounded-full bg-rose-500/10 p-1.5 sm:p-2">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              {formatCurrency(data.payments.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="monthly" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              Analytics Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              Track your processing activity and payments
            </p>
          </div>
          <TabsList className="grid w-full sm:w-auto grid-cols-2 bg-muted/50">
            <TabsTrigger value="monthly" className="text-xs sm:text-sm">
              Monthly View
            </TabsTrigger>
            <TabsTrigger value="daily" className="text-xs sm:text-sm">
              Daily View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
            {/* Monthly Process Chart */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-semibold">
                  Monthly Processing Activity
                </CardTitle>
                <CardDescription className="text-sm">
                  Last 6 months processing volume
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] sm:h-[300px] lg:h-[350px]">
                <ProcessChart
                  data={data.appKey.last6MonthProcess}
                  type="monthly"
                />
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <div className="xl:min-h-0">
              <PaymentsTable
                payments={data.payments.last5Payments}
                totalSpent={data.payments.totalSpent}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
            {/* Daily Process Chart */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-semibold">
                  Daily Processing Activity
                </CardTitle>
                <CardDescription className="text-sm">
                  Last 7 days processing volume
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] sm:h-[300px] lg:h-[350px]">
                <ProcessChart
                  data={data.appKey.last7DaysProcess}
                  type="daily"
                />
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <div className="xl:min-h-0">
              <PaymentsTable
                payments={data.payments.last5Payments}
                totalSpent={data.payments.totalSpent}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Details */}
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
            Account Information
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and account details
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Plan Information */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                Plan Details
                <Badge variant={getStatusColor()} className="text-xs">
                  {getStatusText()}
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm">
                Your current subscription information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Plan Type
                </span>
                <Badge variant="secondary" className="capitalize w-fit">
                  {data.appKey.planType}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Expires At
                </span>
                <span className="text-sm font-medium">
                  {data.appKey.planType === "subscription"
                    ? data.appKey.expiresAt
                      ? formatDate(data.appKey.expiresAt)
                      : "N/A"
                    : "N/A"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Days Remaining
                </span>
                <div className="flex items-center gap-2">
                  {data.appKey.daysLeft !== null &&
                    data.appKey.daysLeft <= 7 &&
                    data.appKey.planType === "subscription" && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  <span className="text-sm font-medium">
                    {data.appKey.daysLeft ?? 365} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold">
                Account Summary
              </CardTitle>
              <CardDescription className="text-sm">
                Quick overview of your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Spent
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(data.payments.totalSpent)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Login Methods
                </span>
                <div className="flex flex-wrap gap-1">
                  {data.user.loginProvider.map((provider: string) => (
                    <Badge
                      key={provider}
                      variant="outline"
                      className="text-xs capitalize"
                    >
                      {provider}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Account Verified
                </span>
                <div className="flex items-center gap-1">
                  {data.user.isVerified ? (
                    <>
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-emerald-600 font-medium">
                        Verified
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-amber-600 font-medium">
                      Unverified
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Last Payment
                </span>
                <span className="text-sm font-medium">
                  {data.payments.last5Payments.length > 0
                    ? formatCurrency(data.payments.last5Payments[0].amount)
                    : "No payments yet"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
