"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  RefreshCw,
  Search,
  TrendingUp,
  User2,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  useReferralByUserIdQuery,
  useRefreshReferralByUserMutation,
  useUpdateWithdrawalMutation,
} from "@/services/queries/admin-dashboard";
import type { WithdrawHistory } from "@/types/admin";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ReferralDetailSkeleton } from "../referral-skeleton";

interface AdminUserReferralDashboardProps {
  userId: string;
}

type WithdrawalFilter = "all" | "pending" | "completed" | "rejected";
type ReferredUserFilter = "all" | "converted" | "registered";

const WITHDRAWALS_PER_PAGE = 8;
const USERS_PER_PAGE = 8;
const EARNINGS_PER_PAGE = 8;

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

function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateString?: string | null): string {
  if (!dateString) return "—";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(value?: string | null): string {
  if (!value) return "Just now";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Just now";
  return formatDistanceToNow(parsed, { addSuffix: true });
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400";
    case "rejected":
      return "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400";
    default:
      return "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400";
  }
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function AdminUserReferralDashboard({
  userId,
}: AdminUserReferralDashboardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Withdrawal section state
  const [withdrawalFilter, setWithdrawalFilter] =
    useState<WithdrawalFilter>("all");
  const [withdrawalPage, setWithdrawalPage] = useState(1);

  // Referred users section state
  const [referredFilter, setReferredFilter] =
    useState<ReferredUserFilter>("all");
  const [referredSearch, setReferredSearch] = useState("");
  const [referredPage, setReferredPage] = useState(1);

  // Earnings section state
  const [earningsPage, setEarningsPage] = useState(1);

  // Action dialog state
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawHistory | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null,
  );
  const [trxId, setTrxId] = useState("");
  const [notesInput, setNotesInput] = useState("");

  const {
    data: res,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useReferralByUserIdQuery(userId);
  const refreshMutation = useRefreshReferralByUserMutation(userId);
  const updateWithdrawalMutation = useUpdateWithdrawalMutation();

  const data = res?.success ? res.data : undefined;

  const filteredWithdrawals = useMemo(() => {
    const list = data?.withdrawHistory ?? [];
    if (withdrawalFilter === "all") return list;
    return list.filter((w) => w.status === withdrawalFilter);
  }, [data?.withdrawHistory, withdrawalFilter]);

  const filteredReferredUsers = useMemo(() => {
    const list = data?.referredUsers ?? [];
    const term = referredSearch.trim().toLowerCase();
    return list.filter((u) => {
      if (referredFilter === "converted" && !u.hasConverted) return false;
      if (referredFilter === "registered" && u.hasConverted) return false;
      if (term) {
        const nameMatch = String(u.name || "").toLowerCase().includes(term);
        const emailMatch = String(u.email || "").toLowerCase().includes(term);
        if (!nameMatch && !emailMatch) return false;
      }
      return true;
    });
  }, [data?.referredUsers, referredFilter, referredSearch]);

  const handleCopy = async (text: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`${label} copied`);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1800);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const handleRefresh = async () => {
    try {
      const refreshed = await refreshMutation.mutateAsync();
      if (!refreshed.success) {
        toast.error(refreshed.message || "Failed to refresh referral details");
        return;
      }
      toast.success("Referral details refreshed");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to refresh referral details",
      );
    }
  };

  const openWithdrawalModal = (
    withdrawal: WithdrawHistory,
    action: "approve" | "reject",
  ) => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
    setTrxId("");
    setNotesInput("");
  };

  const closeWithdrawalModal = () => {
    if (updateWithdrawalMutation.isPending) return;
    setSelectedWithdrawal(null);
    setActionType(null);
    setTrxId("");
    setNotesInput("");
  };

  const handleWithdrawalAction = async () => {
    if (!selectedWithdrawal || !actionType) return;

    const status = actionType === "approve" ? "completed" : "rejected";
    try {
      const result = await updateWithdrawalMutation.mutateAsync({
        userId,
        withdrawalId: selectedWithdrawal._id,
        status,
        trx: actionType === "approve" ? trxId.trim() : undefined,
        notes: notesInput.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.message || "Failed to update withdrawal");
        return;
      }

      toast.success(
        actionType === "approve"
          ? `Approved ${formatCurrency(selectedWithdrawal.amount)} payout`
          : `Rejected withdrawal and refunded ${formatCurrency(selectedWithdrawal.amount)} to balance`,
      );
      setSelectedWithdrawal(null);
      setActionType(null);
      setTrxId("");
      setNotesInput("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to process withdrawal",
      );
    }
  };

  if (isLoading) {
    return <ReferralDetailSkeleton />;
  }

  if (isError || !res?.success || !data) {
    const errMsg =
      res && !res.success
        ? res.message || "Referral record not found"
        : "Unable to load referral details";
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b">
          <Button variant="outline" size="icon" asChild className="h-9 w-9">
            <Link href="/admin/referral">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Referral Account</h1>
            <p className="text-xs text-muted-foreground font-mono">{userId}</p>
          </div>
        </div>
        <Card className="border-destructive/30">
          <CardContent className="py-12 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <div className="space-y-1">
              <p className="font-semibold text-lg">
                Could not load referral record
              </p>
              <p className="text-sm text-muted-foreground">{errMsg}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/referral">Back to Referrals</Link>
              </Button>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pagination slices
  const withdrawalTotalPages = Math.max(
    1,
    Math.ceil(filteredWithdrawals.length / WITHDRAWALS_PER_PAGE),
  );
  const safeWithdrawalPage = Math.min(withdrawalPage, withdrawalTotalPages);
  const visibleWithdrawals = filteredWithdrawals.slice(
    (safeWithdrawalPage - 1) * WITHDRAWALS_PER_PAGE,
    safeWithdrawalPage * WITHDRAWALS_PER_PAGE,
  );

  const usersTotalPages = Math.max(
    1,
    Math.ceil(filteredReferredUsers.length / USERS_PER_PAGE),
  );
  const safeUsersPage = Math.min(referredPage, usersTotalPages);
  const visibleReferredUsers = filteredReferredUsers.slice(
    (safeUsersPage - 1) * USERS_PER_PAGE,
    safeUsersPage * USERS_PER_PAGE,
  );

  const earningsTotalPages = Math.max(
    1,
    Math.ceil(data.earnedHistory.length / EARNINGS_PER_PAGE),
  );
  const safeEarningsPage = Math.min(earningsPage, earningsTotalPages);
  const visibleEarnings = data.earnedHistory.slice(
    (safeEarningsPage - 1) * EARNINGS_PER_PAGE,
    safeEarningsPage * EARNINGS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="h-9 w-9 shrink-0"
            aria-label="Back to referrals"
          >
            <Link href="/admin/referral">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                Referral Account
              </h1>
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-0.5 rounded-full border bg-muted/50">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Synced {formatRelativeTime(data.meta?.generatedAt)}</span>
              </div>
              {isFetching && (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Manage payouts, referred signups &amp; commission history on one
              page
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
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
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={`/admin/users/${encodeURIComponent(userId)}`}>
              <User2 className="h-4 w-4" />
              <span>User Profile</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Minimal Referrer Identity Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0 border">
            <AvatarImage
              src={data.referrer.avatar || undefined}
              alt={data.referrer.name}
            />
            <AvatarFallback className="text-sm font-semibold">
              {getInitials(data.referrer.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight truncate">
                {data.referrer.name}
              </h2>
              {data.referrer.isDisabled ? (
                <Badge variant="destructive" className="text-[11px] h-5">
                  Disabled
                </Badge>
              ) : data.referrer.isVerified ? (
                <Badge
                  variant="outline"
                  className="text-[11px] h-5 bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                >
                  Verified
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {data.referrer.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground shrink-0">
          <button
            type="button"
            onClick={() =>
              handleCopy(data.referralCode, "Referral code", "code")
            }
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border bg-muted/40 hover:bg-muted font-mono text-foreground transition-colors"
          >
            <span className="text-muted-foreground">Code:</span>
            <span className="font-semibold">{data.referralCode}</span>
            {copiedKey === "code" ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>

          {data.withdrawAccount ? (
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  data.withdrawAccount!,
                  "Payout account",
                  "account",
                )
              }
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border bg-muted/40 hover:bg-muted font-mono text-foreground transition-colors"
            >
              <span>bKash: {data.withdrawAccount}</span>
              {copiedKey === "account" ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span>No payout account</span>
          )}

          <span>&middot;</span>
          <span>
            Joined{" "}
            <strong className="font-medium text-foreground">
              {formatShortDate(data.referrer.createdAt || data.createdAt)}
            </strong>
          </span>
          <span>&middot;</span>
          <span className="tabular-nums">
            <strong className="font-medium text-foreground">
              {data.convertedCount}/{data.referralCount}
            </strong>{" "}
            converted ({data.conversionRate}%)
          </span>
        </div>
      </div>

      {/* 4 Interactive KPI Cards (click to filter / jump directly to sections) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => scrollToSection("withdrawals-section")}
          className="text-left w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Available Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(data.availableBalance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for withdrawal
              </p>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("earnings-section")}
          className="text-left w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Earned
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {formatCurrency(data.totalEarned)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {data.earnedHistory.length} commission event
                {data.earnedHistory.length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => {
            setWithdrawalFilter((prev) =>
              prev === "pending" ? "all" : "pending",
            );
            setWithdrawalPage(1);
            scrollToSection("withdrawals-section");
          }}
          className="text-left w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card
            className={cn(
              "h-full transition-colors hover:border-foreground/30",
              data.pendingWithdrawalsCount > 0 &&
                "border-amber-500/40 bg-amber-500/5",
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pending Payouts
              </CardTitle>
              <Clock
                className={cn(
                  "h-4 w-4",
                  data.pendingWithdrawalsCount > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground",
                )}
              />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  data.pendingWithdrawalsCount > 0 &&
                    "text-amber-600 dark:text-amber-400",
                )}
              >
                {data.pendingWithdrawalsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(data.pendingWithdrawalsAmount)} awaiting review
              </p>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => {
            setWithdrawalFilter((prev) =>
              prev === "completed" ? "all" : "completed",
            );
            setWithdrawalPage(1);
            scrollToSection("withdrawals-section");
          }}
          className="text-left w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Paid Out
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {formatCurrency(data.totalWithdrawn)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.completedWithdrawalsCount} completed &middot;{" "}
                {data.rejectedWithdrawalsCount} rejected
              </p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Section 1: Withdrawal Requests (Always Visible) */}
      <Card id="withdrawals-section" className="scroll-mt-4">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                Withdrawal Requests
              </CardTitle>
              <Badge variant="secondary" className="tabular-nums">
                {data.withdrawHistory.length}
              </Badge>
            </div>
            <CardDescription>
              Approve pending payouts with a transaction ID or reject to refund
              available balance.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                {
                  key: "all",
                  label: "All",
                  count: data.withdrawHistory.length,
                },
                {
                  key: "pending",
                  label: "Pending",
                  count: data.pendingWithdrawalsCount,
                },
                {
                  key: "completed",
                  label: "Completed",
                  count: data.completedWithdrawalsCount,
                },
                {
                  key: "rejected",
                  label: "Rejected",
                  count: data.rejectedWithdrawalsCount,
                },
              ] as const
            ).map((item) => {
              const active = withdrawalFilter === item.key;
              return (
                <Button
                  key={item.key}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  className="h-8 px-2.5 text-xs gap-1.5"
                  onClick={() => {
                    setWithdrawalFilter(item.key);
                    setWithdrawalPage(1);
                  }}
                >
                  <span>{item.label}</span>
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className={cn(
                      "h-4 px-1.5 text-[10px] tabular-nums",
                      active &&
                        "bg-background/20 text-inherit border-transparent",
                    )}
                  >
                    {item.count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {filteredWithdrawals.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
              <Clock className="h-9 w-9 mx-auto mb-2.5 text-muted-foreground/50" />
              <p className="text-sm font-medium">
                No {withdrawalFilter === "all" ? "" : withdrawalFilter}{" "}
                withdrawal requests found
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Amount</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transaction / Note</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Processed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleWithdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal._id}>
                        <TableCell className="font-semibold tabular-nums">
                          {formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                              {withdrawal.withdrawAccount}
                            </code>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                handleCopy(
                                  withdrawal.withdrawAccount,
                                  "Account",
                                  `wd-acc-${withdrawal._id}`,
                                )
                              }
                            >
                              {copiedKey === `wd-acc-${withdrawal._id}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              getStatusBadgeClass(withdrawal.status),
                            )}
                          >
                            {withdrawal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          <div className="space-y-0.5">
                            <p className="font-mono text-xs truncate">
                              {withdrawal.trx || "—"}
                            </p>
                            {withdrawal.notes && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {withdrawal.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(
                            withdrawal.requestedAt || withdrawal.createdAt,
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(withdrawal.issuedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {withdrawal.status === "pending" ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() =>
                                  openWithdrawalModal(withdrawal, "approve")
                                }
                                className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  openWithdrawalModal(withdrawal, "reject")
                                }
                                className="h-7 px-2.5 text-xs"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Processed
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y rounded-lg border">
                {visibleWithdrawals.map((withdrawal) => (
                  <div key={withdrawal._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-base tabular-nums">
                          {formatCurrency(withdrawal.amount)}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {withdrawal.withdrawAccount}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize",
                          getStatusBadgeClass(withdrawal.status),
                        )}
                      >
                        {withdrawal.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Requested</p>
                        <p className="mt-0.5">
                          {formatShortDate(
                            withdrawal.requestedAt || withdrawal.createdAt,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Processed</p>
                        <p className="mt-0.5">
                          {formatShortDate(withdrawal.issuedAt)}
                        </p>
                      </div>
                    </div>

                    {(withdrawal.trx || withdrawal.notes) && (
                      <div className="rounded-md bg-muted/40 p-2 text-xs space-y-1">
                        {withdrawal.trx && (
                          <p className="font-mono">TRX: {withdrawal.trx}</p>
                        )}
                        {withdrawal.notes && (
                          <p className="text-muted-foreground">
                            Note: {withdrawal.notes}
                          </p>
                        )}
                      </div>
                    )}

                    {withdrawal.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            openWithdrawalModal(withdrawal, "approve")
                          }
                          className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            openWithdrawalModal(withdrawal, "reject")
                          }
                          className="flex-1 h-8 text-xs"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredWithdrawals.length > WITHDRAWALS_PER_PAGE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Showing {(safeWithdrawalPage - 1) * WITHDRAWALS_PER_PAGE + 1}
                    –
                    {Math.min(
                      safeWithdrawalPage * WITHDRAWALS_PER_PAGE,
                      filteredWithdrawals.length,
                    )}{" "}
                    of {filteredWithdrawals.length} requests
                  </span>
                  <PaginationView
                    currentPage={safeWithdrawalPage}
                    totalPages={withdrawalTotalPages}
                    handlePageChange={setWithdrawalPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Referred Users & Earning History Side-by-Side (Always Visible) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Referred Users */}
        <Card id="referred-users-section" className="xl:col-span-7 scroll-mt-4">
          <CardHeader className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">
                    Referred Users
                  </CardTitle>
                  <Badge variant="secondary" className="tabular-nums">
                    {data.referredUsers.length}
                  </Badge>
                </div>
                <CardDescription>
                  Accounts registered using code{" "}
                  <code className="font-mono">{data.referralCode}</code>
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "converted", label: "Converted" },
                    { key: "registered", label: "Registered" },
                  ] as const
                ).map((item) => (
                  <Button
                    key={item.key}
                    type="button"
                    size="sm"
                    variant={
                      referredFilter === item.key ? "default" : "outline"
                    }
                    className="h-7 px-2.5 text-xs"
                    onClick={() => {
                      setReferredFilter(item.key);
                      setReferredPage(1);
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {data.referredUsers.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter referred users by name or email..."
                  value={referredSearch}
                  onChange={(e) => {
                    setReferredSearch(e.target.value);
                    setReferredPage(1);
                  }}
                  className="h-9 pl-9 pr-9 text-sm"
                />
                {referredSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setReferredSearch("");
                      setReferredPage(1);
                    }}
                    aria-label="Clear filter"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {filteredReferredUsers.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                <Users className="h-9 w-9 mx-auto mb-2.5 text-muted-foreground/50" />
                <p className="text-sm font-medium">
                  No referred users match your filter
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y rounded-lg border">
                  {visibleReferredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage
                            src={user.avatar || undefined}
                            alt={user.name}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/users/${encodeURIComponent(user._id)}`}
                            className="font-medium text-sm hover:underline truncate block"
                          >
                            {user.name}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email} &middot; Joined{" "}
                            {formatShortDate(user.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                        {user.hasConverted ? (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="gap-1 text-[11px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Converted
                            </Badge>
                            {user.earnedAmount && user.earnedAmount > 0 ? (
                              <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(user.earnedAmount)}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-[11px]">
                            Registered
                          </Badge>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                          title="Open user profile"
                        >
                          <Link
                            href={`/admin/users/${encodeURIComponent(user._id)}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredReferredUsers.length > USERS_PER_PAGE && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Showing {(safeUsersPage - 1) * USERS_PER_PAGE + 1}–
                      {Math.min(
                        safeUsersPage * USERS_PER_PAGE,
                        filteredReferredUsers.length,
                      )}{" "}
                      of {filteredReferredUsers.length} users
                    </span>
                    <PaginationView
                      currentPage={safeUsersPage}
                      totalPages={usersTotalPages}
                      handlePageChange={setReferredPage}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Earning History */}
        <Card id="earnings-section" className="xl:col-span-5 scroll-mt-4">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Earning History
                </CardTitle>
                <Badge variant="secondary" className="tabular-nums">
                  {data.earnedHistory.length}
                </Badge>
              </div>
              <CardDescription>
                Commission credits from qualifying purchases
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 tabular-nums shrink-0"
            >
              {formatCurrency(data.totalEarned)}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            {data.earnedHistory.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                <TrendingUp className="h-9 w-9 mx-auto mb-2.5 text-muted-foreground/50" />
                <p className="text-sm font-medium">No earning history yet</p>
              </div>
            ) : (
              <>
                <div className="divide-y rounded-lg border">
                  {visibleEarnings.map((earning) => (
                    <div
                      key={earning._id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage
                            src={earning.user.avatar || undefined}
                            alt={earning.user.name}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(earning.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          {earning.user._id ? (
                            <Link
                              href={`/admin/users/${encodeURIComponent(earning.user._id)}`}
                              className="font-medium text-sm hover:underline truncate block"
                            >
                              {earning.user.name}
                            </Link>
                          ) : (
                            <p className="font-medium text-sm truncate">
                              {earning.user.name}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground truncate">
                            {earning.user.email} &middot;{" "}
                            {formatShortDate(earning.createdAt)}
                          </p>
                        </div>
                      </div>

                      <span className="font-semibold text-sm tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                        +{formatCurrency(earning.amount)}
                      </span>
                    </div>
                  ))}
                </div>

                {data.earnedHistory.length > EARNINGS_PER_PAGE && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Page {safeEarningsPage} of {earningsTotalPages}
                    </span>
                    <PaginationView
                      currentPage={safeEarningsPage}
                      totalPages={earningsTotalPages}
                      handlePageChange={setEarningsPage}
                      showFirstLast={false}
                      showJumpToPage={false}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Action Modal */}
      <Dialog
        open={Boolean(selectedWithdrawal)}
        onOpenChange={(open) => {
          if (!open) closeWithdrawalModal();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve Withdrawal"
                : "Reject Withdrawal"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Enter the payment transaction reference to mark this payout as completed."
                : "Provide a clear reason for rejecting this withdrawal request."}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-muted/50 border p-3.5 rounded-lg space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(selectedWithdrawal.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payout Account</span>
                  <span className="font-mono text-xs">
                    {selectedWithdrawal.withdrawAccount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested</span>
                  <span className="text-xs">
                    {formatDate(
                      selectedWithdrawal.requestedAt ||
                        selectedWithdrawal.createdAt,
                    )}
                  </span>
                </div>
              </div>

              {actionType === "reject" && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    {formatCurrency(selectedWithdrawal.amount)} will be
                    automatically refunded to {data.referrer.name}&apos;s
                    available balance.
                  </span>
                </div>
              )}

              {actionType === "approve" ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="trxId">
                      Transaction ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="trxId"
                      placeholder="e.g. TXN-9843210"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="approveNotes">Admin Note (optional)</Label>
                    <Textarea
                      id="approveNotes"
                      rows={2}
                      placeholder="Optional payout note..."
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="rejectReason">
                    Rejection Reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="rejectReason"
                    rows={3}
                    placeholder="Explain why this payout cannot be processed..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeWithdrawalModal}
              disabled={updateWithdrawalMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleWithdrawalAction}
              disabled={
                updateWithdrawalMutation.isPending ||
                (actionType === "approve" && !trxId.trim()) ||
                (actionType === "reject" && !notesInput.trim())
              }
              className={
                actionType === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : ""
              }
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {updateWithdrawalMutation.isPending
                ? "Processing..."
                : actionType === "approve"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
