"use client";

import { useEffect, useState } from "react";
import { Activity, Key, KeyRound, Layers, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
// Removed getBaseApi import to prevent server component errors
import { getAccessToken } from "@/services/auth-services";

interface StatisticsData {
  totalKeys: number;
  activeKeys: number;
  suspendedKeys: number;
  keysByPlan: Record<string, number>;
  totalProcesses: number;
  avgProcessesPerKey: number;
  dailyNewKeys: Array<{
    date: string;
    count: number;
  }>;
}

export default function StatisticsContent() {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const baseApi = process.env.NEXT_PUBLIC_API_BASE_URL;
        const accessToken = await getAccessToken();
        const response = await fetch(`${baseApi}/app/appkey/statistics`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch statistics");
        }

        const result = await response.json();

        if (result.success) {
          setStatistics(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch statistics");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return <div>Loading statistics...</div>;
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>;
  }

  if (!statistics) {
    return <div>No statistics available</div>;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 grid-cols-3 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total APP Users
            </CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalKeys}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.activeKeys} active, {statistics.suspendedKeys}{" "}
              suspended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeKeys}</div>
            <p className="text-xs text-muted-foreground">
              {((statistics.activeKeys / statistics.totalKeys) * 100).toFixed(
                1
              )}
              % of total Users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Suspended Users
            </CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.suspendedKeys}</div>
            <p className="text-xs text-muted-foreground">
              {(
                (statistics.suspendedKeys / statistics.totalKeys) *
                100
              ).toFixed(1)}
              % of total Users
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
              {statistics.dailyNewKeys.length > 0
                ? statistics.dailyNewKeys[0].count
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              on{" "}
              {statistics.dailyNewKeys.length > 0
                ? new Date(statistics.dailyNewKeys[0].date).toLocaleDateString()
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
              {statistics.avgProcessesPerKey.toFixed(1)} avg per key
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
              {statistics.avgProcessesPerKey.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.totalProcesses} total processes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>APP Users Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-primary"></div>
                  <span>Active Users</span>
                </div>
                <span className="font-medium">{statistics.activeKeys}</span>
              </div>
              <Progress
                value={(statistics.activeKeys / statistics.totalKeys) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {((statistics.activeKeys / statistics.totalKeys) * 100).toFixed(
                  1
                )}
                % of total users
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-destructive/70"></div>
                  <span>Suspended Users</span>
                </div>
                <span className="font-medium">{statistics.suspendedKeys}</span>
              </div>
              <Progress
                value={(statistics.suspendedKeys / statistics.totalKeys) * 100}
                className="h-2 bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {(
                  (statistics.suspendedKeys / statistics.totalKeys) *
                  100
                ).toFixed(1)}
                % of total users
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statistics.keysByPlan).map(([plan, count]) => (
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
                    value={(count / statistics.totalKeys) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {((count / statistics.totalKeys) * 100).toFixed(1)}% of
                    total keys
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
