import React from "react";
import {
  ArrowLeft,
  BarChart3,
  CreditCard,
  KeyRound,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UsersManagementSkeletonProps {
  rowsPerPage?: number;
}

export function UsersManagementSkeleton({
  rowsPerPage = 10,
}: UsersManagementSkeletonProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Users 
            </h1>
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <p className="text-sm text-muted-foreground">
            Manage platform accounts, desktop app profiles, plans, credits, and
            device bindings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" disabled className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" disabled className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Create App User
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Users", icon: Users },
          { label: "Active Premium", icon: Sparkles },
          { label: "Desktop Users", icon: KeyRound },
          { label: "Platform Processes", icon: Layers },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 7-Day Registrations & Plan Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-7">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              New Registrations (7 Days)
            </CardTitle>
            <CardDescription>
              Daily account signups over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] flex flex-col justify-end space-y-3">
              <div className="h-[170px] w-full flex items-end justify-between gap-2 px-2 border-b border-border/50 pb-2">
                {[35, 65, 45, 85, 55, 75, 60].map((h, i) => (
                  <Skeleton
                    key={i}
                    className="flex-1 rounded-t-md opacity-70"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-10" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Plan &amp; Role Distribution
            </CardTitle>
            <CardDescription>Active tiers and account roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Subscriptions", "Credit Packs", "Free Tier", "Uninitialized"].map(
              (label) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>{label}</span>
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* Directory Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">
              User Directory
            </CardTitle>
            <CardDescription>
              Inspect user profiles, manage desktop users, and manually assign
              or upgrade plans.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <Skeleton className="h-9 flex-1" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>

          <div className="hidden lg:block rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>User</TableHead>
                  <TableHead>Plan &amp; Quota</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Devices &amp; Usage</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: rowsPerPage }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-44" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-14" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3.5 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="lg:hidden divide-y rounded-lg border">
            {Array.from({ length: rowsPerPage }).map((_, idx) => (
              <div key={idx} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1 rounded-md" />
                  <Skeleton className="h-8 flex-1 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" disabled className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3.5 w-64" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Identity Hero */}
      <Card>
        <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Current Plan", icon: Sparkles },
          { label: "Available Credits", icon: KeyRound },
          { label: "Total Processed", icon: BarChart3 },
          { label: "Lifetime Spend", icon: CreditCard },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3.5 w-32" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart + Security Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-7">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Processing Activity
            </CardTitle>
            <CardDescription>
              Usage breakdown across 7 days and 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[260px] w-full rounded-lg" />
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Account &amp; Security Overview
            </CardTitle>
            <CardDescription>
              Identity, login metadata, and active sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Sections */}
      <Card>
        <CardHeader>
          <Skeleton className="h-9 w-80 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
