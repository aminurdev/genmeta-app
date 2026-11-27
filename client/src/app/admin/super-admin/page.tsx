"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Filter,
  KeyRound,
  MoreVertical,
  Package,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  SuperAdminDashboardSkeleton,
  SuperAdminStaffRowsSkeleton,
} from "@/components/admin/super-admin-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  useAdminListQuery,
  useRefreshSuperAdminMutation,
  useSuperAdminOverviewQuery,
  useToggleUserStatusMutation,
  useUpdateUserRoleMutation,
} from "@/services/queries/super-admin";
import type { StaffAccount } from "@/types/admin";

function safeFormatDate(value?: string | null, pattern = "MMM d, yyyy") {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, pattern);
}

function safeFormatRelative(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return formatDistanceToNow(d, { addSuffix: true });
}

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "U") + (parts[1]?.[0] || "");
}

type PendingGovernanceAction =
  | {
      type: "role";
      member: StaffAccount;
      targetRole: "user" | "admin" | "superAdmin";
      title: string;
      description: string;
      confirmLabel: string;
      destructive?: boolean;
    }
  | {
      type: "status";
      member: StaffAccount;
      targetDisabled: boolean;
      title: string;
      description: string;
      confirmLabel: string;
      destructive?: boolean;
    };

export default function SuperAdminPage() {
  const { user: currentUser } = useAuth();

  // Staff governance filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "superAdmin" | "admin">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "disabled"
  >("all");

  // Promote / Add Admin dialog
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoteIdentifier, setPromoteIdentifier] = useState("");
  const [promoteRole, setPromoteRole] = useState<"admin" | "superAdmin">(
    "admin"
  );

  // Governance action confirmation dialog
  const [pendingAction, setPendingAction] =
    useState<PendingGovernanceAction | null>(null);

  const {
    data: overviewResponse,
    isPending:  isOverviewLoading,
  } = useSuperAdminOverviewQuery();

  const {
    data: staffResponse,
   isPending:  isStaffLoading,
  } = useAdminListQuery();

  const refreshMutation = useRefreshSuperAdminMutation();
  const updateRoleMutation = useUpdateUserRoleMutation();
  const toggleStatusMutation = useToggleUserStatusMutation();

  const overview = overviewResponse?.success ? overviewResponse.data : null;
  const staffPayload = staffResponse?.success ? staffResponse.data : null;
  const staff = useMemo(() => staffPayload?.staff ?? [], [staffPayload]);

  const staffSummary = useMemo(() => {
    if (staffPayload?.summary) return staffPayload.summary;
    return {
      total: staff.length,
      superAdmins: staff.filter((m) => m.role === "superAdmin").length,
      admins: staff.filter((m) => m.role === "admin").length,
      active: staff.filter((m) => !m.isDisabled).length,
      disabled: staff.filter((m) => m.isDisabled).length,
    };
  }, [staffPayload, staff]);

  const filteredStaff = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return staff.filter((member) => {
      if (roleFilter !== "all" && member.role !== roleFilter) return false;
      if (statusFilter === "active" && member.isDisabled) return false;
      if (statusFilter === "disabled" && !member.isDisabled) return false;
      if (!query) return true;
      return (
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member._id.toLowerCase().includes(query)
      );
    });
  }, [staff, roleFilter, statusFilter, searchTerm]);

  const hasActiveFilters =
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    Boolean(searchTerm.trim());

  const lastSyncedRelative = safeFormatRelative(
    overview?.meta?.generatedAt || staffPayload?.meta?.generatedAt
  );

  const memoryUsagePercent =
    overview?.memory?.heapTotalMB && overview.memory.heapTotalMB > 0
      ? Math.round(
          (overview.memory.heapUsedMB / overview.memory.heapTotalMB) * 100
        )
      : 0;

  if (
    (isOverviewLoading && !overview) ||
    (isStaffLoading && !staffPayload)
  ) {
    return <SuperAdminDashboardSkeleton />;
  }

  const handleRefresh = async () => {
    try {
      const res = await refreshMutation.mutateAsync();
      if (res.overviewRes.success && res.staffRes.success) {
        toast.success("Super Admin telemetry and staff list refreshed");
      } else {
        toast.warning("Refreshed with partial warnings");
      }
    } catch {
      toast.error("Failed to refresh Super Admin telemetry");
    }
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = promoteIdentifier.trim();
    if (!cleaned) {
      toast.error("Please enter a User ID or email address");
      return;
    }

    const res = await updateRoleMutation.mutateAsync({
      identifier: cleaned,
      role: promoteRole,
    });
    if (res.success) {
      setPromoteDialogOpen(false);
      setPromoteIdentifier("");
      setPromoteRole("admin");
    }
  };

  const requestRoleChange = (
    member: StaffAccount,
    targetRole: "user" | "admin" | "superAdmin"
  ) => {
    const labelMap = {
      user: "Standard User",
      admin: "Administrator",
      superAdmin: "Super Admin",
    };

    setPendingAction({
      type: "role",
      member,
      targetRole,
      title: `Change Role to ${labelMap[targetRole]}?`,
      description:
        targetRole === "user"
          ? `${member.name} (${member.email}) will immediately lose access to the Admin Portal.`
          : targetRole === "superAdmin"
            ? `${member.name} (${member.email}) will receive full Super Admin access, including Scheduler, Database Backups, and role governance.`
            : `${member.name} (${member.email}) will be changed from Super Admin to regular Administrator and lose access to SuperAdmin-only tools.`,
      confirmLabel: `Set as ${labelMap[targetRole]}`,
      destructive: targetRole === "user",
    });
  };

  const requestStatusToggle = (member: StaffAccount) => {
    const nextDisabled = !member.isDisabled;
    setPendingAction({
      type: "status",
      member,
      targetDisabled: nextDisabled,
      title: nextDisabled ? "Suspend Staff Account?" : "Reactivate Staff Account?",
      description: nextDisabled
        ? `${member.name} (${member.email}) will be suspended and all active sessions will be revoked immediately.`
        : `${member.name} (${member.email}) will regain portal access.`,
      confirmLabel: nextDisabled ? "Suspend Account" : "Reactivate Account",
      destructive: nextDisabled,
    });
  };

  const executeConfirmedAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.type === "role") {
      await updateRoleMutation.mutateAsync({
        userId: pendingAction.member._id,
        role: pendingAction.targetRole,
      });
    } else {
      await toggleStatusMutation.mutateAsync({
        userId: pendingAction.member._id,
        isDisabled: pendingAction.targetDisabled,
      });
    }
    setPendingAction(null);
  };

  const totalAccounts = overview?.counts?.totalUsers ?? 0;
  const roleDistributionTiles = [
    {
      label: "Standard Users",
      count: overview?.counts?.users ?? 0,
      note: "Customer accounts",
      accent: "text-foreground",
    },
    {
      label: "Administrators",
      count: overview?.counts?.admins ?? 0,
      note: "Portal managers",
      accent: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Super Admins",
      count: overview?.counts?.superAdmins ?? 0,
      note: "Root operators",
      accent: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Suspended",
      count: overview?.counts?.disabledUsers ?? 0,
      note: "Disabled accounts",
      accent: "text-rose-600 dark:text-rose-400",
    },
  ];

  const schedulerService = overview?.services?.scheduler;
  const backupService = overview?.services?.backup;
  const aiApiService = overview?.services?.aiApi;

  const renderStaffActionsMenu = (member: StaffAccount) => {
    const isSelf = currentUser?.userId === member._id;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Manage ${member.name}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Access Governance</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {member.role !== "superAdmin" && (
            <DropdownMenuItem
              onClick={() => requestRoleChange(member, "superAdmin")}
              disabled={updateRoleMutation.isPending}
              className="gap-2"
            >
              <ShieldAlert className="h-4 w-4 text-indigo-500" />
              Promote to Super Admin
            </DropdownMenuItem>
          )}

          {member.role === "superAdmin" && !isSelf && (
            <DropdownMenuItem
              onClick={() => requestRoleChange(member, "admin")}
              disabled={updateRoleMutation.isPending}
              className="gap-2"
            >
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              Demote to Admin
            </DropdownMenuItem>
          )}

          {!isSelf && (
            <DropdownMenuItem
              onClick={() => requestRoleChange(member, "user")}
              disabled={updateRoleMutation.isPending}
              className="gap-2 text-amber-600 dark:text-amber-400"
            >
              <UserX className="h-4 w-4" />
              Revoke Admin Role
            </DropdownMenuItem>
          )}

          {isSelf && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Self-demotion &amp; suspension disabled
            </div>
          )}

          {!isSelf && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => requestStatusToggle(member)}
                disabled={toggleStatusMutation.isPending}
                className={cn(
                  "gap-2",
                  member.isDisabled
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
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
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Super Admin Hub
              </h1>

              <Badge
                variant="outline"
                className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium gap-1"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Root Control
              </Badge>

              {overview?.environment && (
                <Badge
                  variant="secondary"
                  className="font-mono text-[11px] uppercase"
                >
                  {overview.environment}
                </Badge>
              )}

              {lastSyncedRelative && (
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Synced {lastSyncedRelative}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Infrastructure telemetry, SuperAdmin-only system services, and
              administrative role governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshMutation.isPending}
              className="gap-1.5"
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  refreshMutation.isPending && "animate-spin"
                )}
              />
              Refresh
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setPromoteDialogOpen(true)}
              className="gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Administrator
            </Button>
          </div>
        </div>
      </div>

      {/* API Error Alert */}
      {((overviewResponse && !overviewResponse.success) ||
        (staffResponse && !staffResponse.success)) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load Super Admin telemetry</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>
              {(overviewResponse && !overviewResponse.success
                ? overviewResponse.message
                : staffResponse && !staffResponse.success
                  ? staffResponse.message
                  : "Request failed") || "Request failed"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Runtime &amp; Uptime
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight tabular-nums">
                {overview?.uptimeHuman || "—"}
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px]"
              >
                Online
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 truncate">
              {overview?.nodeVersion || "Node"} &middot;{" "}
              {overview?.platform || "server"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Database &amp; Sessions
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold capitalize tracking-tight">
                {overview?.database?.status || "Healthy"}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px]",
                  overview?.database?.status === "disconnected"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                )}
              >
                {overview?.database?.name || "mongodb"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums truncate">
              {(overview?.counts?.activeSessions ?? 0).toLocaleString()} live
              sessions &middot;{" "}
              {(overview?.counts?.activeAppUsers ?? 0).toLocaleString()} active
              app users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Memory Allocation
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xl font-bold tabular-nums">
                {overview?.memory?.heapUsedMB ?? 0} MB
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {memoryUsagePercent}% of {overview?.memory?.heapTotalMB ?? 0} MB
              </span>
            </div>
            <Progress value={memoryUsagePercent} className="h-1.5 mt-2" />
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
              RSS {overview?.memory?.rssMB ?? 0} MB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Platform Workload
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {(overview?.counts?.totalProcesses ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              {totalAccounts.toLocaleString()} web accounts &middot;{" "}
              {(overview?.counts?.totalAppUsers ?? 0).toLocaleString()} app
              users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zero-Tab Operational Row: Account Distribution + SuperAdmin Services */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-7 flex flex-col justify-between">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">
                  User Role &amp; Account Distribution
                </CardTitle>
                <CardDescription>
                  Account tiers and moderation state across the platform
                </CardDescription>
              </div>
              <Badge variant="secondary" className="tabular-nums text-xs">
                {totalAccounts.toLocaleString()} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {roleDistributionTiles.map((tile) => {
                const pct =
                  totalAccounts > 0
                    ? Math.round((tile.count / totalAccounts) * 1000) / 10
                    : 0;
                return (
                  <div
                    key={tile.label}
                    className="rounded-lg border bg-muted/30 p-3.5 space-y-1"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {tile.label}
                    </p>
                    <p
                      className={cn(
                        "text-2xl font-bold tabular-nums",
                        tile.accent
                      )}
                    >
                      {tile.count.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {pct}% &middot; {tile.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              SuperAdmin Services &amp; Controls
            </CardTitle>
            <CardDescription>
              Protected operational tools restricted to Super Admin accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Link
              href="/admin/backup"
              className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Database className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      Database Backup
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px]",
                        backupService?.isRunning
                          ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          : backupService?.isConfigured
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      )}
                    >
                      {backupService?.isRunning
                        ? "Running"
                        : backupService?.isConfigured
                          ? "Configured"
                          : "Unconfigured"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {backupService?.lastBackup
                      ? `Last: ${safeFormatRelative(
                          backupService.lastBackup.timestamp
                        )} (${backupService.lastBackup.totalDocuments.toLocaleString()} docs)`
                      : "Target cluster replication & history"}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>

            <Link
              href="/admin/scheduler"
              className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">Task Scheduler</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px]",
                        schedulerService?.isRunning
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                      )}
                    >
                      {schedulerService?.isRunning ? "Running" : "Stopped"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {schedulerService?.nextMaintenanceRun
                      ? `Next maintenance: ${safeFormatDate(
                          schedulerService.nextMaintenanceRun,
                          "MMM d, h:mm a"
                        )}`
                      : "Daily maintenance & reconciliation cron"}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>

            <Link
              href="/admin/ai-api"
              className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <KeyRound className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      AI API Keys (Gemini)
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px]",
                        (aiApiService?.activeKeys ?? 0) > 0
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      )}
                    >
                      {(aiApiService?.activeKeys ?? 0) > 0
                        ? `${aiApiService?.activeKeys} Active`
                        : "No Active Key"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {aiApiService?.primaryKeyName
                      ? `Primary: ${aiApiService.primaryKeyName} (${aiApiService.totalKeys} total)`
                      : (aiApiService?.totalKeys ?? 0) > 0
                        ? `${aiApiService?.totalKeys} configured key(s), none active`
                        : "Manage encrypted Gemini API keys"}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                href="/admin/manage-pricing"
                className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs font-medium hover:bg-muted/50 transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  Pricing &amp; Plans
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs font-medium hover:bg-muted/50 transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  User Directory
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff & Access Governance (Direct On-Page Section, Zero Tabs) */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Staff &amp; Access Governance
                </CardTitle>
                <Badge variant="secondary" className="tabular-nums text-xs">
                  {staffSummary.superAdmins} Super Admin &middot;{" "}
                  {staffSummary.admins} Admin
                  {staffSummary.disabled > 0
                    ? ` · ${staffSummary.disabled} Suspended`
                    : ""}
                </Badge>
              </div>
              <CardDescription>
                Manage portal administrators, promote privileged accounts, and
                suspend compromised access
              </CardDescription>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  {
                    key: "all" as const,
                    label: "All Staff",
                    count: staffSummary.total,
                  },
                  {
                    key: "superAdmin" as const,
                    label: "Super Admin",
                    count: staffSummary.superAdmins,
                  },
                  {
                    key: "admin" as const,
                    label: "Admin",
                    count: staffSummary.admins,
                  },
                ] as const
              ).map((pill) => {
                const active = roleFilter === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setRoleFilter(pill.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={cn(
                        "tabular-nums text-[11px]",
                        active ? "opacity-80" : "text-muted-foreground"
                      )}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 lg:max-w-xl lg:justify-end">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter staff by name, email, or ID..."
                  className="pl-9 pr-8 h-9"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear staff search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Select
                value={statusFilter}
                onValueChange={(val) =>
                  setStatusFilter(val as "all" | "active" | "disabled")
                }
              >
                <SelectTrigger className="w-full sm:w-[155px] h-9">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Status ({staffSummary.total})
                  </SelectItem>
                  <SelectItem value="active">
                    Active ({staffSummary.active})
                  </SelectItem>
                  <SelectItem value="disabled">
                    Suspended ({staffSummary.disabled})
                  </SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                  }}
                  className="h-9 px-2.5 text-xs gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
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
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      {hasActiveFilters
                        ? "No staff accounts match your current filters."
                        : "No administrator accounts found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((member) => {
                    const isSelf = currentUser?.userId === member._id;
                    return (
                      <TableRow key={member._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                              <AvatarImage
                                src={member.avatar || undefined}
                                alt={member.name}
                              />
                              <AvatarFallback className="text-xs font-semibold">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 font-medium">
                                <span className="truncate">{member.name}</span>
                                {isSelf && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] py-0 px-1.5"
                                  >
                                    You
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {member.role === "superAdmin" ? (
                            <Badge
                              variant="outline"
                              className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 gap-1 text-xs"
                            >
                              <ShieldAlert className="h-3 w-3" />
                              Super Admin
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 gap-1 text-xs"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {member.isDisabled ? (
                              <Badge
                                variant="outline"
                                className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs"
                              >
                                Suspended
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {safeFormatDate(member.createdAt)}
                        </TableCell>

                        <TableCell className="text-right">
                          {renderStaffActionsMenu(member)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y rounded-lg border">
            {filteredStaff.length === 0 ? (
              <div className="py-10 px-4 text-center text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "No staff accounts match your current filters."
                  : "No administrator accounts found."}
              </div>
            ) : (
              filteredStaff.map((member) => {
                const isSelf = currentUser?.userId === member._id;
                return (
                  <div key={member._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 border shrink-0">
                          <AvatarImage
                            src={member.avatar || undefined}
                            alt={member.name}
                          />
                          <AvatarFallback className="text-xs font-semibold">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-medium text-sm">
                            <span className="truncate">{member.name}</span>
                            {isSelf && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5"
                              >
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      {renderStaffActionsMenu(member)}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {member.role === "superAdmin" ? (
                          <Badge
                            variant="outline"
                            className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 gap-1 text-xs"
                          >
                            <ShieldAlert className="h-3 w-3" />
                            Super Admin
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 gap-1 text-xs"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                        {member.isDisabled ? (
                          <Badge
                            variant="outline"
                            className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs"
                          >
                            Suspended
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs"
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Added {safeFormatDate(member.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Administrator Dialog (Accepts Email or User ID) */}
      <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Administrative Access</DialogTitle>
            <DialogDescription>
              Promote an existing registered account using their email address
              or MongoDB User ID.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePromoteSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promote-identifier">
                Email Address or User ID
              </Label>
              <Input
                id="promote-identifier"
                placeholder="e.g. admin@genmeta.app or 64d9f1e07b8a1c0023e4a9bc"
                value={promoteIdentifier}
                onChange={(e) => setPromoteIdentifier(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Need to look up an account? Browse the{" "}
                <Link href="/admin/users" className="text-primary underline">
                  Users Directory
                </Link>
                .
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promote-role">Assigned Role</Label>
              <Select
                value={promoteRole}
                onValueChange={(val) =>
                  setPromoteRole(val as "admin" | "superAdmin")
                }
              >
                <SelectTrigger id="promote-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    Administrator (Standard Admin Portal)
                  </SelectItem>
                  <SelectItem value="superAdmin">
                    Super Admin (Full Control + Scheduler &amp; Backup)
                  </SelectItem>
                </SelectContent>
              </Select>
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
                {updateRoleMutation.isPending ? "Updating..." : "Grant Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Role / Status Change AlertDialog */}
      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirmedAction}
              className={cn(
                pendingAction?.destructive &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              {pendingAction?.confirmLabel || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
