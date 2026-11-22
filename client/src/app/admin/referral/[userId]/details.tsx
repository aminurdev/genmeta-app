"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Phone,
  RefreshCw,
  ShieldCheck,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ReferralDetailSkeleton } from "../referral-skeleton";

interface AdminUserReferralDashboardProps {
  userId: string;
}

type WithdrawalFilter = "all" | "pending" | "completed" | "rejected";

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

export default function AdminUserReferralDashboard({
  userId,
}: AdminUserReferralDashboardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [withdrawalFilter, setWithdrawalFilter] =
    useState<WithdrawalFilter>("all");
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawHistory | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null,
  );
  const [trxId, setTrxId] = useState("");
  const [notesInput, setNotesInput] = useState("");

  const { data: res, isLoading, isError, refetch } = useReferralByUserIdQuery(userId);
  const refreshMutation = useRefreshReferralByUserMutation(userId);
  const updateWithdrawalMutation = useUpdateWithdrawalMutation();

  const data = res?.success ? res.data : undefined;

  const filteredWithdrawals = useMemo(() => {
    const list = data?.withdrawHistory ?? [];
    if (withdrawalFilter === "all") return list;
    return list.filter((w) => w.status === withdrawalFilter);
  }, [data?.withdrawHistory, withdrawalFilter]);

  const recentActivity = useMemo(() => {
    if (!data) return [];
    const items = [
      ...data.earnedHistory.map((e) => ({
        id: `earn-${e._id}`,
        kind: "earning" as const,
        title: e.user.name,
        subtitle: e.user.email,
        amount: e.amount,
        status: "earned",
        date: e.createdAt,
      })),
      ...data.withdrawHistory.map((w) => ({
        id: `wd-${w._id}`,
        kind: "withdrawal" as const,
        title: `Withdrawal (${w.withdrawAccount})`,
        subtitle: w.trx ? `TRX: ${w.trx}` : w.notes || w.status,
        amount: w.amount,
        status: w.status,
        date: w.requestedAt || w.createdAt,
      })),
    ];
    items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return items.slice(0, 8);
  }, [data]);

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
              <p className="font-semibold text-lg">Could not load referral record</p>
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
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Affiliate commissions, referred users &amp; withdrawal payouts
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

      {/* Hero Referrer Card */}
      <Card>
        <CardContent className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <Avatar className="h-14 w-14 shrink-0 border">
              <AvatarImage
                src={data.referrer.avatar || undefined}
                alt={data.referrer.name}
              />
              <AvatarFallback className="text-base font-semibold">
                {getInitials(data.referrer.name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold truncate">
                  {data.referrer.name}
                </h2>
                {data.referrer.isVerified && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-[11px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {data.referrer.isDisabled && (
                  <Badge variant="destructive" className="text-[11px]">
                    Disabled
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground truncate">
                {data.referrer.email}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(data.referralCode, "Referral code", "code")
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-muted/50 hover:bg-muted text-xs font-mono transition-colors"
                >
                  <span className="text-muted-foreground">Code:</span>
                  <span className="font-semibold text-foreground">
                    {data.referralCode}
                  </span>
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-muted/50 hover:bg-muted text-xs font-mono transition-colors"
                  >
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{data.withdrawAccount}</span>
                    {copiedKey === "account" ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-dashed text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    No payout account set
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col lg:items-end gap-2 text-xs text-muted-foreground shrink-0">
            <div className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Joined {formatShortDate(data.referrer.createdAt || data.createdAt)}</span>
            </div>
            <div className="font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded border">
              ID: {userId}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
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

        <Card>
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
              {data.convertedCount} of {data.referralCount} converted (
              {data.conversionRate}%)
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
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

        <Card>
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
      </div>

      {/* Tabbed Sections */}
      <Tabs defaultValue="withdrawals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 gap-1">
          <TabsTrigger value="withdrawals" className="py-2 gap-1.5 text-xs sm:text-sm">
            <span>Withdrawals</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-[11px] tabular-nums">
              {data.withdrawHistory.length}
            </Badge>
            {data.pendingWithdrawalsCount > 0 && (
              <span
                className="h-2 w-2 rounded-full bg-amber-500"
                title={`${data.pendingWithdrawalsCount} pending`}
              />
            )}
          </TabsTrigger>
          <TabsTrigger value="earnings" className="py-2 gap-1.5 text-xs sm:text-sm">
            <span>Earnings</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-[11px] tabular-nums">
              {data.earnedHistory.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="py-2 gap-1.5 text-xs sm:text-sm">
            <span>Referred Users</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-[11px] tabular-nums">
              {data.referredUsers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="overview" className="py-2 text-xs sm:text-sm">
            Overview
          </TabsTrigger>
        </TabsList>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  Withdrawal Requests
                </CardTitle>
                <CardDescription>
                  Approve payouts with a transaction reference or reject to
                  refund the balance.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "pending", label: "Pending" },
                    { key: "completed", label: "Completed" },
                    { key: "rejected", label: "Rejected" },
                  ] as const
                ).map((item) => (
                  <Button
                    key={item.key}
                    type="button"
                    size="sm"
                    variant={
                      withdrawalFilter === item.key ? "default" : "outline"
                    }
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setWithdrawalFilter(item.key)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              {filteredWithdrawals.length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
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
                        {filteredWithdrawals.map((withdrawal) => (
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
                    {filteredWithdrawals.map((withdrawal) => (
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
                              <p className="font-mono">
                                TRX: {withdrawal.trx}
                              </p>
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
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Earning History
              </CardTitle>
              <CardDescription>
                Commissions credited when referred users purchase plans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.earnedHistory.length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm font-medium">No earning history yet</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>Referred User</TableHead>
                          <TableHead className="text-right">
                            Commission
                          </TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.earnedHistory.map((earning) => (
                          <TableRow key={earning._id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={earning.user.avatar || undefined}
                                    alt={earning.user.name}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(earning.user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  {earning.user._id ? (
                                    <Link
                                      href={`/admin/users/${encodeURIComponent(earning.user._id)}`}
                                      className="font-medium text-sm hover:underline"
                                    >
                                      {earning.user.name}
                                    </Link>
                                  ) : (
                                    <p className="font-medium text-sm">
                                      {earning.user.name}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    {earning.user.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                              +{formatCurrency(earning.amount)}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(earning.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden divide-y rounded-lg border">
                    {data.earnedHistory.map((earning) => (
                      <div
                        key={earning._id}
                        className="p-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {earning.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {earning.user.email}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatShortDate(earning.createdAt)}
                          </p>
                        </div>
                        <span className="font-semibold text-sm tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                          +{formatCurrency(earning.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referred Users Tab */}
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Referred Users
              </CardTitle>
              <CardDescription>
                Accounts registered using referral code{" "}
                <code className="font-mono">{data.referralCode}</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.referredUsers.length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm font-medium">No referred users yet</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>User</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">
                            Commission Earned
                          </TableHead>
                          <TableHead className="text-right">Profile</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.referredUsers.map((user) => (
                          <TableRow key={user._id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={user.avatar || undefined}
                                    alt={user.name}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatShortDate(user.createdAt)}
                            </TableCell>
                            <TableCell>
                              {user.hasConverted ? (
                                <Badge
                                  variant="outline"
                                  className="gap-1 bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Converted
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Registered</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {user.earnedAmount && user.earnedAmount > 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(user.earnedAmount)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link
                                  href={`/admin/users/${encodeURIComponent(user._id)}`}
                                >
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden divide-y rounded-lg border">
                    {data.referredUsers.map((user) => (
                      <div key={user._id} className="p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                          {user.hasConverted ? (
                            <Badge
                              variant="outline"
                              className="shrink-0 bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 text-[11px]"
                            >
                              Converted
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="shrink-0 text-[11px]">
                              Registered
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Joined {formatShortDate(user.createdAt)}</span>
                          <Link
                            href={`/admin/users/${encodeURIComponent(user._id)}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            View profile
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Account &amp; Payout Breakdown
                </CardTitle>
                <CardDescription>
                  Summary of referral wallet metrics and conversion health
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Total Referrals</span>
                  <span className="font-semibold tabular-nums">
                    {data.referralCount}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Converted Users</span>
                  <span className="font-semibold tabular-nums">
                    {data.convertedCount} ({data.conversionRate}%)
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Total Earned</span>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(data.totalEarned)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Total Paid Out</span>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(data.totalWithdrawn)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">
                    Pending Payouts
                  </span>
                  <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                    {formatCurrency(data.pendingWithdrawalsAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">
                    Available Balance
                  </span>
                  <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.availableBalance)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Payout Account</span>
                  <span className="font-mono text-xs">
                    {data.withdrawAccount || "Not set"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest commission credits and withdrawal updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No activity recorded yet
                  </p>
                ) : (
                  <div className="divide-y">
                    {recentActivity.map((item) => (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.subtitle} &middot;{" "}
                            {formatShortDate(item.date)}
                          </p>
                        </div>
                        {item.kind === "earning" ? (
                          <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                            +{formatCurrency(item.amount)}
                          </span>
                        ) : (
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold tabular-nums">
                              -{formatCurrency(item.amount)}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] capitalize h-4 px-1.5",
                                getStatusBadgeClass(item.status),
                              )}
                            >
                              {item.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
