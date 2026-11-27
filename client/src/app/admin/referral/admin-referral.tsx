"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowUpDown,
  Check,
  Clock,
  Copy,
  Eye,
  Filter,
  RefreshCw,
  Search,
  TrendingUp,
  User2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAllReferralQuery,
  useRefreshReferralsMutation,
} from "@/services/queries/admin-dashboard";
import type { GetAllReferralsParams, ReferralRes } from "@/types/admin";
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
import { Input } from "@/components/ui/input";
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
import { ReferralTableSkeleton } from "./referral-skeleton";

type StatusFilter = NonNullable<GetAllReferralsParams["status"]>;
type SortField = NonNullable<GetAllReferralsParams["sortBy"]>;
type SortOrder = NonNullable<GetAllReferralsParams["sortOrder"]>;

function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return parts || "U";
}

function formatCurrency(amount: number): string {
  return `৳${Number(amount || 0).toLocaleString()}`;
}

function formatRelativeTime(value?: string | null): string {
  if (!value) return "Just now";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Just now";
  return formatDistanceToNow(parsed, { addSuffix: true });
}

export function AdminReferralDashboard() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortField>("pending");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, debouncedSearch]);

  const queryParams: GetAllReferralsParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    status,
    sortBy,
    sortOrder,
  };

  const {
    data: res,
    isPending: isLoading,
    isFetching,
    isError,
    refetch,
  } = useAllReferralQuery(queryParams);
  const refreshMutation = useRefreshReferralsMutation();

  const data = res?.success ? res.data : undefined;
  const referrals: ReferralRes[] = data?.referrals ?? [];
  const summary = data?.summary ?? {
    totalReferrers: 0,
    totalReferredUsers: 0,
    totalEarned: 0,
    totalAvailable: 0,
    pendingWithdrawalsCount: 0,
    pendingWithdrawalsAmount: 0,
    completedWithdrawalsCount: 0,
    completedWithdrawalsAmount: 0,
    referrersWithPending: 0,
  };

  const pagination = data?.pagination ?? {
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    totalPages: data?.totalPages ?? 0,
  };

  const generatedAt = data?.meta?.generatedAt ?? null;
  const hasError = isError || (res !== undefined && !res.success);
  const errorMessage =
    res && !res.success
      ? res.message || "Failed to load referral data"
      : "Failed to connect to the server";

  const hasActiveFilters =
    debouncedSearch !== "" ||
    status !== "all" ||
    sortBy !== "pending" ||
    sortOrder !== "desc";

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      toast.success(`${label} copied`);
      setTimeout(() => {
        setCopiedCode((prev) => (prev === text ? null : prev));
      }, 1800);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const handleRefresh = async () => {
    try {
      const refreshed = await refreshMutation.mutateAsync(queryParams);
      if (!refreshed.success) {
        toast.error(refreshed.message || "Failed to refresh referrals");
        return;
      }
      toast.success("Referrals synced with latest balances & payouts");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh referrals",
      );
    }
  };

  const handleStatusChange = (val: string) => {
    setStatus(val as StatusFilter);
    setPage(1);
  };

  const handleSortByChange = (val: string) => {
    setSortBy(val as SortField);
    setPage(1);
  };

  const handleToggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setPage(1);
  };

  const handleLimitChange = (val: string) => {
    const next = Number.parseInt(val, 10);
    if (Number.isFinite(next) && next > 0) {
      setLimit(next);
      setPage(1);
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatus("all");
    setSortBy("pending");
    setSortOrder("desc");
    setPage(1);
  };

  const startItem =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Referral Management
            </h1>
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-0.5 rounded-full border bg-muted/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Synced {formatRelativeTime(generatedAt)}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor affiliate performance, wallet balances, and payout requests.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
            className="gap-2"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                refreshMutation.isPending && "animate-spin",
              )}
            />
            <span>{refreshMutation.isPending ? "Syncing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* 4 Global KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Referrers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums">
                  {summary.totalReferrers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.totalReferredUsers.toLocaleString()} referred users
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Earned
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3.5 w-36" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums">
                  {formatCurrency(summary.totalEarned)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(summary.completedWithdrawalsAmount)} paid out
                  ({summary.completedWithdrawalsCount})
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Available Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(summary.totalAvailable)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across active referrer wallets
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card
          className={cn(
            summary.pendingWithdrawalsCount > 0 &&
              "border-amber-500/40 bg-amber-500/5",
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pending Withdrawals
            </CardTitle>
            <Clock
              className={cn(
                "h-4 w-4",
                summary.pendingWithdrawalsCount > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            />
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3.5 w-40" />
              </div>
            ) : (
              <div className="flex items-end justify-between gap-2">
                <div>
                  <div
                    className={cn(
                      "text-2xl font-bold tabular-nums",
                      summary.pendingWithdrawalsCount > 0 &&
                        "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {summary.pendingWithdrawalsCount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(summary.pendingWithdrawalsAmount)} across{" "}
                    {summary.referrersWithPending} user
                    {summary.referrersWithPending === 1 ? "" : "s"}
                  </p>
                </div>
                {summary.pendingWithdrawalsCount > 0 && (
                  <Button
                    variant={status === "pending" ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2.5 text-xs shrink-0"
                    onClick={() =>
                      handleStatusChange(
                        status === "pending" ? "all" : "pending",
                      )
                    }
                  >
                    {status === "pending" ? "Show All" : "Review"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Directory Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">
              Referrer Directory
            </CardTitle>
            <CardDescription>
              Review affiliate earnings, copy referral codes, and process
              withdrawal requests.
            </CardDescription>
          </div>
          {isFetching && !isLoading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Updating...
            </span>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters Toolbar */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, email, referral code, or payout account..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Referrers</SelectItem>
                  <SelectItem value="pending">Pending Payouts</SelectItem>
                  <SelectItem value="has_balance">Has Balance</SelectItem>
                  <SelectItem value="has_referrals">Has Referrals</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="w-[155px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending First</SelectItem>
                  <SelectItem value="balance">Available Balance</SelectItem>
                  <SelectItem value="earned">Total Earned</SelectItem>
                  <SelectItem value="referred">Most Referrals</SelectItem>
                  <SelectItem value="recent">Newest Joined</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleSortOrder}
                className="h-9 gap-1.5"
                title={`Sort order: ${sortOrder === "desc" ? "Descending" : "Ascending"}`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="text-xs uppercase">{sortOrder}</span>
              </Button>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 text-xs text-muted-foreground"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Content State */}
          {isLoading || (isFetching && referrals.length === 0 && !hasError) ? (
            <ReferralTableSkeleton rows={limit} />
          ) : hasError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">
                  Unable to load referrals
                </p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : referrals.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 px-4 text-center space-y-3">
              <Users className="h-9 w-9 text-muted-foreground/50 mx-auto" />
              <div className="space-y-1">
                <p className="font-medium">No referrers found</p>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "No referral records match your active search or filters."
                    : "Referral accounts will appear here once users generate a code."}
                </p>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Referrer</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead className="text-right">Referrals</TableHead>
                      <TableHead className="text-right">Total Earned</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">
                        Pending Payouts
                      </TableHead>
                      <TableHead>Payout Account</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((row) => (
                      <TableRow
                        key={row._id || row.referrer._id}
                        className="hover:bg-muted/40"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarImage
                                src={row.referrer.avatar || undefined}
                                alt={row.referrer.name}
                              />
                              <AvatarFallback className="text-xs font-medium">
                                {getInitials(row.referrer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/referral/${encodeURIComponent(row.referrer._id)}`}
                                className="font-medium text-sm hover:underline truncate block"
                              >
                                {row.referrer.name}
                              </Link>
                              <p className="text-xs text-muted-foreground truncate">
                                {row.referrer.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <code className="bg-muted px-2 py-0.5 rounded border text-xs font-mono">
                              {row.referralCode}
                            </code>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleCopy(row.referralCode, "Referral code")
                              }
                              className="h-7 w-7"
                              aria-label="Copy referral code"
                            >
                              {copiedCode === row.referralCode ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <Badge variant="secondary" className="tabular-nums">
                              {row.referredCount}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                              {row.convertedCount} converted
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(row.totalEarned)}
                        </TableCell>

                        <TableCell
                          className={cn(
                            "text-right font-semibold tabular-nums",
                            row.availableBalance > 0 &&
                              "text-emerald-600 dark:text-emerald-400",
                          )}
                        >
                          {formatCurrency(row.availableBalance)}
                        </TableCell>

                        <TableCell className="text-right">
                          {row.pendingWithdrawals > 0 ? (
                            <Badge
                              variant="outline"
                              className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 tabular-nums"
                            >
                              {row.pendingWithdrawals} &middot;{" "}
                              {formatCurrency(row.pendingWithdrawalAmount)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {row.withdrawAccount ? (
                            <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                              {row.withdrawAccount}
                            </code>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Not set
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" asChild className="h-8 gap-1.5">
                              <Link
                                href={`/admin/referral/${encodeURIComponent(row.referrer._id)}`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Manage</span>
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8"
                              title="View user profile"
                            >
                              <Link
                                href={`/admin/users/${encodeURIComponent(row.referrer._id)}`}
                              >
                                <User2 className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y rounded-lg border">
                {referrals.map((row) => (
                  <div
                    key={row._id || row.referrer._id}
                    className="p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage
                            src={row.referrer.avatar || undefined}
                            alt={row.referrer.name}
                          />
                          <AvatarFallback className="text-xs font-medium">
                            {getInitials(row.referrer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {row.referrer.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {row.referrer.email}
                          </p>
                        </div>
                      </div>
                      {row.pendingWithdrawals > 0 && (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] tabular-nums"
                        >
                          {row.pendingWithdrawals} Pending
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
                      <span className="text-xs text-muted-foreground">
                        Code
                      </span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono font-medium">
                          {row.referralCode}
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(row.referralCode, "Referral code")
                          }
                          aria-label="Copy referral code"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedCode === row.referralCode ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md border p-2">
                        <p className="text-muted-foreground">Referrals</p>
                        <p className="font-semibold mt-0.5 tabular-nums">
                          {row.referredCount}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({row.convertedCount} paid)
                          </span>
                        </p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-muted-foreground">Total Earned</p>
                        <p className="font-semibold mt-0.5 tabular-nums">
                          {formatCurrency(row.totalEarned)}
                        </p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-muted-foreground">Available</p>
                        <p
                          className={cn(
                            "font-semibold mt-0.5 tabular-nums",
                            row.availableBalance > 0 &&
                              "text-emerald-600 dark:text-emerald-400",
                          )}
                        >
                          {formatCurrency(row.availableBalance)}
                        </p>
                      </div>
                      <div className="rounded-md border p-2">
                        <p className="text-muted-foreground">Payout Account</p>
                        <p className="font-mono font-medium mt-0.5 truncate">
                          {row.withdrawAccount || "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1 h-8 gap-1.5"
                      >
                        <Link
                          href={`/admin/referral/${encodeURIComponent(row.referrer._id)}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Manage Referrals</span>
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                        className="h-8 w-8 shrink-0"
                        title="View user profile"
                      >
                        <Link
                          href={`/admin/users/${encodeURIComponent(row.referrer._id)}`}
                        >
                          <User2 className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Rows</span>
                <Select value={String(limit)} onValueChange={handleLimitChange}>
                  <SelectTrigger className="h-8 w-[68px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="tabular-nums">
                Showing {startItem}–{endItem} of{" "}
                {pagination.total.toLocaleString()} referrers
              </span>
            </div>

            <PaginationView
              currentPage={pagination.page}
              totalPages={Math.max(1, pagination.totalPages)}
              handlePageChange={setPage}
              isLoading={isFetching}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
