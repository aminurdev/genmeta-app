import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { User, AppWindowMac, Shield, Sparkles } from "lucide-react";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 p-4 pt-0 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      {/* Static Page Header */}
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Profile</h3>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information Card */}
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
              <Skeleton className="h-16 w-16 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-48" />
                <div className="flex items-center gap-2 pt-1">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Login Methods</span>
                <Skeleton className="h-5 w-16 rounded" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Account Status</span>
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Member Since</span>
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desktop App ID Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AppWindowMac className="h-5 w-5" />
              Desktop App ID
            </CardTitle>
            <CardDescription>Your desktop app account identifier and plan usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Plan Type</span>
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Generates</span>
                <Skeleton className="h-4 w-16" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Available Credits</span>
                <Skeleton className="h-4 w-20" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Expires At</span>
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Management Strip Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Plan & Quota Subscription
          </CardTitle>
          <CardDescription>
            Current subscription details and upgrade options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((tier) => (
              <div key={tier} className="p-4 rounded-lg border bg-card/60 space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-6 w-24" />
                <div className="space-y-1.5 pt-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                <Skeleton className="h-8 w-full rounded-md pt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security & Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Security & Credentials
          </CardTitle>
          <CardDescription>
            Update password and manage authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Current Password</span>
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">New Password</span>
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfileSkeleton;

