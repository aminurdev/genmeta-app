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
import {
  Activity,
  Clock,
  CreditCard,
  Zap,
  RefreshCw,
} from "lucide-react";

export function SchedulerSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Scheduler Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor and control the automated maintenance scheduler
          </p>
        </div>
        <Button variant="outline" disabled className="w-fit gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* 4 Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Scheduler Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduler Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-20 rounded-md" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <span>Next run:</span>
              <Skeleton className="h-3 w-28" />
            </div>
          </CardContent>
        </Card>

        {/* Total Runs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <p className="text-xs text-muted-foreground">Automated cycles executed</p>
          </CardContent>
        </Card>

        {/* Active Plans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <p className="text-xs text-muted-foreground">Monitored subscriptions</p>
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Maintenance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 rounded-md" />
            <p className="text-xs text-muted-foreground mt-1">Manual trigger</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Panels */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Maintenance Controls</CardTitle>
            <CardDescription>Configure scheduler status and manual cycles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-card/60 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Scheduler Daemon</p>
                <p className="text-xs text-muted-foreground">Automatic daily & hourly jobs</p>
              </div>
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
            <div className="p-4 rounded-lg border bg-card/60 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Execute Maintenance Now</p>
                <p className="text-xs text-muted-foreground">Run plan verification cycle</p>
              </div>
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Execution Statistics</CardTitle>
            <CardDescription>Recent maintenance performance overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex justify-between items-center py-2 border-b last:border-0">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SchedulerSkeleton;

