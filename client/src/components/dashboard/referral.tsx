"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  useReferralDetailsQuery,
  useRequestWithdrawMutation,
} from "@/services/queries/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Gift,
  Phone,
  RefreshCw,
  Share2,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useBaseUrl } from "@/hooks/use-baseUrl";
import { ReferralDashboardSkeleton } from "@/components/dashboard/referral-skeleton";

function formatBdt(amount: number | undefined | null): string {
  const numeric = Number(amount) || 0;
  return `৳${numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateString?: string | null, fallback = "—"): string {
  if (!dateString) return fallback;
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return format(parsed, "MMM d, yyyy");
}

function WithdrawalStatusBadge({
  status,
}: {
  status: "pending" | "completed" | "rejected";
}) {
  if (status === "completed") {
    return (
      <Badge
        variant="outline"
        className="text-xs font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
      >
        Completed
      </Badge>
    );
  }

  if (status === "pending") {
    return (
      <Badge
        variant="outline"
        className="text-xs font-medium text-amber-600 dark:text-amber-400 border-amber-500/25 bg-amber-500/10"
      >
        Pending
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-xs font-medium text-destructive border-destructive/30 bg-destructive/10"
    >
      Rejected
    </Badge>
  );
}

export function ReferralDashboard() {
  const {
    data: referralResponse,
    isPending: isLoading,
    isRefetching,
    refetch,
    isError,
    error,
  } = useReferralDetailsQuery();

  const requestWithdrawMutation = useRequestWithdrawMutation();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [withdrawAmountInput, setWithdrawAmountInput] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const baseUrl = useBaseUrl();

  const handleRefresh = async () => {
    const result = await refetch();
    if (result.isError || !result.data?.success) {
      toast.error(
        (result.data && !result.data.success ? result.data.message : null) ||
          (result.error as Error)?.message ||
          "Failed to refresh referral data"
      );
      return;
    }
    toast.success("Referral data refreshed");
  };

  if (isLoading) {
    return <ReferralDashboardSkeleton />;
  }

  if (isError || !referralResponse?.success || !referralResponse.data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[350px] rounded-xl border border-dashed border-destructive/40 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold text-foreground">
          Failed to load referral data
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {referralResponse?.message ||
            (error as Error)?.message ||
            "An unexpected error occurred while loading your referral details."}
        </p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const referralData = referralResponse.data;
  const commissionPerReferral = referralData.commissionPerReferral || 50;
  const minimumWithdrawAmount = referralData.minimumWithdrawAmount || 100;
  const availableBalance = Number(referralData.availableBalance) || 0;
  const totalEarned = Number(referralData.totalEarned) || 0;
  const thisMonthEarned = Number(referralData.thisMonthEarned) || 0;
  const totalWithdrawn = Number(referralData.totalWithdrawn) || 0;
  const pendingWithdrawalAmount =
    Number(referralData.pendingWithdrawalAmount) || 0;
  const pendingWithdrawalCount = referralData.pendingWithdrawalCount || 0;
  const referralCount = referralData.referralCount || 0;
  const convertedCount = referralData.convertedCount || 0;
  const awaitingPackageCount = Math.max(0, referralCount - convertedCount);

  const referredUsers = referralData.referredUsers || [];
  const earnedHistory = referralData.earnedHistory || [];
  const withdrawHistory = referralData.withdrawHistory || [];

  const referralUrl = `${baseUrl}/signup?ref=${referralData.referralCode}`;

  const handleCopyText = async (
    value: string,
    kind: "link" | "code"
  ): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      if (kind === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
        toast.success("Referral link copied to clipboard");
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
        toast.success("Referral code copied to clipboard");
      }
    } catch {
      toast.error("Unable to copy to clipboard");
    }
  };

  const handleShare = async () => {
    const shareText = `Join me on GenMeta using my referral link: ${referralUrl}`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Join GenMeta",
          text: "Sign up to GenMeta with my referral link:",
          url: referralUrl,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return;
        }
      }
    }
    await handleCopyText(shareText, "link");
  };

  const handleWithdrawDialogChange = (open: boolean) => {
    if (open) {
      setMobileNumber(referralData.withdrawAccount || "");
      setWithdrawAmountInput(
        availableBalance > 0 ? String(availableBalance) : ""
      );
    }
    setIsWithdrawModalOpen(open);
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAccount = mobileNumber.trim();
    const parsedAmount = Number(withdrawAmountInput);

    if (!cleanAccount || cleanAccount.length < 3) {
      toast.error("Please enter a valid bKash Personal number");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    if (parsedAmount < minimumWithdrawAmount) {
      toast.error(
        `Minimum withdrawal amount is ৳${minimumWithdrawAmount} BDT`
      );
      return;
    }

    if (parsedAmount > availableBalance) {
      toast.error("Requested amount exceeds your available balance");
      return;
    }

    const res = await requestWithdrawMutation.mutateAsync({
      withdrawAccount: cleanAccount,
      amount: parsedAmount,
    });

    if (!res.success) {
      toast.error(res.message || "Failed to submit withdrawal request");
      return;
    }

    toast.success(res.message || "Withdrawal request submitted successfully!");
    setIsWithdrawModalOpen(false);
  };

  const canWithdraw = availableBalance >= minimumWithdrawAmount;
  const remainingForMinimum = Math.max(
    0,
    minimumWithdrawAmount - availableBalance
  );

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Referral Program
            </h1>
            <Badge
              variant="outline"
              className="gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
            >
              <Gift className="h-3 w-3" />
              ৳{commissionPerReferral} BDT / Subscriber
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Refer friends to GenMeta and earn a ৳{commissionPerReferral} BDT
            bonus when they subscribe to any package.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefetching}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* 2. Referral Bonus Rule Callout */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong className="font-medium text-foreground">How it works:</strong>{" "}
            Share your link &rarr; Friend purchases any plan &rarr; Earn{" "}
            <strong className="font-medium text-foreground">
              ৳{commissionPerReferral} BDT
            </strong>
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Min. withdrawal: ৳{minimumWithdrawAmount} BDT
        </span>
      </div>

      {/* 3. Four-Card KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Available Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatBdt(availableBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {canWithdraw
                ? "Ready to withdraw via bKash"
                : `${formatBdt(remainingForMinimum)} more to reach ৳${minimumWithdrawAmount} min.`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Earned
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBdt(totalEarned)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatBdt(thisMonthEarned)} earned this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Withdrawn
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBdt(totalWithdrawn)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingWithdrawalCount > 0
                ? `${formatBdt(pendingWithdrawalAmount)} pending (${pendingWithdrawalCount})`
                : "No pending payouts"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Referred Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {convertedCount} subscribed · {awaitingPackageCount} awaiting
              package
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Action Grid: Share Link & Withdraw Funds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-lg">Share & Earn</CardTitle>
            <CardDescription>
              Invite creators with your unique referral URL or code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="referral-link"
                className="text-xs uppercase tracking-wider text-muted-foreground"
              >
                Referral Link
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="referral-link"
                  value={referralUrl}
                  readOnly
                  className="font-mono text-xs sm:text-sm"
                />
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCopyText(referralUrl, "link")}
                    className="flex-1 sm:flex-none gap-2"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleShare}
                    className="flex-1 sm:flex-none gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Referral Code
                </span>
                <code className="rounded bg-background border px-2.5 py-1 text-sm font-mono font-semibold tracking-wider">
                  {referralData.referralCode}
                </code>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleCopyText(referralData.referralCode, "code")}
                className="gap-1.5 text-xs"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Code Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg">Withdraw Funds</CardTitle>
            <CardDescription>
              Request payout to your bKash Personal account (minimum ৳
              {minimumWithdrawAmount} BDT).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  Available to Withdraw
                </span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatBdt(availableBalance)}
                </span>
              </div>

              {referralData.withdrawAccount && (
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground border-t pt-2">
                  <span>Saved bKash Account</span>
                  <span className="font-mono font-medium text-foreground">
                    {referralData.withdrawAccount}
                  </span>
                </div>
              )}

              {pendingWithdrawalCount > 0 && (
                <div className="flex items-center justify-between gap-2 text-xs text-amber-600 dark:text-amber-400 border-t pt-2">
                  <span>Pending Requests ({pendingWithdrawalCount})</span>
                  <span className="font-medium">
                    {formatBdt(pendingWithdrawalAmount)}
                  </span>
                </div>
              )}
            </div>

            <Dialog
              open={isWithdrawModalOpen}
              onOpenChange={handleWithdrawDialogChange}
            >
              <DialogTrigger asChild>
                <Button
                  disabled={!canWithdraw}
                  className="w-full gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Request Withdrawal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleWithdrawRequest} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Withdrawal Request
                    </DialogTitle>
                    <DialogDescription>
                      Submit your withdrawal request. Payouts are processed via
                      bKash Personal within 1-3 business days.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile">bKash Personal Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="mobile"
                          placeholder="01XXXXXXXXX"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="pl-10"
                          disabled={requestWithdrawMutation.isPending}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="amount">Withdrawal Amount (BDT)</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setWithdrawAmountInput(String(availableBalance))
                          }
                          disabled={requestWithdrawMutation.isPending}
                          className="h-auto px-1.5 py-0.5 text-xs"
                        >
                          Use Max ({formatBdt(availableBalance)})
                        </Button>
                      </div>
                      <Input
                        id="amount"
                        type="number"
                        step="any"
                        min={minimumWithdrawAmount}
                        max={availableBalance}
                        placeholder={String(availableBalance)}
                        value={withdrawAmountInput}
                        onChange={(e) => setWithdrawAmountInput(e.target.value)}
                        disabled={requestWithdrawMutation.isPending}
                        required
                      />
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          Min: ৳{minimumWithdrawAmount} · Available:{" "}
                          {formatBdt(availableBalance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsWithdrawModalOpen(false)}
                      disabled={requestWithdrawMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        requestWithdrawMutation.isPending ||
                        !mobileNumber.trim()
                      }
                      className="min-w-[120px]"
                    >
                      {requestWithdrawMutation.isPending
                        ? "Submitting..."
                        : "Submit Request"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* 5. Tabbed Referral & Payout Activity */}
      <Card>
        <Tabs defaultValue="referred" className="w-full">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Referral Activity</CardTitle>
              <CardDescription>
                Track referred signups, bonus credits unlocked by package
                subscriptions, and payouts.
              </CardDescription>
            </div>

            <TabsList className="grid w-full md:w-auto grid-cols-3 h-auto">
              <TabsTrigger value="referred" className="text-xs sm:text-sm py-1.5">
                Referred ({referredUsers.length})
              </TabsTrigger>
              <TabsTrigger value="earnings" className="text-xs sm:text-sm py-1.5">
                Earnings ({earnedHistory.length})
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="text-xs sm:text-sm py-1.5">
                Payouts ({withdrawHistory.length})
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="referred" className="mt-0">
              {referredUsers.length > 0 ? (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>User</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Package Status</TableHead>
                        <TableHead className="text-right">Bonus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referredUsers.map((refUser) => (
                        <TableRow key={refUser.id}>
                          <TableCell>
                            <div className="flex flex-col min-w-[160px]">
                              <span className="font-medium text-foreground">
                                {refUser.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {refUser.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(refUser.joinedAt)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {refUser.status === "subscribed" ? (
                              <div className="flex flex-col gap-0.5">
                                <Badge
                                  variant="outline"
                                  className="w-fit gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Subscribed
                                </Badge>
                                {refUser.earnedAt && (
                                  <span className="text-[11px] text-muted-foreground">
                                    Credited {formatDate(refUser.earnedAt)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 border-amber-500/25 bg-amber-500/10"
                              >
                                <Clock className="h-3 w-3" />
                                Pending Package
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap">
                            {refUser.status === "subscribed" ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                +{formatBdt(refUser.earnedAmount)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                {formatBdt(0)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground rounded-lg border border-dashed">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-foreground">
                    No referred users yet
                  </p>
                  <p className="text-sm mt-1 max-w-md mx-auto">
                    Share your referral link above. You earn ৳
                    {commissionPerReferral} BDT once a referred user subscribes
                    to any package.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="earnings" className="mt-0">
              {earnedHistory.length > 0 ? (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Referred Subscriber</TableHead>
                        <TableHead>Credited Date</TableHead>
                        <TableHead className="text-right">Bonus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {earnedHistory.map((item, idx) => (
                        <TableRow
                          key={item._id || `${item.user._id}-${item.createdAt}-${idx}`}
                        >
                          <TableCell>
                            <div className="flex flex-col min-w-[160px]">
                              <span className="font-medium text-foreground">
                                {item.user.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.user.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(item.createdAt)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            +{formatBdt(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground rounded-lg border border-dashed">
                  <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-foreground">
                    No referral bonuses credited yet
                  </p>
                  <p className="text-sm mt-1 max-w-md mx-auto">
                    Your ৳{commissionPerReferral} BDT bonus is credited
                    automatically as soon as a referred user subscribes to any
                    package.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-0">
              {withdrawHistory.length > 0 ? (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">TRX</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawHistory.map((withdrawal, idx) => (
                        <TableRow
                          key={
                            withdrawal._id ||
                            `${withdrawal.requestedAt}-${withdrawal.amount}-${idx}`
                          }
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            {formatBdt(withdrawal.amount)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <WithdrawalStatusBadge status={withdrawal.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(
                              withdrawal.requestedAt || withdrawal.createdAt
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(withdrawal.issuedAt)}
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground whitespace-nowrap">
                            {withdrawal.withdrawAccount || "—"}
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground text-right whitespace-nowrap">
                            {withdrawal.trx || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground rounded-lg border border-dashed">
                  <Wallet className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-foreground">
                    No withdrawal requests yet
                  </p>
                  <p className="text-sm mt-1 max-w-md mx-auto">
                    Once your available balance reaches ৳{minimumWithdrawAmount}{" "}
                    BDT, you can request a payout above.
                  </p>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
