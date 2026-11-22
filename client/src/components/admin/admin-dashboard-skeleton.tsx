import React from "react";
import {
  Activity,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Gift,
  KeyRound,
  Layers,
  RefreshCw,
  Settings2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminDashboardSkeletonProps {
  showHeader?: boolean;
}

export function AdminDashboardSkeleton({
  showHeader = true,
}: AdminDashboardSkeletonProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* 1. Header Banner */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Admin Overview
              </h1>
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor platform revenue, user growth, processing activity, and
              payouts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="secondary" size="sm" disabled className="gap-1.5">
              <Users className="h-4 w-4" />
              Users
            </Button>
            <Button size="sm" disabled className="gap-1.5">
              <CreditCard className="h-4 w-4" />
              Payments
            </Button>
          </div>
        </div>
      )}

      {/* 2. Primary KPI Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-28" />
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Monthly Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Platform Users
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Premium
            </CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      </div>

      {/* 3. Secondary Platform Pulse Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Files Processed", icon: Layers },
          { label: "Success Rate", icon: CheckCircle2 },
          { label: "Desktop Accounts", icon: KeyRound },
          { label: "Referral Liability", icon: Gift },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="rounded-lg border bg-card p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">{item.label}</span>
                <Icon className="h-3.5 w-3.5 opacity-70" />
              </div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          );
        })}
      </div>

      {/* 4. Interactive Dual Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[
          {
            title: "Revenue Overview",
            desc: "Monthly payment collections over the last 6 months",
            colorClass: "text-blue-500",
            pathD: "M0,150 Q70,90 140,110 T280,60 T420,95 T500,40",
          },
          {
            title: "AI Processing Activity",
            desc: "Daily files processed across all desktop clients",
            colorClass: "text-emerald-500",
            pathD: "M0,130 Q80,160 160,80 T320,120 T440,50 T500,70",
          },
        ].map((chart, idx) => (
          <Card key={idx}>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">
                    {chart.title}
                  </CardTitle>
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
                <CardDescription>{chart.desc}</CardDescription>
              </div>
              <div className="flex items-center rounded-lg border bg-muted p-0.5 self-start sm:self-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs rounded-md pointer-events-none"
                >
                  7 Days
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 px-2.5 text-xs rounded-md pointer-events-none"
                >
                  6 Months
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[260px] flex flex-col justify-end pt-2">
                <div className="w-full h-[210px] relative flex items-end">
                  <svg
                    className={`w-full h-full opacity-20 ${chart.colorClass}`}
                    viewBox="0 0 500 200"
                    preserveAspectRatio="none"
                  >
                    <path
                      d={`${chart.pathD} L500,200 L0,200 Z`}
                      fill="currentColor"
                    />
                    <path
                      d={chart.pathD}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/40">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-10" />
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t flex items-center justify-between">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 5. Recent Payments + Plan Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Recent Payments
              </CardTitle>
              <CardDescription>
                Latest verified package upgrades and credit purchases
              </CardDescription>
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="hidden sm:table-cell">Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Status &amp; Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <TableRow key={row}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-36" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-3.5 w-24 font-mono" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4 flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Plan Breakdown &amp; Operations
              </CardTitle>
              <CardDescription>
                Desktop license tiers and referral summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {["Subscriptions", "Credit Packs", "Free Tier", "Suspended"].map(
                (label) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{label}</span>
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                )
              )}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
                <Skeleton className="h-3.5 w-4/6" />
              </div>
            </CardContent>
          </div>
          <div className="p-6 pt-0 space-y-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="w-full justify-start gap-2 text-xs"
            >
              <Gift className="h-3.5 w-3.5" />
              Manage Referral Payouts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="w-full justify-start gap-2 text-xs"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Pricing &amp; Promo Codes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="w-full justify-start gap-2 text-xs"
            >
              <Activity className="h-3.5 w-3.5" />
              Scheduler &amp; Maintenance
            </Button>
          </div>
        </Card>
      </div>

      {/* 6. Top Performers Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Top API Usage",
            desc: "Most active accounts by processed files",
          },
          {
            title: "Top Spenders",
            desc: "Highest cumulative customer spend",
          },
          {
            title: "Top Referrers",
            desc: "Leading affiliate partners by invitations",
          },
        ].map((section, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {section.title}
              </CardTitle>
              <CardDescription className="text-xs">
                {section.desc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y rounded-lg border">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-3 w-4" />
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboardSkeleton;
