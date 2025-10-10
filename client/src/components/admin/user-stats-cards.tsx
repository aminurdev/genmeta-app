"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UserStats } from "@/services/admin-dashboard";
import { Users, CheckCircle2, User, Smartphone } from "lucide-react";

interface UserStatsCardsProps {
  stats: UserStats["data"];
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  const regularUsers =
    stats.roleDistribution.find((role) => role._id === "user")?.count || 0;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalUsers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.recentRegistrations.toLocaleString()} new this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Verified</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.verifiedUsers.toLocaleString()}
          </div>
          <div className="mt-2">
            <Progress
              value={
                stats.totalUsers > 0
                  ? (stats.verifiedUsers / stats.totalUsers) * 100
                  : 0
              }
              className="h-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalUsers > 0
                ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1)
                : 0}
              % of total
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {regularUsers.toLocaleString()}
          </div>
          <div className="mt-2">
            <Progress
              value={
                stats.totalUsers > 0
                  ? (regularUsers / stats.totalUsers) * 100
                  : 0
              }
              className="h-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalUsers > 0
                ? ((regularUsers / stats.totalUsers) * 100).toFixed(1)
                : 0}
              % of total
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">App Users</CardTitle>
          <Smartphone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.appUsers.count.toLocaleString()}
          </div>
          <div className="mt-2">
            <Progress value={stats.appUsers.percentage} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.appUsers.percentage.toFixed(1)}% of total
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
