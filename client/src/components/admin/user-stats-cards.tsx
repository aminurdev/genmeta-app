"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserStats } from "@/services/admin-dashboard";
import {
  Users,
  CheckCircle2,
  XCircle,
  Shield,
  User,
  Activity,
  Smartphone,
} from "lucide-react";

interface UserStatsCardsProps {
  stats: UserStats["data"];
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  // Calculate derived values
  const unverifiedUsers = stats.totalUsers - stats.verifiedUsers;
  const adminUsers =
    stats.roleDistribution.find((role) => role._id === "admin")?.count || 0;
  const regularUsers =
    stats.roleDistribution.find((role) => role._id === "user")?.count || 0;

  return (
    <div className="grid gap-6 whitespace-nowrap grid-cols-7 overflow-x-auto">
      <Card className="overflow-hidden min-w-48 border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50/50">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">
            {stats.totalUsers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.recentRegistrations.toLocaleString()} New users this month
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden min-w-48 border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-emerald-50/50">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Activity className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">
            {stats.activeUsers.toLocaleString()}
          </div>
          <div className="mt-2">
            <Progress
              value={
                stats.totalUsers > 0
                  ? (stats.activeUsers / stats.totalUsers) * 100
                  : 0
              }
              className="h-1.5 bg-emerald-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalUsers > 0
                ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
                : 0}
              % of total users
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden min-w-48 border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50/50">
          <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent className="pt-4">
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
              className="h-1.5 bg-green-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalUsers > 0
                ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1)
                : 0}
              % of total users
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden min-w-48 border-l-4 border-l-yellow-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-yellow-50/50">
          <CardTitle className="text-sm font-medium">
            Unverified Users
          </CardTitle>
          <XCircle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">
            {unverifiedUsers.toLocaleString()}
          </div>
          <div className="mt-2">
            <Progress
              value={
                stats.totalUsers > 0
                  ? (unverifiedUsers / stats.totalUsers) * 100
                  : 0
              }
              className="h-1.5 bg-yellow-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalUsers > 0
                ? ((unverifiedUsers / stats.totalUsers) * 100).toFixed(1)
                : 0}
              % of total users
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden min-w-48 border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-purple-50/50">
          <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
          <Shield className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">
            {adminUsers.toLocaleString()}
          </div>
          <div className="mt-2">
            <Progress
              value={
                stats.totalUsers > 0 ? (adminUsers / stats.totalUsers) * 100 : 0
              }
              className="h-1.5 bg-purple-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalUsers > 0
                ? ((adminUsers / stats.totalUsers) * 100).toFixed(1)
                : 0}
              % of total users
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden min-w-48 border-l-4 border-l-indigo-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-indigo-50/50">
          <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
          <User className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent className="pt-4">
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
              className="h-1.5 bg-indigo-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalUsers > 0
                ? ((regularUsers / stats.totalUsers) * 100).toFixed(1)
                : 0}
              % of total users
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden min-w-48 border-l-4 border-l-cyan-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-cyan-50/50">
          <CardTitle className="text-sm font-medium">App Users</CardTitle>
          <Smartphone className="h-4 w-4 text-cyan-500" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">
            {stats.appUsers.count.toLocaleString()}
          </div>
          <div className="mt-2">
            <Progress
              value={stats.appUsers.percentage}
              className="h-1.5 bg-cyan-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.appUsers.percentage.toFixed(1)}% of total users
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
