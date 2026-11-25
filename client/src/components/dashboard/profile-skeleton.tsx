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
import { Separator } from "@/components/ui/separator";
import {
  Laptop,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Zap,
} from "lucide-react";

export function ProfileSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in-50 duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Account Profile
            </h1>
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your personal information, subscription quota, active
            sessions, and security.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" disabled className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" disabled className="gap-2">
            <Sparkles className="h-4 w-4" />
            Manage Plan
          </Button>
        </div>
      </div>

      {/* 2. Minimal Identity Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-3.5 w-48" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>

      {/* 3. Four-Card Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { title: "Current Plan", icon: Sparkles },
          { title: "Available Credits", icon: Zap },
          { title: "Total Generates", icon: Layers },
          { title: "Devices & Sessions", icon: Laptop },
        ].map(({ title, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3.5 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. Full-Width 12-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
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
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <React.Fragment key={row}>
                  <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  {row < 6 && <Separator />}
                </React.Fragment>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Active Web Sessions
              </CardTitle>
              <CardDescription>
                Browsers and devices currently signed in to your web account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border rounded-lg border border-border">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProfileSkeleton;
