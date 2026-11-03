"use client";

import React from "react";
import { useProfileQuery } from "@/services/queries/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  AlertCircle,
  CheckCircle,
  AppWindowMac,
} from "lucide-react";
import { format } from "date-fns";
import { PasswordChangeForm } from "@/components/dashboard/password-change-form";
import { PlanSwitcher } from "@/components/dashboard/plan-switcher";
import { ProfileSkeleton } from "@/components/dashboard/profile-skeleton";

const Profile = () => {
  const { data: profile, isLoading, isError, error } = useProfileQuery();

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP");
    } catch {
      return dateString;
    }
  };

  const formatCredit = (credit: number | null | undefined) => {
    if (credit === null || credit === undefined) {
      return "Unlimited";
    }
    return credit.toLocaleString();
  };

  // Loading state
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Error state
  if (isError || !profile?.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 min-h-[300px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            Failed to load profile
          </h2>
          <p className="text-muted-foreground">
            {profile?.message ||
              (error as Error)?.message ||
              "An error occurred loading profile data"}
          </p>
        </div>
      </div>
    );
  }

  const data = profile.data;

  // Safety check for data
  if (!data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 min-h-[300px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            No data available
          </h2>
          <p className="text-muted-foreground">Unable to load profile data</p>
        </div>
      </div>
    );
  }

  const user = data.user || data;
  const appKey = data.appId || data.appKey;
  const loginProviders: string[] = Array.isArray(user.loginProvider) && user.loginProvider.length > 0
    ? user.loginProvider
    : ["email"];
  const hasEmailProvider = loginProviders.includes("email");

  return (
    <div className="space-y-6 p-4 pt-0 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Profile</h3>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={user.avatar || `https://avatar.vercel.sh/${user.email || "user"}`}
                  alt={user.name || "User"}
                />
                <AvatarFallback className="text-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="text-lg font-medium">{user.name || "GenMeta User"}</h4>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">
                    {user.role || "user"}
                  </Badge>
                  {user.isVerified && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Login Methods</span>
                <div className="flex gap-1">
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

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Account Status</span>
                <div className="flex items-center gap-1">
                  {user.isDisabled ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <Badge variant="destructive">Disabled</Badge>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="default">Active</Badge>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Member Since</span>
                <span className="text-sm">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desktop App ID Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AppWindowMac className="h-5 w-5" />
              Desktop App ID
            </CardTitle>
            <CardDescription>Your desktop app account identifier and plan usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {appKey ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Plan Type</span>
                  <Badge variant="outline" className="capitalize">
                    {appKey.plan?.type || "free"} {appKey.plan?.name ? `(${appKey.plan.name})` : ""}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status</span>
                  <div className="flex items-center gap-1">
                    {appKey.isActive ? (
                      <>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <Badge variant="default" className="capitalize">
                          {appKey.status || "active"}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <Badge variant="destructive">Inactive</Badge>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Generates</span>
                  <span className="text-sm font-medium">
                    {(appKey.totalProcess ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Available Credits</span>
                  <span className="text-sm font-medium">
                    {formatCredit(appKey.credit)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Expires At</span>
                  <span className="text-sm font-medium">
                    {formatDate(appKey.expiresAt)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                <p>No active App ID found for this account.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Switcher / Upgrade */}
      <PlanSwitcher />

      {/* Security & Password Change */}
      {hasEmailProvider && <PasswordChangeForm />}
    </div>
  );
};

export default Profile;
