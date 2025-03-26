"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserGrowth } from "@/components/analytics/user-growth";
import { RevenueAnalytics } from "@/components/analytics/revenue-analytics";
import { TokenConsumption } from "@/components/analytics/token-consumption";
import { ImageProcessingMetrics } from "@/components/analytics/image-processing-metrics";
import { PlanDistribution } from "@/components/analytics/plan-distribution";
import { GeographicDistribution } from "@/components/analytics/geographic-distribution";
<p className="text-muted-foreground">
  Detailed insights and metrics about your platform&#39;s performance.
</p>;
import { ConversionFunnel } from "@/components/analytics/conversion-funnel";
import { UserRetention } from "@/components/analytics/user-retention";
import { DatePickerWithRange } from "@/components/admin/date-range-picker";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30days");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            <p className="text-muted-foreground">
              Detailed insights and metrics about your platform&#39;s
              performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DatePickerWithRange className="w-auto" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12,345</div>
                  <div className="text-xs text-muted-foreground">
                    +15.8% from previous period
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <div className="text-xs text-muted-foreground">
                    +8.3% from previous period
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tokens Used
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1.2M</div>
                  <div className="text-xs text-muted-foreground">
                    +23.1% from previous period
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2%</div>
                  <div className="text-xs text-muted-foreground">
                    +0.5% from previous period
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Revenue Over Time</CardTitle>
                  <CardDescription>Monthly revenue trends</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <RevenueAnalytics />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New vs total users</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <UserGrowth />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Token Consumption</CardTitle>
                  <CardDescription>Usage patterns over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <TokenConsumption />
                </CardContent>
              </Card>
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Plan Distribution</CardTitle>
                  <CardDescription>Users by subscription plan</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <PlanDistribution />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New users over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <UserGrowth />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>User Retention</CardTitle>
                  <CardDescription>
                    Cohort analysis of user retention
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <UserRetention />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                  <CardDescription>Users by location</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <GeographicDistribution />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>
                  Daily active users vs monthly active users
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  User activity chart will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>
                    Revenue by subscription plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <RevenueAnalytics />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Average Revenue Per User</CardTitle>
                  <CardDescription>ARPU trends over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    ARPU chart will be displayed here
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Recurring Revenue</CardTitle>
                <CardDescription>
                  Monthly recurring revenue (MRR) and annual recurring revenue
                  (ARR)
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  Recurring revenue chart will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Token Consumption</CardTitle>
                  <CardDescription>Token usage patterns</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <TokenConsumption />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Image Processing Metrics</CardTitle>
                  <CardDescription>
                    Image processing volume and performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ImageProcessingMetrics />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>API Usage</CardTitle>
                <CardDescription>
                  API requests by endpoint and response times
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  API usage chart will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>
                  User journey from signup to paid subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ConversionFunnel />
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Rates</CardTitle>
                  <CardDescription>
                    Conversion rates by acquisition channel
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    Conversion rates chart will be displayed here
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Upgrade Paths</CardTitle>
                  <CardDescription>
                    Analysis of plan upgrades and downgrades
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    Upgrade paths chart will be displayed here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
