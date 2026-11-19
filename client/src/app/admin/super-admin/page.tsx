"use client";

import React, { useState } from "react";
import {
  useSuperAdminOverviewQuery,
  useAdminListQuery,
  useUpdateUserRoleMutation,
  useToggleUserStatusMutation,
} from "@/services/queries/super-admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  Users,
  Activity,
  RefreshCw,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  ArrowUpRight,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  SuperAdminDashboardSkeleton,
  SuperAdminTelemetrySkeleton,
  SuperAdminStaffRowsSkeleton,
} from "@/components/admin/super-admin-skeleton";

export default function SuperAdminPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoteUserId, setPromoteUserId] = useState("");

  const {
    data: overviewRes,
    isLoading: isOverviewLoading,
    isRefetching: isOverviewRefetching,
    refetch: refetchOverview,
  } = useSuperAdminOverviewQuery();

  const {
    data: staffRes,
    isLoading: isStaffLoading,
    isRefetching: isStaffRefetching,
    refetch: refetchStaff,
  } = useAdminListQuery();

  const updateRoleMutation = useUpdateUserRoleMutation();
  const toggleStatusMutation = useToggleUserStatusMutation();

  const overview = overviewRes?.success ? overviewRes.data : null;
  const staff = staffRes?.success && staffRes.data ? staffRes.data.staff : [];

  const handleRefresh = () => {
    refetchOverview();
    refetchStaff();
    toast.success("Telemetry updated");
  };

  const handleRoleChange = (userId: string, role: "user" | "admin" | "superAdmin") => {
    updateRoleMutation.mutate({ userId, role });
  };

  const handleToggleStatus = (userId: string, currentDisabled: boolean) => {
    toggleStatusMutation.mutate({ userId, isDisabled: !currentDisabled });
  };

  const handlePromoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteUserId.trim()) {
      toast.error("Please enter a User ID");
      return;
    }
    updateRoleMutation.mutate(
      { userId: promoteUserId.trim(), role: "admin" },
      {
        onSuccess: (res) => {
          if (res.success) {
            setPromoteDialogOpen(false);
            setPromoteUserId("");
          }
        },
      }
    );
  };

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member._id.includes(searchTerm)
  );

  const memoryUsagePercent =
    overview?.memory?.heapTotalMB && overview.memory.heapTotalMB > 0
      ? Math.round((overview.memory.heapUsedMB / overview.memory.heapTotalMB) * 100)
      : 0;

  if (isOverviewLoading && !overview && isStaffLoading && staff.length === 0) {
    return <SuperAdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="bg-primary/90 hover:bg-primary gap-1 font-semibold">
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isOverviewLoading || isOverviewRefetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isOverviewRefetching || isStaffRefetching ? "animate-spin" : ""}`}
            />
            Sync Status
          </Button>
          <Button
            size="sm"
            onClick={() => setPromoteDialogOpen(true)}
            className="gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Add Administrator
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="telemetry" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="telemetry" className="gap-2">
            <Activity className="h-4 w-4" />
            Infrastructure Telemetry
          </TabsTrigger>
          <TabsTrigger value="governance" className="gap-2">
            <Users className="h-4 w-4" />
            Staff & Access Governance ({staff.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Infrastructure Telemetry */}
        <TabsContent value="telemetry" className="space-y-6">
          {isOverviewLoading && !overview ? (
            <SuperAdminTelemetrySkeleton />
          ) : (
            <>
              {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Server Status</CardTitle>
                <Server className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Online</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Uptime: {overview?.uptimeHuman || "Loading..."}
                </p>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Node: {overview?.nodeVersion || "..."} ({overview?.platform || "..."})
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Database Health</CardTitle>
                <Database className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold capitalize">
                    {overview?.database?.status || "Connected"}
                  </span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/20 bg-emerald-500/10 text-xs">
                    Primary
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  DB: {overview?.database?.name || "mongodb"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AppKeys: {overview?.counts?.totalAppKeys?.toLocaleString() || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Memory Allocation</CardTitle>
                <Cpu className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview?.memory?.heapUsedMB || 0} MB
                </div>
                <div className="mt-2 space-y-1">
                  <Progress value={memoryUsagePercent} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Used / Total</span>
                    <span>{memoryUsagePercent}% ({overview?.memory?.heapTotalMB || 0} MB)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Global Workload</CardTitle>
                <Zap className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview?.counts?.totalProcesses?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime processed files
                </p>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Total Accounts: {overview?.counts?.totalUsers?.toLocaleString() || 0}
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
                    <div className="text-2xl font-bold text-foreground">
                      {overview?.counts?.users?.toLocaleString() || 0}
                    </div>
                    <span className="text-xs text-muted-foreground">Regular customers</span>
                  </div>

                  <div className="p-4 rounded-lg border bg-card space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Administrators
                    </span>
                    <div className="text-2xl font-bold text-primary">
                      {overview?.counts?.admins?.toLocaleString() || 0}
                    </div>
                    <span className="text-xs text-muted-foreground">Console managers</span>
                  </div>

                  <div className="p-4 rounded-lg border bg-card space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Super Admins
                    </span>
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {overview?.counts?.superAdmins?.toLocaleString() || 0}
                    </div>
                    <span className="text-xs text-muted-foreground">Root privileges</span>
                  </div>

                  <div className="p-4 rounded-lg border bg-card space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Suspended
                    </span>
                    <div className="text-2xl font-bold text-destructive">
                      {overview?.counts?.disabledUsers?.toLocaleString() || 0}
                    </div>
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
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">Scheduler Operations</div>
                      <div className="text-xs text-muted-foreground">Daily credit refreshes</div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link
                  href="/admin/manage-pricing"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-primary" />
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
            </>
          )}
        </TabsContent>

        {/* TAB 2: Staff & Access Governance */}
        <TabsContent value="governance" className="space-y-4">
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
                <Input
                  placeholder="Filter staff by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isStaffLoading ? (
                      <SuperAdminStaffRowsSkeleton count={5} />
                    ) : filteredStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No staff accounts found matching your query.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaff.map((member) => {
                        const isSelf = currentUser?.userId === member._id;
                        return (
                          <TableRow key={member._id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-1.5">
                                    {member.name}
                                    {isSelf && (
                                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                        You
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {member.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant={member.role === "superAdmin" ? "default" : "outline"}
                                className={
                                  member.role === "superAdmin"
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white gap-1 text-xs"
                                    : "border-primary/40 text-primary text-xs"
                                }
                              >
                                {member.role === "superAdmin" ? (
                                  <>
                                    <ShieldAlert className="h-3 w-3" />
                                    Super Admin
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="h-3 w-3" />
                                    Admin
                                  </>
                                )}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              {member.isDisabled ? (
                                <Badge variant="destructive" className="text-xs">
                                  Suspended
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-emerald-600 border-emerald-500/20 bg-emerald-500/10 text-xs"
                                >
                                  Active
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(member.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </TableCell>

                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Role Governance</DropdownMenuLabel>
                                  <DropdownMenuSeparator />

                                  {member.role !== "superAdmin" && (
                                    <DropdownMenuItem
                                      onClick={() => handleRoleChange(member._id, "superAdmin")}
                                      disabled={updateRoleMutation.isPending}
                                      className="gap-2"
                                    >
                                      <ShieldAlert className="h-4 w-4 text-indigo-500" />
                                      Promote to SuperAdmin
                                    </DropdownMenuItem>
                                  )}

                                  {member.role === "superAdmin" && !isSelf && (
                                    <DropdownMenuItem
                                      onClick={() => handleRoleChange(member._id, "admin")}
                                      disabled={updateRoleMutation.isPending}
                                      className="gap-2"
                                    >
                                      <ShieldCheck className="h-4 w-4 text-primary" />
                                      Demote to Admin
                                    </DropdownMenuItem>
                                  )}

                                  {!isSelf && (
                                    <DropdownMenuItem
                                      onClick={() => handleRoleChange(member._id, "user")}
                                      disabled={updateRoleMutation.isPending}
                                      className="gap-2 text-amber-600 dark:text-amber-400"
                                    >
                                      <UserX className="h-4 w-4" />
                                      Demote to User
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuSeparator />
                                  {!isSelf && (
                                    <DropdownMenuItem
                                      onClick={() => handleToggleStatus(member._id, member.isDisabled)}
                                      disabled={toggleStatusMutation.isPending}
                                      className={
                                        member.isDisabled
                                          ? "gap-2 text-emerald-600"
                                          : "gap-2 text-destructive"
                                      }
                                    >
                                      {member.isDisabled ? (
                                        <>
                                          <UserCheck className="h-4 w-4" />
                                          Reactivate Account
                                        </>
                                      ) : (
                                        <>
                                          <UserX className="h-4 w-4" />
                                          Suspend Account
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Promote User Dialog */}
      <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Admin Privileges</DialogTitle>
            <DialogDescription>
              Enter the MongoDB User ID of an existing registered user to promote them to an Administrator.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePromoteSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="userId" className="text-sm font-medium">
                User ID
              </label>
              <Input
                id="userId"
                placeholder="e.g. 64d9f1e07b8a1c0023e4a9bc"
                value={promoteUserId}
                onChange={(e) => setPromoteUserId(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                You can copy a User ID from the{" "}
                <Link href="/admin/users" className="text-primary underline">
                  Users Management Table
                </Link>
                .
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPromoteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? "Promoting..." : "Promote to Admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
