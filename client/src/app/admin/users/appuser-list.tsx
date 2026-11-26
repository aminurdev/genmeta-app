"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CheckCircle2,
  Download,
  Edit,
  Eye,
  Filter,
  Infinity as InfinityIcon,
  KeyRound,
  Laptop,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  User2,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAddCreditsMutation,
  useAllUsersQuery,
  useDeleteAppUserMutation,
  useResetDeviceMutation,
  useUpdateAppUserStatusMutation,
} from "@/services/queries/admin-dashboard";
import type { AppUsers } from "@/types/admin";
import {
  UpgradePlanDialog,
  type UpgradePlanTargetUser,
} from "@/components/admin/users/upgrade-plan-dialog";
import PaginationView from "@/components/pagination-view";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface AppUserListProps {
  onOpenCreateDialog?: () => void;
  onQueryParamsChange?: (queryParams: string) => void;
}

function getInitials(name?: string): string {
  if (!name) return "U";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return initials || "U";
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, "MMM d, yyyy");
}

function PlanBadge({ type, name }: { type?: string; name?: string }) {
  const normalized = (type || "free").toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize text-[11px] font-medium",
        normalized === "subscription" &&
          "text-purple-600 dark:text-purple-400 border-purple-500/25 bg-purple-500/10",
        normalized === "credit" &&
          "text-amber-600 dark:text-amber-400 border-amber-500/25 bg-amber-500/10",
        normalized === "free" &&
          "text-muted-foreground border-border bg-muted/50"
      )}
    >
      {name || normalized}
    </Badge>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const isSuspended = status?.toLowerCase() === "suspended";
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize text-[11px] font-medium",
        isSuspended
          ? "text-destructive border-destructive/25 bg-destructive/10"
          : "text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
      )}
    >
      {status || "active"}
    </Badge>
  );
}

function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function TableLoadingSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <>
      <div className="hidden lg:block rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>User</TableHead>
              <TableHead>Plan &amp; Quota</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Devices &amp; Usage</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="flex items-center gap-3 min-w-[210px]">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-14" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="lg:hidden divide-y rounded-lg border">
        {Array.from({ length: rowCount }).map((_, idx) => (
          <div key={idx} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function AppUserList({
  onOpenCreateDialog,
  onQueryParamsChange,
}: AppUserListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("all");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");

  // Modal & Action States
  const [upgradeTarget, setUpgradeTarget] =
    useState<UpgradePlanTargetUser | null>(null);
  const [creditTarget, setCreditTarget] = useState<AppUsers | null>(null);
  const [creditAmount, setCreditAmount] = useState("100");
  const [deleteTarget, setDeleteTarget] = useState<AppUsers | null>(null);
  const [busyAction, setBusyAction] = useState<{
    userId: string;
    action: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const queryParamsObj = new URLSearchParams();
  queryParamsObj.append("page", currentPage.toString());
  queryParamsObj.append("limit", limit.toString());
  if (debouncedSearchTerm.trim()) {
    queryParamsObj.append("search", debouncedSearchTerm.trim());
  }
  if (selectedPlanFilter !== "all") {
    queryParamsObj.append("plan", selectedPlanFilter);
  }
  if (selectedStatusFilter !== "all") {
    queryParamsObj.append("status", selectedStatusFilter);
  }
  if (selectedRoleFilter !== "all") {
    queryParamsObj.append("role", selectedRoleFilter);
  }
  const queryParamsString = queryParamsObj.toString();

  useEffect(() => {
    onQueryParamsChange?.(queryParamsString);
  }, [queryParamsString, onQueryParamsChange]);

  const { data, isLoading, isFetching, isRefetching, error, refetch } =
    useAllUsersQuery(queryParamsString);

  const deleteMutation = useDeleteAppUserMutation();
  const resetDeviceMutation = useResetDeviceMutation();
  const updateStatusMutation = useUpdateAppUserStatusMutation();
  const addCreditsMutation = useAddCreditsMutation();

  const responseData = data && data.success ? data.data : undefined;
  const appUsers = responseData?.users ?? [];
  const totalPages = Math.max(
    1,
    responseData?.totalPages ?? responseData?.pagination?.totalPages ?? 1
  );
  const totalUsers =
    responseData?.total ?? responseData?.pagination?.total ?? 0;

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedPlanFilter !== "all" ||
    selectedStatusFilter !== "all" ||
    selectedRoleFilter !== "all";

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedPlanFilter("all");
    setSelectedStatusFilter("all");
    setSelectedRoleFilter("all");
    setCurrentPage(1);
  };

  const handleResetDeviceId = async (userId: string) => {
    setBusyAction({ userId, action: "reset-device" });
    try {
      const res = await resetDeviceMutation.mutateAsync({ userId });
      if (res.success) {
        toast.success("Desktop devices reset successfully");
      } else {
        toast.error(res.message || "Failed to reset devices");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset devices");
    } finally {
      setBusyAction(null);
    }
  };

  const handleUpdateUserStatus = async (
    userId: string,
    mode: "suspend" | "reactivate"
  ) => {
    setBusyAction({ userId, action: mode });
    try {
      const res = await updateStatusMutation.mutateAsync({ userId, mode });
      if (res.success) {
        toast.success(
          res.message ||
            `App user ${mode === "suspend" ? "suspended" : "reactivated"}`
        );
      } else {
        toast.error(res.message || `Failed to ${mode} app user`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to ${mode} app user`
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteMutation.mutateAsync(
        deleteTarget.userId || deleteTarget.username
      );
      if (res.success) {
        toast.success("Desktop license profile deleted");
        setDeleteTarget(null);
      } else {
        toast.error(res.message || "Failed to delete app user");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete app user"
      );
    }
  };

  const handleAddCreditsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUserId = creditTarget?.userId || creditTarget?._id;
    if (!targetUserId) return;
    const credits = Number.parseInt(creditAmount, 10);
    if (!Number.isFinite(credits) || credits < 1) {
      toast.error("Enter a valid positive credit amount");
      return;
    }

    try {
      const res = await addCreditsMutation.mutateAsync({
        userId: targetUserId,
        credits,
      });
      if (res.success) {
        toast.success(res.message || `${credits} credits added`);
        setCreditTarget(null);
        setCreditAmount("100");
      } else {
        toast.error(res.message || "Failed to add credits");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add credits");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Role",
      "Verified",
      "Plan Type",
      "Plan Name",
      "Credits",
      "Status",
      "Devices",
      "Max Devices",
      "Processes",
      "Expires At",
      "Created At",
    ];
    const csvRows = [headers.map(escapeCsvCell).join(",")];

    appUsers.forEach((user) => {
      const devicesCount =
        user.devicesCount ?? user.allowedDevices?.length ?? 0;
      const creditsVal =
        user.plan?.type === "subscription" ? "Unlimited" : user.credit ?? 0;
      const row = [
        user.name || "",
        user.email || user.username,
        user.role || "user",
        user.isVerified ? "Yes" : "No",
        user.plan?.type || "free",
        user.plan?.name || "Free Tier",
        creditsVal,
        user.status,
        devicesCount,
        user.maxDevices || 2,
        user.totalProcess ?? 0,
        user.expiresAt || "",
        user.createdAt,
      ];
      csvRows.push(row.map(escapeCsvCell).join(","));
    });

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `app-users-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openUpgradeForUser = (appUser: AppUsers) => {
    setUpgradeTarget({
      userId: appUser.userId || appUser._id,
      username: appUser.username || appUser.email || "",
      name: appUser.name,
      email: appUser.email,
      status: appUser.status,
      isActive: appUser.isActive,
      maxDevices: appUser.maxDevices,
      credit: appUser.credit,
      expiresAt: appUser.expiresAt,
      plan: appUser.plan,
    });
  };

  const isBusy = (userId: string | null | undefined, action: string) =>
    Boolean(userId && busyAction?.userId === userId && busyAction?.action === action);

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              User Directory
            </CardTitle>
            <Badge variant="secondary" className="text-[11px] font-mono">
              {totalUsers.toLocaleString()} users
            </Badge>
          </div>
          <CardDescription>
            Inspect user profiles, manage desktop App, and manually assign
            or upgrade plans.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")}
            />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={appUsers.length === 0}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
          {onOpenCreateDialog && (
            <Button
              size="sm"
              onClick={onOpenCreateDialog}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create User</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter Toolbar */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <Select
              value={selectedPlanFilter}
              onValueChange={(value) => {
                setSelectedPlanFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Plan" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free Tier</SelectItem>
                <SelectItem value="credit">Credit Pack</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedStatusFilter}
              onValueChange={(value) => {
                setSelectedStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[135px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedRoleFilter}
              onValueChange={(value) => {
                setSelectedRoleFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superAdmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="col-span-2 sm:col-span-1 gap-1 text-xs text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Directory Body */}
        {isLoading ? (
          <TableLoadingSkeleton rowCount={limit} />
        ) : error && appUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg border border-dashed border-destructive/40">
            <XCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="text-base font-semibold">Failed to load users</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred."}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : appUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg border border-dashed">
            <User2 className="h-10 w-10 text-muted-foreground/60 mb-3" />
            <h3 className="text-base font-semibold">No matching users found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
              {hasActiveFilters
                ? "Try clearing your active search or filter criteria."
                : "Provision your first App User to initialize their desktop profile."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
              {onOpenCreateDialog && (
                <Button
                  size="sm"
                  onClick={onOpenCreateDialog}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Create App User
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "transition-opacity duration-150",
              isFetching && "opacity-60 pointer-events-none"
            )}
          >
            {/* Desktop Table */}
            <div className="hidden lg:block rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>User</TableHead>
                    <TableHead>Plan &amp; Quota</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Devices &amp; Usage</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appUsers.map((appUser) => {
                    const targetUserId = appUser.userId || appUser._id;
                    const profileSlug = encodeURIComponent(targetUserId);
                    const hasAppProfile = appUser.hasAppUser !== false;
                    const devicesCount =
                      appUser.devicesCount ?? appUser.allowedDevices?.length ?? 0;
                    const maxDevices = appUser.maxDevices ?? 2;

                    return (
                      <TableRow key={appUser._id}>
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <Avatar className="h-9 w-9 border shrink-0">
                              <AvatarImage
                                src={appUser.avatar || undefined}
                                alt={appUser.name || appUser.username}
                              />
                              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                {getInitials(appUser.name || appUser.username)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/admin/users/${profileSlug}`}
                                  className="font-medium text-sm hover:underline truncate max-w-[180px]"
                                >
                                  {appUser.name || appUser.username}
                                </Link>
                                {appUser.isVerified && (
                                  <CheckCircle2
                                    className="h-3.5 w-3.5 text-emerald-500 shrink-0"
                                    aria-label="Verified"
                                  />
                                )}
                                {appUser.role && appUser.role !== "user" && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 capitalize"
                                  >
                                    {appUser.role}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                                {appUser.email || appUser.username}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <PlanBadge
                                type={appUser.plan?.type}
                                name={appUser.plan?.name}
                              />
                              {appUser.isExpired && (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  Expired
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {appUser.plan?.type === "subscription" ? (
                                <span className="inline-flex items-center gap-1 text-foreground font-medium">
                                  <InfinityIcon className="h-3.5 w-3.5 text-primary" />
                                  Unlimited
                                </span>
                              ) : (
                                <span className="font-mono">
                                  {appUser.credit ?? 0} credits
                                </span>
                              )}
                              {appUser.expiresAt && (
                                <span>· exp {formatDate(appUser.expiresAt)}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={appUser.status} />
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-mono">
                                {devicesCount} / {maxDevices}
                              </span>
                            </div>
                            <p className="text-muted-foreground">
                              {(appUser.totalProcess ?? 0).toLocaleString()}{" "}
                              processed
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          <div>{formatDate(appUser.createdAt)}</div>
                          {appUser.lastLoginAt && (
                            <div className="text-[11px]">
                              Login {formatDate(appUser.lastLoginAt)}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                              title="View full user profile"
                            >
                              <Link href={`/admin/users/${profileSlug}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View profile</span>
                              </Link>
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              onClick={() => openUpgradeForUser(appUser)}
                              title="Upgrade or change plan"
                            >
                              <Sparkles className="h-4 w-4" />
                              <span className="sr-only">Upgrade plan</span>
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/users/${profileSlug}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Full Profile
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openUpgradeForUser(appUser)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Upgrade / Change Plan
                                </DropdownMenuItem>

                                {hasAppProfile &&
                                  appUser.plan?.type !== "subscription" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setCreditTarget(appUser);
                                        setCreditAmount("100");
                                      }}
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Add Credits
                                    </DropdownMenuItem>
                                  )}

                                {hasAppProfile && (
                                  <>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleResetDeviceId(targetUserId)
                                      }
                                      disabled={isBusy(
                                        targetUserId,
                                        "reset-device"
                                      )}
                                    >
                                      {isBusy(targetUserId, "reset-device") ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Smartphone className="mr-2 h-4 w-4" />
                                      )}
                                      Reset All Devices
                                    </DropdownMenuItem>

                                    {appUser.status === "active" ? (
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() =>
                                          handleUpdateUserStatus(
                                            targetUserId,
                                            "suspend"
                                          )
                                        }
                                        disabled={isBusy(targetUserId, "suspend")}
                                      >
                                        {isBusy(targetUserId, "suspend") ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <ShieldAlert className="mr-2 h-4 w-4" />
                                        )}
                                        Suspend License
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        className="text-emerald-600"
                                        onClick={() =>
                                          handleUpdateUserStatus(
                                            targetUserId,
                                            "reactivate"
                                          )
                                        }
                                        disabled={isBusy(
                                          targetUserId,
                                          "reactivate"
                                        )}
                                      >
                                        {isBusy(targetUserId, "reactivate") ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <ShieldCheck className="mr-2 h-4 w-4" />
                                        )}
                                        Reactivate License
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}

                                {hasAppProfile && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => setDeleteTarget(appUser)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Desktop Profile
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile & Tablet Card List */}
            <div className="lg:hidden divide-y rounded-lg border">
              {appUsers.map((appUser) => {
                const targetUserId = appUser.userId || appUser._id;
                const profileSlug = encodeURIComponent(targetUserId);
                const hasAppProfile = appUser.hasAppUser !== false;
                const devicesCount =
                  appUser.devicesCount ?? appUser.allowedDevices?.length ?? 0;
                const maxDevices = appUser.maxDevices ?? 2;

                return (
                  <div key={appUser._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 border shrink-0">
                          <AvatarImage
                            src={appUser.avatar || undefined}
                            alt={appUser.name || appUser.username}
                          />
                          <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                            {getInitials(appUser.name || appUser.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/admin/users/${profileSlug}`}
                              className="font-medium text-sm hover:underline truncate"
                            >
                              {appUser.name || appUser.username}
                            </Link>
                            {appUser.isVerified && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {appUser.email || appUser.username}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={appUser.status} />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <PlanBadge
                          type={appUser.plan?.type}
                          name={appUser.plan?.name}
                        />
                        {appUser.isExpired && (
                          <Badge variant="destructive" className="text-[10px]">
                            Expired
                          </Badge>
                        )}
                        <span className="text-muted-foreground font-mono">
                          {appUser.plan?.type === "subscription"
                            ? "∞ Unlimited"
                            : `${appUser.credit ?? 0} cr`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="font-mono">
                          {devicesCount}/{maxDevices} devices
                        </span>
                        <span>
                          {(appUser.totalProcess ?? 0).toLocaleString()} proc
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1.5"
                      >
                        <Link href={`/admin/users/${profileSlug}`}>
                          <Eye className="h-3.5 w-3.5" />
                          Profile
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => openUpgradeForUser(appUser)}
                        className="flex-1 h-8 text-xs gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Upgrade
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {hasAppProfile &&
                            appUser.plan?.type !== "subscription" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setCreditTarget(appUser);
                                  setCreditAmount("100");
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Credits
                              </DropdownMenuItem>
                            )}
                          {hasAppProfile && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleResetDeviceId(targetUserId)}
                              >
                                <Smartphone className="mr-2 h-4 w-4" />
                                Reset Devices
                              </DropdownMenuItem>
                              {appUser.status === "active" ? (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    handleUpdateUserStatus(
                                      targetUserId,
                                      "suspend"
                                    )
                                  }
                                >
                                  <ShieldAlert className="mr-2 h-4 w-4" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-emerald-600"
                                  onClick={() =>
                                    handleUpdateUserStatus(
                                      targetUserId,
                                      "reactivate"
                                    )
                                  }
                                >
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  Reactivate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteTarget(appUser)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Desktop Profile
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Enhanced Pagination Footer */}
        <div className="pt-2 border-t flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3">
            <span className="text-xs sm:text-sm text-muted-foreground tabular-nums">
              Showing {appUsers.length > 0 ? (currentPage - 1) * limit + 1 : 0}–
              {Math.min(currentPage * limit, totalUsers)} of{" "}
              {totalUsers.toLocaleString()} users
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows</span>
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setCurrentPage(1);
                }}
                disabled={isFetching}
              >
                <SelectTrigger className="h-8 w-[76px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <PaginationView
            currentPage={currentPage}
            totalPages={totalPages}
            isLoading={isFetching}
            handlePageChange={(page) => {
              if (page >= 1 && page <= totalPages) {
                setCurrentPage(page);
              }
            }}
          />
        </div>
      </CardContent>

      {/* Reusable Plan Upgrade Modal */}
      <UpgradePlanDialog
        open={Boolean(upgradeTarget)}
        onOpenChange={(open) => {
          if (!open) setUpgradeTarget(null);
        }}
        user={upgradeTarget}
      />

      {/* Add Credits Modal */}
      <Dialog
        open={Boolean(creditTarget)}
        onOpenChange={(open) => {
          if (!open && !addCreditsMutation.isPending) setCreditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Add Credits
            </DialogTitle>
            <DialogDescription>
              Grant additional processing credits to{" "}
              <span className="font-medium text-foreground">
                {creditTarget?.name || creditTarget?.username}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCreditsSubmit} className="space-y-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="dir-credit-amount">Credit Amount</Label>
              <Input
                id="dir-credit-amount"
                type="number"
                min="1"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                required
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[50, 100, 500, 1000].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setCreditAmount(String(preset))}
                  >
                    +{preset}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreditTarget(null)}
                disabled={addCreditsMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addCreditsMutation.isPending}>
                {addCreditsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Credits"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Desktop Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the desktop App User profile, plan, and
              device bindings for{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.username}
              </span>
              . Their web account remains intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Profile"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
