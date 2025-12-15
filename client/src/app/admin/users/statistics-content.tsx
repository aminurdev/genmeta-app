"use client";

import { Activity, Key, KeyRound, Layers, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserStatsQuery } from "@/services/queries/admin-dashboard";
import Loading from "@/app/admin/loading";
import { Button } from "@/components/ui/button";
import { RefreshCw, XCircle } from "lucide-react";

export default function StatisticsContent() {
  const { data, isLoading, error, refetch } = useUserStatsQuery();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">Error loading statistics</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!data?.success || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No statistics available</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          Statistics could not be loaded.
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  const statistics = data.data;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total APP Users
            </CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.activeUsers} active, {statistics.suspendedUsers}{" "}
              suspended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Users (Last Day)
            </CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.dailyNewUsers.length > 0
                ? statistics.dailyNewUsers[0].count
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              on{" "}
              {statistics.dailyNewUsers.length > 0
                ? new Date(statistics.dailyNewUsers[0].date).toLocaleDateString()
                : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Processes
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalProcesses}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.avgProcessesPerUser.toFixed(1)} avg per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Processes Per User
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.avgProcessesPerUser.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.totalProcesses} total processes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statistics.usersByPlan).map(([plan, count]) => (
                <div key={plan} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="capitalize">
                        {plan.replace("_", " ")}
                      </span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                  <Progress
                    value={(count / statistics.totalUsers) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {((count / statistics.totalUsers) * 100).toFixed(1)}% of
                    total users
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
