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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldAlert,
  Server,
  Database,
  Cpu,
  Zap,
  Activity,
  Users,
  RefreshCw,
  UserCheck,
  Search,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

export function SuperAdminStaffRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28 sm:w-36" />
                <Skeleton className="h-3 w-36 sm:w-48 font-mono" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-24" />
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function SuperAdminStaffSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Staff & Privileged Accounts</CardTitle>
            <CardDescription>
              List of accounts with access to the Admin Portal. Only SuperAdmins can modify roles.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <div className="h-9 w-full rounded-md border bg-muted/30 pl-8 flex items-center text-xs text-muted-foreground">
              Filter staff by name or email...
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>User</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SuperAdminStaffRowsSkeleton count={5} />
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SuperAdminTelemetrySkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* 4 Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Server Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            <Server className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Online</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Uptime:</span>
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <span>Node:</span>
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>

        {/* Database Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Database Health</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold capitalize">Connected</span>
              <Badge variant="outline" className="text-emerald-600 border-emerald-500/20 bg-emerald-500/10 text-xs">
                Primary
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">DB: mongodb</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <span>AppKeys:</span>
              <Skeleton className="h-3 w-8" />
              <span>active</span>
            </div>
          </CardContent>
        </Card>

        {/* Memory Allocation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Memory Allocation</CardTitle>
            <Cpu className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <Skeleton className="h-8 w-16" />
              <span>MB</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <Skeleton className="h-full w-2/5" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Used / Total</span>
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Workload */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Global Workload</CardTitle>
            <Zap className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-1" />
            <p className="text-xs text-muted-foreground">Lifetime processed files</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <span>Total Accounts:</span>
              <Skeleton className="h-3 w-10" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution & Quick Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">User Role & Account Distribution</CardTitle>
            <CardDescription>
              Summary of accounts registered across customer and administrative tiers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-card space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Standard Users
                </span>
                <Skeleton className="h-8 w-14" />
                <span className="text-xs text-muted-foreground">Regular customers</span>
              </div>

              <div className="p-4 rounded-lg border bg-card space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Administrators
                </span>
                <Skeleton className="h-8 w-10" />
                <span className="text-xs text-muted-foreground">Console managers</span>
              </div>

              <div className="p-4 rounded-lg border bg-card space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Super Admins
                </span>
                <Skeleton className="h-8 w-8" />
                <span className="text-xs text-muted-foreground">Root privileges</span>
              </div>

              <div className="p-4 rounded-lg border bg-card space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Suspended
                </span>
                <Skeleton className="h-8 w-8" />
                <span className="text-xs text-muted-foreground">Banned accounts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Administrative Shortcuts</CardTitle>
            <CardDescription>Direct navigation to system maintenance tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Link
              href="/admin/backup"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
            >
              <div className="flex items-center gap-2.5">
                <Database className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">Database Backup</div>
                  <div className="text-xs text-muted-foreground">Sync & download dumps</div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link
              href="/admin/scheduler"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
            >
              <div className="flex items-center gap-2.5">
                <Activity className="h-4 w-4 text-amber-500" />
                <div>
                  <div className="font-medium">Task Scheduler</div>
                  <div className="text-xs text-muted-foreground">Manage cron jobs</div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link
              href="/admin/manage-pricing"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-indigo-500" />
                <div>
                  <div className="font-medium">Pricing & Plans</div>
                  <div className="text-xs text-muted-foreground">Manage subscriptions & credits</div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SuperAdminDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="bg-primary/90 gap-1 font-semibold">
              <ShieldAlert className="h-3.5 w-3.5" />
              Super Admin Control
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Telemetry Live
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">System Infrastructure & Governance</h1>
          <p className="text-sm text-muted-foreground">
            Manage system services, monitor infrastructure telemetry, and govern administrative privileges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync Status
          </Button>
          <Button size="sm" disabled className="gap-2">
            <UserCheck className="h-4 w-4" />
            Add Administrator
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button variant="default" size="sm" className="gap-2 pointer-events-none">
          <Activity className="h-4 w-4" />
          Infrastructure Telemetry
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 pointer-events-none">
          <Users className="h-4 w-4" />
          Staff & Access Governance
        </Button>
      </div>

      {/* Telemetry tab contents */}
      <SuperAdminTelemetrySkeleton />
    </div>
  );
}

export default SuperAdminDashboardSkeleton;
