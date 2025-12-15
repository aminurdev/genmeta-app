"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Play,
  Square,
  RefreshCw,
  Clock,
  Activity,
  Calendar,
  Users,
  CreditCard,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useSchedulerStatusQuery,
  useMaintenanceStatsQuery,
} from "@/services/queries/admin-dashboard";
import {
  startScheduler,
  stopScheduler,
  triggerMaintenance,
} from "@/services/admin-dashboard";
import type {
  SchedulerStatus,
  MaintenanceStats,
} from "@/services/admin-dashboard";

export function SchedulerDashboard() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch scheduler status and maintenance stats using React Query
  const {
    data: schedulerResponse,
    isLoading: schedulerLoading,
    refetch: refetchScheduler,
  } = useSchedulerStatusQuery();

  const {
    data: statsResponse,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useMaintenanceStatsQuery();

  // Extract data from responses
  const schedulerStatus: SchedulerStatus | null =
    schedulerResponse?.success && schedulerResponse.data
      ? schedulerResponse.data
      : null;

  const maintenanceStats: MaintenanceStats | null =
    statsResponse?.success && statsResponse.data ? statsResponse.data : null;

  const loading = schedulerLoading || statsLoading;

  const refetchData = async () => {
    await Promise.all([refetchScheduler(), refetchStats()]);
  };

  const handleSchedulerAction = async (action: "start" | "stop") => {
    try {
      setActionLoading(action);
      const actionFn = action === "start" ? startScheduler : stopScheduler;
      const result = await actionFn();

      if (result.success) {
        toast.success(`Scheduler ${action}ed successfully`);
        await refetchScheduler();
      } else {
        throw new Error(result.message || `Failed to ${action} scheduler`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to ${action} scheduler`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerMaintenance = async () => {
    try {
      setActionLoading("trigger");
      const result = await triggerMaintenance();

      if (result.success) {
        toast.success("Maintenance triggered successfully");
        await refetchData();
      } else {
        throw new Error(result.message || "Failed to trigger maintenance");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to trigger maintenance"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (isRunning: boolean) => {
    return isRunning ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Running
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        Stopped
      </Badge>
    );
  };

  const getPlanBadge = (planType: string) => {
    const colors = {
      free: "bg-gray-100 text-gray-800 border-gray-200",
      credit: "bg-blue-100 text-blue-800 border-blue-200",
      subscription: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return (
      colors[planType as keyof typeof colors] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading scheduler dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Scheduler Management
          </h1>
          <p className="text-muted-foreground">
            Monitor and control the automated maintenance scheduler
          </p>
        </div>
        <Button onClick={refetchData} variant="outline" className="w-fit">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Scheduler Status
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {schedulerStatus && getStatusBadge(schedulerStatus.isRunning)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {schedulerStatus?.nextRun
                ? `Next run: ${format(
                  new Date(schedulerStatus.nextRun),
                  "PPp"
                )}`
                : "No scheduled runs"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedulerStatus?.stats.totalRuns || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {schedulerStatus?.stats.successfulRuns || 0} successful,{" "}
              {schedulerStatus?.stats.failedRuns || 0} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Run</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {schedulerStatus?.lastRun
                ? format(new Date(schedulerStatus.lastRun), "PPp")
                : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">
              {schedulerStatus?.stats.lastResult?.success
                ? "Successful"
                : "Failed"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Maintenance Needed
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maintenanceStats?.maintenanceNeeded.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Users requiring maintenance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduler Controls</CardTitle>
          <CardDescription>
            Start, stop, or manually trigger the maintenance scheduler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleSchedulerAction("start")}
              disabled={schedulerStatus?.isRunning || actionLoading === "start"}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading === "start" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Start Scheduler
            </Button>

            <Button
              onClick={() => handleSchedulerAction("stop")}
              disabled={!schedulerStatus?.isRunning || actionLoading === "stop"}
              variant="destructive"
            >
              {actionLoading === "stop" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              Stop Scheduler
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={actionLoading === "trigger"}
                >
                  {actionLoading === "trigger" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Trigger Now
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Trigger Maintenance Now</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately run the daily maintenance process.
                    This action will refresh free plan credits, downgrade
                    expired subscriptions, and handle zero credit plans. Are you
                    sure you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleTriggerMaintenance}>
                    Trigger Maintenance
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>
              Current distribution of active API keys by plan type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maintenanceStats?.planDistribution.map((plan) => (
                <div
                  key={plan._id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Badge className={getPlanBadge(plan._id)}>
                      {plan._id.charAt(0).toUpperCase() + plan._id.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {plan.count} users
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {plan.totalCredits || 0} total credits
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(plan.avgCredits || 0).toFixed(1)} avg per user
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Needed */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Required</CardTitle>
            <CardDescription>
              Users that need maintenance actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Free users needing refresh</span>
                </div>
                <Badge variant="outline">
                  {maintenanceStats?.maintenanceNeeded
                    .freeUsersNeedingRefresh || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Expired subscriptions</span>
                </div>
                <Badge variant="outline">
                  {maintenanceStats?.maintenanceNeeded.expiredSubscriptions ||
                    0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Zero credit plans</span>
                </div>
                <Badge variant="outline">
                  {maintenanceStats?.maintenanceNeeded.zeroCreditPlans || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {schedulerStatus?.stats.lastResult && (
        <Card>
          <CardHeader>
            <CardTitle>Last Maintenance Result</CardTitle>
            <CardDescription>
              Details from the most recent maintenance run
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Status:</span>
                {schedulerStatus.stats.lastResult.success ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Success
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    Failed
                  </Badge>
                )}
              </div>
              {schedulerStatus.stats.lastResult.details && (
                <div className="text-sm text-muted-foreground">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(
                      schedulerStatus.stats.lastResult.details,
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
