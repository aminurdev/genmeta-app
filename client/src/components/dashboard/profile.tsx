"use client";

import React from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/services/constants";
import { useProfileQuery } from "@/services/queries/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Gift,
  Infinity as InfinityIcon,
  Laptop,
  Layers,
  Mail,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  User as UserIcon,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PasswordChangeForm } from "@/components/dashboard/password-change-form";
import { ProfileSkeleton } from "@/components/dashboard/profile-skeleton";
import { ActiveSessions } from "@/components/dashboard/active-sessions";

function getInitials(name?: string): string {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString?: string | null, fallback = "N/A"): string {
  if (!dateString) return fallback;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return fallback;
  return format(date, "MMM d, yyyy");
}

function formatRelativeDate(
  dateString?: string | null,
  fallback = "N/A"
): string {
  if (!dateString) return fallback;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return fallback;
  return formatDistanceToNow(date, { addSuffix: true });
}

export default function Profile() {
  const queryClient = useQueryClient();
  const {
    data: profileRes,
    isLoading,
    isRefetching,
    refetch,
    isError,
    error,
  } = useProfileQuery();

  const handleRefresh = async () => {
    const [profileResult] = await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeSessions }),
    ]);

    if (profileResult.isError || !profileResult.data?.success) {
      toast.error(
        (profileResult.data && !profileResult.data.success
          ? profileResult.data.message
          : null) ||
          (profileResult.error as Error)?.message ||
          "Failed to refresh profile"
      );
      return;
    }

    toast.success("Profile refreshed");
  };

  const handlePasswordUpdated = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeSessions });
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError || !profileRes?.success || !profileRes.data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[350px] rounded-xl border border-dashed border-destructive/40 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold text-foreground">
          Failed to load profile
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {profileRes?.message ||
            (error as Error)?.message ||
            "An unexpected error occurred while loading your profile."}
        </p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const { user, appUser, security } = profileRes.data;
  const planName = appUser?.plan?.name || "Free Tier";
  const planType = appUser?.plan?.type || "free";
  const isSubscription = planType === "subscription";
  const credit = appUser?.credit ?? 0;
  const isAccountRestricted = Boolean(
    user.isDisabled || appUser?.isSuspended || (appUser && !appUser.isActive)
  );

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Account Profile
            </h1>
            <Badge variant="outline" className="capitalize text-xs font-medium">
              {user.role || "user"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your personal information, subscription quota, active
            sessions, and security.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href="/pricing">
              <Sparkles className="h-4 w-4" />
              Manage Plan
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Full-Width Identity Hero Card */}
      <Card>
        <CardContent className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
            <Avatar className="h-16 w-16 border border-border shrink-0">
              <AvatarImage
                src={
                  user.avatar ||
                  `https://avatar.vercel.sh/${encodeURIComponent(user.email || "user")}`
                }
                alt={user.name || "User"}
              />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight truncate">
                  {user.name || "GenMeta User"}
                </h2>
                {user.isVerified ? (
                  <Badge
                    variant="outline"
                    className="gap-1 text-emerald-600 border-emerald-500/25 bg-emerald-500/10 text-xs"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 text-amber-600 border-amber-500/25 bg-amber-500/10 text-xs"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Unverified
                  </Badge>
                )}
                {user.isDisabled ? (
                  <Badge variant="destructive" className="text-xs">
                    Disabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground break-all">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span>{user.email}</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {user.loginProvider.map((provider) => (
                  <Badge
                    key={provider}
                    variant="outline"
                    className="text-[11px] capitalize"
                  >
                    {provider === "google" ? "Google Sign-In" : "Email Login"}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 shrink-0">
            <div className="rounded-lg border bg-muted/30 px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Member Since
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">
                {formatDate(user.createdAt)}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3 w-3" />
                Last Sign-In
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">
                {formatRelativeDate(security.lastLoginAt || user.lastLoginAt)}
              </p>
            </div>

            {user.referredBy && (
              <div className="rounded-lg border bg-muted/30 px-3.5 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Gift className="h-3 w-3" />
                  Referred By
                </div>
                <p className="mt-1 text-sm font-mono font-medium text-foreground">
                  {user.referredBy}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Four-Card Responsive Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Current Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Current Plan
            </CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{planName}</div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>
                {appUser?.remainingDays !== null &&
                appUser?.remainingDays !== undefined
                  ? `${appUser.remainingDays} days remaining`
                  : isSubscription
                    ? "Active subscription"
                    : "Permanent quota"}
              </span>
              <Link
                href="/pricing"
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                Upgrade <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Available Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Available Credits
            </CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1.5">
              {isSubscription || credit === null ? (
                <span className="flex items-center gap-1.5 text-foreground">
                  <InfinityIcon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-normal text-muted-foreground">
                    Unlimited
                  </span>
                </span>
              ) : (
                credit.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isSubscription
                ? "Full subscription access"
                : planType === "free"
                  ? "Daily free quota"
                  : "Pay-as-you-go balance"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Total Generates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Generates
            </CardTitle>
            <Layers className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(appUser?.totalProcess ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>Desktop license</span>
              {appUser?.isSuspended || (appUser && !appUser.isActive) ? (
                <Badge
                  variant="destructive"
                  className="text-[11px] capitalize"
                >
                  {appUser.isSuspended ? "Suspended" : "Inactive"}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-emerald-600 border-emerald-500/25 bg-emerald-500/10 text-[11px] capitalize"
                >
                  {appUser?.status || "active"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Devices & Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Devices & Sessions
            </CardTitle>
            <Laptop className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {appUser?.devicesCount ?? 0} / {appUser?.maxDevices ?? 2}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>{security.activeSessionsCount} active web sessions</span>
              <Link
                href="/dashboard"
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                Devices <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Full-Width 12-Column Responsive Details + Security Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="xl:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <UserIcon className="h-4 w-4 text-primary" />
                Account & Plan Details
              </CardTitle>
              <CardDescription>
                Summary of your web account and desktop license state.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Email Address</span>
                <span className="font-medium text-right break-all">
                  {user.email}
                </span>
              </div>
              <Separator />

              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Account Role</span>
                <Badge variant="outline" className="capitalize">
                  {user.role || "user"}
                </Badge>
              </div>
              <Separator />

              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Login Methods</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {user.loginProvider.map((provider) => (
                    <Badge
                      key={provider}
                      variant="secondary"
                      className="text-xs capitalize"
                    >
                      {provider}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />

              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Account Status</span>
                <div className="flex items-center gap-1.5">
                  {isAccountRestricted ? (
                    <>
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                      <Badge variant="destructive">
                        {user.isDisabled
                          ? "Disabled"
                          : appUser?.isSuspended
                            ? "Suspended"
                            : "Inactive"}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <Badge
                        variant="outline"
                        className="text-emerald-600 border-emerald-500/25 bg-emerald-500/10"
                      >
                        Active
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              <Separator />

              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Plan Expiration</span>
                <span className="font-medium">
                  {appUser?.expiresAt
                    ? formatDate(appUser.expiresAt)
                    : "No expiration"}
                </span>
              </div>
              <Separator />

              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Desktop Devices</span>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  <span>
                    {appUser?.devicesCount ?? 0} / {appUser?.maxDevices ?? 2}{" "}
                    connected
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <PasswordChangeForm
            hasPassword={security.hasPassword}
            passwordChangedAt={security.passwordChangedAt}
            onPasswordUpdated={handlePasswordUpdated}
          />
        </div>

        {/* Right Column */}
        <div className="xl:col-span-7">
          <ActiveSessions />
        </div>
      </div>
    </div>
  );
}
