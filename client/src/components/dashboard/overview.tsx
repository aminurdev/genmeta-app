"use client";

import React from "react";
import { useOverviewQuery } from "@/services/queries/dashboard";
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
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessChart } from "@/components/dashboard/process-chart";
import { PaymentsTable } from "@/components/dashboard/payments-table";
import Loading from "@/app/dashboard/loading";

const Overview = () => {
  const { data: overview, isLoading, isError, error } = useOverviewQuery();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatCredit = (credit: number | null | undefined, planType: string) => {
    if (planType === "subscription") {
      return (
        <span className="flex items-center gap-1 text-primary">
          <Infinity className="h-5 w-5" />
          <span className="text-xs font-normal text-muted-foreground ml-1">(Subscription)</span>
        </span>
      );
    }
    return (credit ?? 0).toLocaleString();
  };

  const getInitials = (name?: string) => {
    if (!name) return "GM";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading state
  if (isLoading) {
    return <Loading />;
  }

  // Error state
  if (isError || !overview?.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 min-h-[300px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            Failed to load overview
          </h2>
          <p className="text-muted-foreground">
            {overview?.message ||
              (error as Error)?.message ||
              "An error occurred loading dashboard data"}
          </p>
        </div>
      </div>
    );
  }

  const data = overview.data;

  if (!data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 min-h-[300px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            No data available
          </h2>
          <p className="text-muted-foreground">Unable to load dashboard data</p>
        </div>
      </div>
    );
  }

  // Extract normalized data supporting both modern and legacy server payload structures
  const user = data.user || { name: "User", email: "", isVerified: false };
  const planType = data.plan?.type || data.appKey?.planType || "free";
  const planName = data.plan?.name || (planType === "subscription" ? "Pro Plan" : planType === "credit" ? "Credit Pack" : "Free Plan");
  const totalProcess = data.totalProcess ?? data.appKey?.totalProcess ?? 0;
  const thisMonthUsage = data.currentMonthProcess ?? data.appKey?.thisMonthUsage ?? 0;
  const todayUsage = data.todayProcess ?? data.appKey?.todayUsage ?? 0;
  const credit = data.credit ?? data.appKey?.creditRemaining ?? 0;
  const daysLeft = data.remainingDays ?? data.appKey?.daysLeft ?? null;
  const totalSpent = data.totalSpent ?? data.payments?.totalSpent ?? 0;
  const isSuspended = data.appKey?.isSuspended ?? false;
  const isManuallyDisabled = data.appKey?.isManuallyDisabled ?? false;
  const expiresAt = data.appKey?.expiresAt ?? null;

  const rawLast6Month = data.last6MonthProcess ?? data.appKey?.last6MonthProcess ?? [];
  const rawLast7Days = data.last7DaysProcess ?? data.appKey?.last7DaysProcess ?? [];

  const last6MonthProcess = rawLast6Month.map((item) => ({
    month: item.month,
    count: item.count || 0,
  }));

  const last7DaysProcess = rawLast7Days.map((item) => ({
    day: item.day || item.date || "",
    count: item.count || 0,
  }));

  const payments =
    data.recentHistory?.map((p) => ({
      id: p._id,
      trxID: p.trxID,
      plan: {
        id: p.plan.id || "",
        type: p.plan.type || "plan",
      },
      amount: p.amount,
      createdAt: p.createdAt,
    })) ||
    data.payments?.last5Payments ||
    [];

  const loginProviders = Array.isArray(user.loginProvider) && user.loginProvider.length > 0
    ? user.loginProvider
    : ["email"];

  const getStatusColor = () => {
    if (isSuspended || isManuallyDisabled) return "destructive";
    if (daysLeft !== null && daysLeft <= 7) return "secondary";
    return "default";
  };

  const getStatusText = () => {
    if (isSuspended) return "Suspended";
    if (isManuallyDisabled) return "Disabled";
    return "Active";
  };

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6 pt-0 w-full max-w-7xl mx-auto">
      {/* Header with User Info */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Overview
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor your API usage, credits, subscription, and payments
          </p>
        </div>
        <Card className="w-full sm:w-fit border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-primary/10">
              <AvatarImage
                src={user.avatar || `https://avatar.vercel.sh/${user.email || "user"}`}
                alt={user.name || "User"}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base truncate">
                  {user.name || "GenMeta User"}
                </span>
                {user.isVerified && (
                  <Shield className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                )}
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground truncate">
                {user.email}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total generates */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Generates
            </CardTitle>
            <div className="rounded-full bg-blue-500/10 p-1.5 sm:p-2">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              {totalProcess.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time generations
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
              {thisMonthUsage.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly volume
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
              {todayUsage.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Processed today</p>
          </CardContent>
        </Card>

        {/* App Credits */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              App Credits
            </CardTitle>
            <div className="rounded-full bg-amber-500/10 p-1.5 sm:p-2">
              {planType === "subscription" ? (
                <Infinity className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
              ) : (
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              {formatCredit(credit, planType)}
            </div>
            <div className="flex items-center pt-1">
              {planType === "subscription" ? (
                <p className="text-xs text-muted-foreground">Unlimited active plan</p>
              ) : (
                <p className="text-xs text-muted-foreground">Credits available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Days Remaining */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Days Remaining
            </CardTitle>
            <div className="rounded-full bg-indigo-500/10 p-1.5 sm:p-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              {daysLeft !== null ? daysLeft : "Lifetime"}
            </div>
            <div className="flex items-center pt-1">
              <p className="text-xs text-muted-foreground">
                {daysLeft !== null ? "Until plan expires" : "No expiration"}
              </p>
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
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime purchases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Recent Activity */}
      <Tabs defaultValue="monthly" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              Analytics Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              Track your generation activity and recent transactions
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
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-semibold">
                  Monthly Processing Activity
                </CardTitle>
                <CardDescription className="text-sm">
                  Volume over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] sm:h-[300px] lg:h-[350px]">
                <ProcessChart data={last6MonthProcess} type="monthly" />
              </CardContent>
            </Card>

            <div className="xl:min-h-0">
              <PaymentsTable payments={payments} totalSpent={totalSpent} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-semibold">
                  Daily Processing Activity
                </CardTitle>
                <CardDescription className="text-sm">
                  Volume over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] sm:h-[300px] lg:h-[350px]">
                <ProcessChart data={last7DaysProcess} type="daily" />
              </CardContent>
            </Card>

            <div className="xl:min-h-0">
              <PaymentsTable payments={payments} totalSpent={totalSpent} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Account & Plan Details */}
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
            Account Information
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your subscription tier and account status
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
                Your current active subscription package
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Plan Tier
                </span>
                <Badge variant="secondary" className="capitalize w-fit">
                  {planName}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Expires At
                </span>
                <span className="text-sm font-medium">
                  {expiresAt ? formatDate(expiresAt) : "No Expiration Date"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Days Remaining
                </span>
                <div className="flex items-center gap-2">
                  {daysLeft !== null && daysLeft <= 7 && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm font-medium">
                    {daysLeft !== null ? `${daysLeft} days` : "Unlimited"}
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
                Security and verification details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Spent
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Login Methods
                </span>
                <div className="flex flex-wrap gap-1">
                  {loginProviders.map((provider: string) => (
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
                  {user.isVerified ? (
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
                  Latest Transaction
                </span>
                <span className="text-sm font-medium">
                  {payments.length > 0
                    ? formatCurrency(payments[0].amount)
                    : "No transactions yet"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Overview;
