"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mail, Chrome } from "lucide-react";

interface LoginProviderStatsProps {
  stats: {
    totalUsers: number;
    loginProviders: Array<{ _id: string; count: number }>;
  };
}

export function LoginProviderStats({ stats }: LoginProviderStatsProps) {
  const googleUsers =
    stats.loginProviders.find((provider) => provider._id === "google")?.count ||
    0;
  const emailUsers =
    stats.loginProviders.find((provider) => provider._id === "email")?.count ||
    0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Google Login</CardTitle>
          <Chrome className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {googleUsers.toLocaleString()}
          </div>
          <div className="mt-2">
            <Progress
              value={
                stats.totalUsers > 0
                  ? (googleUsers / stats.totalUsers) * 100
                  : 0
              }
              className="h-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalUsers > 0
                ? ((googleUsers / stats.totalUsers) * 100).toFixed(1)
                : 0}
              % of total users
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Email Login</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {emailUsers.toLocaleString()}
          </div>
          <div className="mt-2">
            <Progress
              value={
                stats.totalUsers > 0 ? (emailUsers / stats.totalUsers) * 100 : 0
              }
              className="h-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalUsers > 0
                ? ((emailUsers / stats.totalUsers) * 100).toFixed(1)
                : 0}
              % of total users
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
