"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Activity,
  AlertCircle,
  ArrowUpDown,
  CalendarIcon,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  SearchCheck,
  ShieldCheck,
  Tag,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAdminPaymentTransactionsQuery,
  useExportPaymentsCsvMutation,
  usePaymentsHistoryQuery,
  useReconcilePaymentMutation,
  useReconcilePendingPaymentsMutation,
  useRefreshPaymentsMutation,
  useVerifyPaystationTrxMutation,
} from "@/services/queries/admin-dashboard";
import type {
  AdminPaymentTransaction,
  GetAdminPaymentTransactionsParams,
  GetPaymentsHistoryParams,
  PaymentRecord,
  VerifyPaystationTrxResponse,
} from "@/types/admin";
import PaginationView from "@/components/pagination-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { downloadCSVFile, generateFilename } from "./export";
import {
  GatewayTransactionsTableSkeleton,
  PaymentsTableSkeleton,
} from "./payments-skeleton";

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

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, "MMM dd, yyyy · hh:mm a");
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function getPaymentStatusBadge(status?: string) {
  const normalized = (status || "completed").toLowerCase();
  switch (normalized) {
    case "completed":
      return (
        <Badge
          variant="outline"
          className="gap-1 bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
        >
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );
    case "pending":
    case "processing":
    case "initiated":
      return (
        <Badge
          variant="outline"
          className="gap-1 capitalize bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400"
        >
          <Clock className="h-3 w-3" />
          {normalized}
        </Badge>
      );
    case "failed":
    case "canceled":
    case "expired":
    case "amount_mismatch":
      return (
        <Badge
          variant="outline"
          className="gap-1 capitalize bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400"
        >
          <XCircle className="h-3 w-3" />
          {normalized.replace("_", " ")}
        </Badge>
      );
    case "refunded":
      return (
        <Badge
          variant="outline"
          className="gap-1 capitalize bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400"
        >
          <AlertCircle className="h-3 w-3" />
          Refunded
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1 capitalize">
          <AlertCircle className="h-3 w-3" />
          {normalized}
        </Badge>
      );
  }
}

function getPlanTypeBadge(type?: string) {
  const normalized = (type || "").toLowerCase();
  if (normalized === "subscription") {
    return (
      <Badge
        variant="outline"
        className="text-[11px] bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400"
      >
        Subscription
      </Badge>
    );
  }
  if (normalized === "credit") {
    return (
      <Badge
        variant="outline"
        className="text-[11px] bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400"
      >
        Credit Pack
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[11px] capitalize">
      {type || "Plan"}
    </Badge>
  );
}

function getCustomerFromPayment(payment: PaymentRecord) {
  const populated =
    payment.userId && typeof payment.userId === "object"
      ? payment.userId
      : null;
  return {
    id:
      payment.user?._id && payment.user._id !== "N/A"
        ? payment.user._id
        : populated?._id || "",
    name: payment.user?.name || populated?.name || "Unknown User",
    email: payment.user?.email || populated?.email || "N/A",
    avatar: payment.user?.avatar ?? populated?.avatar ?? null,
  };
}

function getCustomerFromTx(tx: AdminPaymentTransaction) {
  const populated =
    tx.userId && typeof tx.userId === "object" ? tx.userId : null;
  return {
    id: populated?._id || (typeof tx.userId === "string" ? tx.userId : ""),
    name: populated?.name || "Customer",
    email: populated?.email || "—",
    avatar: populated?.avatar ?? null,
  };
}

function countCompletedFulfillmentSteps(
  steps?: AdminPaymentTransaction["fulfillmentSteps"],
): number {
  if (!steps) return 0;
  return [
    steps.paymentRecorded,
    steps.planUpdated,
    steps.referralProcessed,
    steps.promoRecorded,
    steps.emailSent,
  ].filter(Boolean).length;
}

export function PaymentHistoryPage() {
  // Payment Records State
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [planTypeFilter, setPlanTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gatewayFilter, setGatewayFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Gateway Audit Transactions State
  const [txStatusFilter, setTxStatusFilter] = useState<string>("all");
  const [txSearchInput, setTxSearchInput] = useState("");
  const [debouncedTxSearch, setDebouncedTxSearch] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [txLimit, setTxLimit] = useState(10);

  // Interactive Modal / Action State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null,
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<AdminPaymentTransaction | null>(null);
  const [reconcilingInvoice, setReconcilingInvoice] = useState<string | null>(
    null,
  );
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyTrxInput, setVerifyTrxInput] = useState("");
  const [verifyResult, setVerifyResult] =
    useState<VerifyPaystationTrxResponse | null>(null);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, debouncedSearch]);

  useEffect(() => {
    const trimmed = txSearchInput.trim();
    if (trimmed === debouncedTxSearch) return;
    const timer = setTimeout(() => {
      setDebouncedTxSearch(trimmed);
      setTxPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [txSearchInput, debouncedTxSearch]);

  const paymentsParams: GetPaymentsHistoryParams = {
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
    status: statusFilter !== "all" ? statusFilter : undefined,
    planType: planTypeFilter !== "all" ? planTypeFilter : undefined,
    gateway: gatewayFilter !== "all" ? gatewayFilter : undefined,
    startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    endDate: dateRange?.to
      ? dateRange.to.toISOString()
      : dateRange?.from
        ? dateRange.from.toISOString()
        : undefined,
  };

  const transactionsParams: GetAdminPaymentTransactionsParams = {
    page: txPage,
    limit: txLimit,
    status: txStatusFilter !== "all" ? txStatusFilter : undefined,
    search: debouncedTxSearch || undefined,
  };

  const {
    data: paymentsResponse,
    isPending: paymentsLoading,
    isFetching: paymentsFetching,
    isError: paymentsIsError,
    refetch: refetchPayments,
  } = usePaymentsHistoryQuery(paymentsParams);

  const {
    data: transactionsResponse,
    isPending: txLoading,
    isFetching: txFetching,
    isError: txIsError,
    refetch: refetchTransactions,
  } = useAdminPaymentTransactionsQuery(transactionsParams);

  const refreshMutation = useRefreshPaymentsMutation();
  const exportMutation = useExportPaymentsCsvMutation();
  const reconcileOneMutation = useReconcilePaymentMutation();
  const reconcilePendingMutation = useReconcilePendingPaymentsMutation();
  const verifyTrxMutation = useVerifyPaystationTrxMutation();

  const paymentsData = paymentsResponse?.success
    ? paymentsResponse.data
    : undefined;
  const txData = transactionsResponse?.success
    ? transactionsResponse.data
    : undefined;

  const payments: PaymentRecord[] = paymentsData?.payments ?? [];
  const transactions: AdminPaymentTransaction[] = txData?.transactions ?? [];
  const statusSummary = txData?.statusSummary ?? {};

  const summary = paymentsData?.summary ?? {
    totalRevenue: 0,
    totalPayments: 0,
    todayRevenue: 0,
    todayCount: 0,
    thisMonthRevenue: 0,
    thisMonthCount: 0,
    avgOrderValue: 0,
    byPlanType: {
      subscription: { amount: 0, count: 0 },
      credit: { amount: 0, count: 0 },
      other: { amount: 0, count: 0 },
    },
    byGateway: {
      paystation: { amount: 0, count: 0 },
      bkash: { amount: 0, count: 0 },
      manual: { amount: 0, count: 0 },
    },
  };

  const filteredSummary = paymentsData?.filteredSummary ?? {
    totalAmount: 0,
    totalCount: paymentsData?.total ?? 0,
  };

  const paymentPagination = paymentsData?.pagination ?? {
    total: paymentsData?.total ?? 0,
    page: paymentsData?.page ?? currentPage,
    limit: paymentsData?.limit ?? pageSize,
    totalPages: paymentsData?.totalPages ?? 0,
  };

  const txPagination = txData?.pagination ?? {
    total: 0,
    page: txPage,
    limit: txLimit,
    totalPages: 0,
  };

  const totalGatewayTxCount = Object.values(statusSummary).reduce(
    (sum, n) => sum + (Number(n) || 0),
    0,
  );
  const pendingGatewayCount =
    (statusSummary.pending || 0) +
    (statusSummary.initiated || 0) +
    (statusSummary.processing || 0) +
    (statusSummary.amount_mismatch || 0);

  const generatedAt =
    paymentsData?.meta?.generatedAt ?? txData?.meta?.generatedAt ?? null;

  const paymentsHasError =
    paymentsIsError ||
    (paymentsResponse !== undefined && !paymentsResponse.success);
  const txHasError =
    txIsError ||
    (transactionsResponse !== undefined && !transactionsResponse.success);

  const hasActivePaymentFilters =
    debouncedSearch !== "" ||
    planTypeFilter !== "all" ||
    statusFilter !== "all" ||
    gatewayFilter !== "all" ||
    Boolean(dateRange?.from) ||
    sortBy !== "createdAt" ||
    sortOrder !== "desc";

  const hasActiveTxFilters =
    debouncedTxSearch !== "" || txStatusFilter !== "all";

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

  const handleRefreshAll = async () => {
    try {
      const { paymentsRes, transactionsRes } = await refreshMutation.mutateAsync(
        {
          paymentsParams,
          transactionsParams,
        },
      );
      if (!paymentsRes.success || !transactionsRes.success) {
        toast.error(
          (!paymentsRes.success ? paymentsRes.message : null) ||
          (!transactionsRes.success ? transactionsRes.message : null) ||
          "Failed to sync payment data",
        );
        return;
      }
      toast.success("Payments & gateway audit synced");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to sync payment data",
      );
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await exportMutation.mutateAsync(paymentsParams);
      if (!res.success) {
        toast.error(res.message || "Failed to export CSV");
        return;
      }
      const filename = generateFilename(
        dateRange?.from,
        dateRange?.to ?? dateRange?.from,
      );
      downloadCSVFile(res.csv, filename);
      toast.success("Payment history CSV exported");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export payment history",
      );
    }
  };

  const handleReconcilePending = async () => {
    try {
      const res = await reconcilePendingMutation.mutateAsync(20);
      if (!res.success) {
        toast.error(res.message || "Failed to reconcile pending payments");
        return;
      }
      const d = res.data;
      if (d?.skipped) {
        toast.info("Reconciliation sweep is already running");
        return;
      }
      toast.success(
        `Sweep completed: ${d?.scanned ?? 0} checked, ${d?.completed ?? 0} completed, ${d?.failed ?? 0} failed`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Reconciliation sweep failed",
      );
    }
  };

  const handleReconcileSingle = async (invoiceNumber: string) => {
    setReconcilingInvoice(invoiceNumber);
    try {
      const res = await reconcileOneMutation.mutateAsync(invoiceNumber);
      if (!res.success) {
        toast.error(res.message || "Failed to reconcile transaction");
        return;
      }
      const outcome = res.data?.outcome || "processed";
      if (outcome === "completed") {
        toast.success(`Invoice ${invoiceNumber} verified & fulfilled`);
      } else {
        toast.info(
          `Invoice ${invoiceNumber}: status "${outcome}"${res.data?.error ? ` — ${res.data.error}` : ""
          }`,
        );
      }
      if (
        res.data?.transaction &&
        selectedTransaction?.invoiceNumber === invoiceNumber
      ) {
        setSelectedTransaction(res.data.transaction);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reconcile invoice",
      );
    } finally {
      setReconcilingInvoice(null);
    }
  };

  const handleVerifyTrxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = verifyTrxInput.trim();
    if (!cleaned) return;
    setVerifyResult(null);
    try {
      const res = await verifyTrxMutation.mutateAsync(cleaned);
      if (!res.success) {
        toast.error(res.message || "Lookup failed");
        return;
      }
      setVerifyResult(res.data ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to query PayStation TRX",
      );
    }
  };

  const resetPaymentFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setPlanTypeFilter("all");
    setStatusFilter("all");
    setGatewayFilter("all");
    setDateRange(undefined);
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const resetTxFilters = () => {
    setTxSearchInput("");
    setDebouncedTxSearch("");
    setTxStatusFilter("all");
    setTxPage(1);
  };

  const paymentStartItem =
    paymentPagination.total === 0
      ? 0
      : (paymentPagination.page - 1) * paymentPagination.limit + 1;
  const paymentEndItem = Math.min(
    paymentPagination.page * paymentPagination.limit,
    paymentPagination.total,
  );

  const txStartItem =
    txPagination.total === 0
      ? 0
      : (txPagination.page - 1) * txPagination.limit + 1;
  const txEndItem = Math.min(
    txPagination.page * txPagination.limit,
    txPagination.total,
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Payments &amp; Transactions
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
            Monitor completed receipts, audit PayStation checkout attempts, and
            reconcile pending payments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshMutation.isPending}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                refreshMutation.isPending && "animate-spin",
              )}
            />
            <span>{refreshMutation.isPending ? "Syncing..." : "Refresh"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReconcilePending}
            disabled={reconcilePendingMutation.isPending}
            className="gap-1.5"
          >
            {reconcilePendingMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span>Reconcile Pending</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setVerifyResult(null);
              setVerifyTrxInput("");
              setVerifyDialogOpen(true);
            }}
            className="gap-1.5"
          >
            <SearchCheck className="h-4 w-4" />
            <span>Verify TRX</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExportCsv}
            disabled={exportMutation.isPending}
            className="gap-1.5"
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* 4 Interactive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => {
            setPlanTypeFilter("all");
            setCurrentPage(1);
            scrollToSection("payment-records");
          }}
          className="text-left w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {paymentsLoading && !paymentsData ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3.5 w-36" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(summary.thisMonthRevenue)} this month
                    &middot; {formatCurrency(summary.todayRevenue)} today
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("payment-records")}
          className="text-left w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Payments
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {paymentsLoading && !paymentsData ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold tabular-nums">
                    {summary.totalPayments.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg {formatCurrency(summary.avgOrderValue)} &middot;{" "}
                    {summary.todayCount} today
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </button>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Plan Breakdown
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {paymentsLoading && !paymentsData ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-3.5 w-36" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold tabular-nums">
                  {summary.byPlanType.subscription.count} Sub &middot;{" "}
                  {summary.byPlanType.credit.count} Credit
                </div>
                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  {formatCurrency(summary.byPlanType.subscription.amount)} /{" "}
                  {formatCurrency(summary.byPlanType.credit.amount)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <button
          type="button"
          onClick={() => {
            if (pendingGatewayCount > 0) {
              setTxStatusFilter("pending");
              setTxPage(1);
            }
            scrollToSection("gateway-transactions");
          }}
          className="text-left w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card
            className={cn(
              "h-full transition-colors hover:border-foreground/30",
              pendingGatewayCount > 0 && "border-amber-500/40 bg-amber-500/5",
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Gateway Queue
              </CardTitle>
              <Activity
                className={cn(
                  "h-4 w-4",
                  pendingGatewayCount > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground",
                )}
              />
            </CardHeader>
            <CardContent>
              {txLoading && !txData ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3.5 w-36" />
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      "text-2xl font-bold tabular-nums",
                      pendingGatewayCount > 0 &&
                      "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {pendingGatewayCount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statusSummary.failed || 0} failed &middot;{" "}
                    {statusSummary.expired || 0} expired
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Section 1: Recorded Payment History */}
      <Card id="payment-records" className="scroll-mt-4">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Recorded Payment History
                </CardTitle>
                {hasActivePaymentFilters && paymentsData && (
                  <Badge variant="secondary" className="tabular-nums text-xs">
                    {filteredSummary.totalCount.toLocaleString()} matched
                    &middot; {formatCurrency(filteredSummary.totalAmount)}
                  </Badge>
                )}
              </div>
              <CardDescription>
                Completed and manually recorded transactions ledger
              </CardDescription>
            </div>
            {paymentsFetching && !paymentsLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Updating...
              </span>
            )}
          </div>

          {/* Plan Type Quick Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                {
                  key: "all",
                  label: "All Plans",
                  count: summary.totalPayments,
                },
                {
                  key: "credit",
                  label: "Credit Packs",
                  count: summary.byPlanType.credit.count,
                },
                {
                  key: "subscription",
                  label: "Subscriptions",
                  count: summary.byPlanType.subscription.count,
                },
              ] as const
            ).map((pill) => {
              const active = planTypeFilter === pill.key;
              return (
                <Button
                  key={pill.key}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => {
                    setPlanTypeFilter(pill.key);
                    setCurrentPage(1);
                  }}
                  className="h-8 gap-1.5 text-xs"
                >
                  <span>{pill.label}</span>
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className={cn(
                      "h-4 px-1.5 text-[10px] tabular-nums",
                      active &&
                      "bg-background/20 text-inherit border-transparent",
                    )}
                  >
                    {pill.count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Search & Filters Toolbar */}
          <div className="flex flex-col xl:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customer, email, payment ID, Trx ID, or plan..."
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
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[135px] h-9">
                  <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={gatewayFilter}
                onValueChange={(val) => {
                  setGatewayFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Gateway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Gateways</SelectItem>
                  <SelectItem value="paystation">PayStation</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Picker */}
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 justify-start text-left font-normal gap-1.5",
                        !dateRange?.from && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <span className="text-xs">
                            {format(dateRange.from, "MMM dd")} &ndash;{" "}
                            {format(dateRange.to, "MMM dd, yy")}
                          </span>
                        ) : (
                          <span className="text-xs">
                            {format(dateRange.from, "MMM dd, yyyy")}
                          </span>
                        )
                      ) : (
                        <span className="text-xs">Date Range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateRange(range);
                        setCurrentPage(1);
                      }}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
                {dateRange?.from && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-8"
                    onClick={() => {
                      setDateRange(undefined);
                      setCurrentPage(1);
                    }}
                    aria-label="Clear date range"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <Select
                value={sortBy}
                onValueChange={(val) => {
                  setSortBy(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[125px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="gateway">Gateway</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
                  setCurrentPage(1);
                }}
                className="h-9 gap-1.5"
                title={`Sort order: ${sortOrder}`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="text-xs uppercase">{sortOrder}</span>
              </Button>

              {hasActivePaymentFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetPaymentFilters}
                  className="h-9 text-xs text-muted-foreground"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {paymentsLoading ||
            (paymentsFetching && payments.length === 0 && !paymentsHasError) ? (
            <PaymentsTableSkeleton rows={pageSize} />
          ) : paymentsHasError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm text-muted-foreground">
                {paymentsResponse && !paymentsResponse.success
                  ? paymentsResponse.message
                  : "Failed to load payment records"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchPayments()}
              >
                Try Again
              </Button>
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 px-4 text-center space-y-3">
              <Receipt className="h-9 w-9 text-muted-foreground/50 mx-auto" />
              <div className="space-y-1">
                <p className="font-medium">No payment records found</p>
                <p className="text-sm text-muted-foreground">
                  {hasActivePaymentFilters
                    ? "Try adjusting your search query, gateway, or date range."
                    : "Completed customer payments will appear here."}
                </p>
              </div>
              {hasActivePaymentFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetPaymentFilters}
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
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Plan &amp; Gateway</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => {
                      const customer = getCustomerFromPayment(payment);
                      return (
                        <TableRow
                          key={payment._id}
                          className="hover:bg-muted/40"
                        >
                          <TableCell className="whitespace-nowrap">
                            <div className="text-sm font-medium">
                              {format(
                                new Date(payment.createdAt),
                                "MMM dd, yyyy",
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(payment.createdAt), "hh:mm a")}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2.5 min-w-[180px]">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage
                                  src={customer.avatar || undefined}
                                  alt={customer.name}
                                />
                                <AvatarFallback className="text-xs">
                                  {getInitials(customer.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                {customer.id ? (
                                  <Link
                                    href={`/admin/users/${encodeURIComponent(customer.id)}`}
                                    className="font-medium text-sm hover:underline truncate block"
                                  >
                                    {customer.name}
                                  </Link>
                                ) : (
                                  <p className="font-medium text-sm truncate">
                                    {customer.name}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground truncate">
                                  {customer.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1 max-w-[230px]">
                              <div className="flex items-center gap-1">
                                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono truncate">
                                  {payment.paymentID}
                                </code>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(
                                      payment.paymentID,
                                      "Payment ID",
                                      `pid-${payment._id}`,
                                    )
                                  }
                                  aria-label="Copy Payment ID"
                                  className="text-muted-foreground hover:text-foreground shrink-0"
                                >
                                  {copiedKey === `pid-${payment._id}` ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                                <span className="truncate">
                                  TRX: {payment.trxID}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(
                                      payment.trxID,
                                      "Transaction ID",
                                      `trx-${payment._id}`,
                                    )
                                  }
                                  aria-label="Copy Transaction ID"
                                  className="hover:text-foreground shrink-0"
                                >
                                  {copiedKey === `trx-${payment._id}` ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm font-medium truncate max-w-[160px]">
                                {payment.plan?.name || "Plan"}
                              </p>
                              <div className="flex flex-wrap items-center gap-1">
                                {getPlanTypeBadge(payment.plan?.type)}
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] capitalize"
                                >
                                  {payment.paymentMethod ||
                                    payment.gateway ||
                                    "paystation"}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatCurrency(payment.amount)}
                          </TableCell>

                          <TableCell>
                            {getPaymentStatusBadge(
                              payment.transactionStatus ?? payment.status,
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                              className="h-8 px-2.5 text-xs gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Receipt</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y rounded-lg border">
                {payments.map((payment) => {
                  const customer = getCustomerFromPayment(payment);
                  return (
                    <div key={payment._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage
                              src={customer.avatar || undefined}
                              alt={customer.name}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(customer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {customer.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                        {getPaymentStatusBadge(
                          payment.transactionStatus ?? payment.status,
                        )}
                      </div>

                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium">
                            {payment.plan?.name || "Plan"}
                          </span>
                          {getPlanTypeBadge(payment.plan?.type)}
                        </div>
                        <span className="text-base font-bold tabular-nums shrink-0">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>

                      <div className="rounded-md bg-muted/40 p-2.5 space-y-1 text-xs font-mono">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">
                            ID: {payment.paymentID}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                payment.paymentID,
                                "Payment ID",
                                `m-pid-${payment._id}`,
                              )
                            }
                            aria-label="Copy Payment ID"
                          >
                            {copiedKey === `m-pid-${payment._id}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-muted-foreground">
                          <span className="truncate">TRX: {payment.trxID}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                payment.trxID,
                                "Transaction ID",
                                `m-trx-${payment._id}`,
                              )
                            }
                            aria-label="Copy Transaction ID"
                          >
                            {copiedKey === `m-trx-${payment._id}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDateTime(payment.createdAt)}</span>
                        <span className="capitalize">
                          {payment.paymentMethod ||
                            payment.gateway ||
                            "paystation"}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                          className="flex-1 h-8 text-xs gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Receipt</span>
                        </Button>
                        {customer.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 text-xs gap-1"
                          >
                            <Link
                              href={`/admin/users/${encodeURIComponent(customer.id)}`}
                            >
                              <span>Profile</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Rows</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    const next = Number.parseInt(val, 10);
                    if (Number.isFinite(next) && next > 0) {
                      setPageSize(next);
                      setCurrentPage(1);
                    }
                  }}
                >
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
                Showing {paymentStartItem}–{paymentEndItem} of{" "}
                {paymentPagination.total.toLocaleString()} payments
              </span>
            </div>

            <PaginationView
              currentPage={paymentPagination.page}
              totalPages={Math.max(1, paymentPagination.totalPages)}
              handlePageChange={setCurrentPage}
              isLoading={paymentsFetching}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Gateway Checkout Audit & Reconciliation (Always Visible Directly Below) */}
      <Card id="gateway-transactions" className="scroll-mt-4">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Gateway Checkout Audit &amp; Reconciliation
                </CardTitle>
                <Badge variant="secondary" className="tabular-nums">
                  {totalGatewayTxCount.toLocaleString()}
                </Badge>
              </div>
              <CardDescription>
                Inspect checkout attempts, promo code redemptions, fulfillment
                steps, and manually reconcile incomplete payments
              </CardDescription>
            </div>
            {txFetching && !txLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Updating...
              </span>
            )}
          </div>

          {/* Gateway Status Quick Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: "all", label: "All", count: totalGatewayTxCount },
                {
                  key: "pending",
                  label: "Pending",
                  count: statusSummary.pending || 0,
                },
                {
                  key: "initiated",
                  label: "Initiated",
                  count: statusSummary.initiated || 0,
                },
                {
                  key: "completed",
                  label: "Completed",
                  count: statusSummary.completed || 0,
                },
                {
                  key: "failed",
                  label: "Failed",
                  count: statusSummary.failed || 0,
                },
                {
                  key: "amount_mismatch",
                  label: "Mismatch",
                  count: statusSummary.amount_mismatch || 0,
                },
                {
                  key: "expired",
                  label: "Expired",
                  count: statusSummary.expired || 0,
                },
                {
                  key: "canceled",
                  label: "Canceled",
                  count: statusSummary.canceled || 0,
                },
              ] as const
            ).map((pill) => {
              const active = txStatusFilter === pill.key;
              return (
                <Button
                  key={pill.key}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => {
                    setTxStatusFilter(pill.key);
                    setTxPage(1);
                  }}
                  className="h-8 gap-1.5 text-xs"
                >
                  <span>{pill.label}</span>
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className={cn(
                      "h-4 px-1.5 text-[10px] tabular-nums",
                      active &&
                      "bg-background/20 text-inherit border-transparent",
                    )}
                  >
                    {pill.count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Gateway Search Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number, Trx ID, customer name, or email..."
                value={txSearchInput}
                onChange={(e) => setTxSearchInput(e.target.value)}
                className="pl-9 pr-9"
              />
              {txSearchInput && (
                <button
                  type="button"
                  onClick={() => setTxSearchInput("")}
                  aria-label="Clear transaction search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {hasActiveTxFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetTxFilters}
                className="h-9 text-xs text-muted-foreground shrink-0"
              >
                Reset
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {txLoading ||
            (txFetching && transactions.length === 0 && !txHasError) ? (
            <GatewayTransactionsTableSkeleton rows={txLimit} />
          ) : txHasError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm text-muted-foreground">
                {transactionsResponse && !transactionsResponse.success
                  ? transactionsResponse.message
                  : "Failed to load gateway transactions"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchTransactions()}
              >
                Try Again
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground space-y-2">
              <Activity className="h-9 w-9 mx-auto text-muted-foreground/50" />
              <p className="text-sm font-medium">
                No checkout transactions found
              </p>
              {hasActiveTxFilters && (
                <Button variant="outline" size="sm" onClick={resetTxFilters}>
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
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan &amp; Promo</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fulfillment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => {
                      const customer = getCustomerFromTx(tx);
                      const completedSteps = countCompletedFulfillmentSteps(
                        tx.fulfillmentSteps,
                      );
                      const canReconcile =
                        Boolean(tx.invoiceNumber) && tx.status !== "completed";

                      return (
                        <TableRow
                          key={tx.id || tx.invoiceNumber}
                          className="hover:bg-muted/40"
                        >
                          <TableCell>
                            <div className="space-y-1 max-w-[210px]">
                              <div className="flex items-center gap-1">
                                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono truncate">
                                  {tx.invoiceNumber || "—"}
                                </code>
                                {tx.invoiceNumber && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopy(
                                        tx.invoiceNumber!,
                                        "Invoice number",
                                        `inv-${tx.invoiceNumber}`,
                                      )
                                    }
                                    aria-label="Copy invoice number"
                                    className="text-muted-foreground hover:text-foreground shrink-0"
                                  >
                                    {copiedKey ===
                                      `inv-${tx.invoiceNumber}` ? (
                                      <Check className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {tx.trxId
                                  ? `TRX: ${tx.trxId}`
                                  : formatDateTime(tx.createdAt)}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="min-w-[160px]">
                              {customer.id ? (
                                <Link
                                  href={`/admin/users/${encodeURIComponent(customer.id)}`}
                                  className="font-medium text-sm hover:underline truncate block"
                                >
                                  {customer.name}
                                </Link>
                              ) : (
                                <p className="font-medium text-sm truncate">
                                  {customer.name}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground truncate">
                                {customer.email}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm font-medium truncate max-w-[150px]">
                                {tx.plan?.name || "—"}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {getPlanTypeBadge(tx.plan?.type)}
                                {tx.promoCode?.code && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-mono gap-1"
                                  >
                                    <Tag className="h-2.5 w-2.5" />
                                    {tx.promoCode.code} (-
                                    {tx.promoCode.discountPercent}%)
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-right tabular-nums">
                            <p className="font-semibold text-sm">
                              {formatCurrency(
                                tx.pricing?.expectedAmount ?? tx.amount,
                              )}
                            </p>
                            {tx.pricing?.paidAmount !== null &&
                              tx.pricing?.paidAmount !== undefined &&
                              tx.pricing.paidAmount !==
                              tx.pricing.expectedAmount && (
                                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                  Paid {formatCurrency(tx.pricing.paidAmount)}
                                </p>
                              )}
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              {getPaymentStatusBadge(tx.status)}
                              {tx.gatewayStatus && (
                                <p className="text-[11px] text-muted-foreground">
                                  GW: {tx.gatewayStatus}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[11px] tabular-nums",
                                completedSteps === 5 &&
                                "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
                              )}
                            >
                              {completedSteps}/5 steps
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {canReconcile && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    reconcilingInvoice === tx.invoiceNumber
                                  }
                                  onClick={() =>
                                    handleReconcileSingle(tx.invoiceNumber!)
                                  }
                                  className="h-8 px-2.5 text-xs gap-1"
                                >
                                  {reconcilingInvoice === tx.invoiceNumber ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                  )}
                                  <span>Reconcile</span>
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedTransaction(tx)}
                                className="h-8 px-2.5 text-xs gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Inspect</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y rounded-lg border">
                {transactions.map((tx) => {
                  const customer = getCustomerFromTx(tx);
                  const completedSteps = countCompletedFulfillmentSteps(
                    tx.fulfillmentSteps,
                  );
                  const canReconcile =
                    Boolean(tx.invoiceNumber) && tx.status !== "completed";

                  return (
                    <div
                      key={tx.id || tx.invoiceNumber}
                      className="p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <code className="text-xs font-mono font-semibold truncate block">
                            {tx.invoiceNumber || "—"}
                          </code>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {customer.name} &middot; {customer.email}
                          </p>
                        </div>
                        {getPaymentStatusBadge(tx.status)}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-foreground">
                            {tx.plan?.name || "—"}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {completedSteps}/5 steps
                          </Badge>
                        </div>
                        <span className="font-bold text-sm tabular-nums">
                          {formatCurrency(
                            tx.pricing?.expectedAmount ?? tx.amount,
                          )}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {canReconcile && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={reconcilingInvoice === tx.invoiceNumber}
                            onClick={() =>
                              handleReconcileSingle(tx.invoiceNumber!)
                            }
                            className="flex-1 h-8 text-xs gap-1"
                          >
                            {reconcilingInvoice === tx.invoiceNumber ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                            <span>Reconcile</span>
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTransaction(tx)}
                          className="flex-1 h-8 text-xs gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Rows</span>
                <Select
                  value={String(txLimit)}
                  onValueChange={(val) => {
                    const next = Number.parseInt(val, 10);
                    if (Number.isFinite(next) && next > 0) {
                      setTxLimit(next);
                      setTxPage(1);
                    }
                  }}
                >
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
                Showing {txStartItem}–{txEndItem} of{" "}
                {txPagination.total.toLocaleString()} transactions
              </span>
            </div>

            <PaginationView
              currentPage={txPagination.page}
              totalPages={Math.max(1, txPagination.totalPages)}
              handlePageChange={setTxPage}
              isLoading={txFetching}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog 1: Payment Receipt Details */}
      <Dialog
        open={Boolean(selectedPayment)}
        onOpenChange={(open) => {
          if (!open) setSelectedPayment(null);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>
              Recorded transaction receipt details
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (() => {
            const customer = getCustomerFromPayment(selectedPayment);
            const detailsEntries = selectedPayment.paymentDetails
              ? Object.entries(selectedPayment.paymentDetails).filter(
                ([, v]) => v !== null && v !== undefined && v !== "",
              )
              : [];

            return (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border bg-muted/40 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount Paid</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatCurrency(selectedPayment.amount)}
                    </p>
                  </div>
                  {getPaymentStatusBadge(
                    selectedPayment.transactionStatus ?? selectedPayment.status,
                  )}
                </div>

                <div className="space-y-2.5 rounded-lg border p-3.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Customer</span>
                    {customer.id ? (
                      <Link
                        href={`/admin/users/${encodeURIComponent(customer.id)}`}
                        className="font-medium hover:underline inline-flex items-center gap-1"
                      >
                        {customer.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="font-medium">{customer.name}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Email</span>
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">
                      {selectedPayment.plan?.name || "—"} (
                      {selectedPayment.plan?.type || "—"})
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Gateway</span>
                    <span className="capitalize font-medium">
                      {selectedPayment.paymentMethod ||
                        selectedPayment.gateway ||
                        "paystation"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Payment ID</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          selectedPayment.paymentID,
                          "Payment ID",
                          `dlg-pid-${selectedPayment._id}`,
                        )
                      }
                      className="font-mono inline-flex items-center gap-1 hover:underline"
                    >
                      {selectedPayment.paymentID}
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Trx ID</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          selectedPayment.trxID,
                          "Transaction ID",
                          `dlg-trx-${selectedPayment._id}`,
                        )
                      }
                      className="font-mono inline-flex items-center gap-1 hover:underline"
                    >
                      {selectedPayment.trxID}
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Recorded At</span>
                    <span>{formatDateTime(selectedPayment.createdAt)}</span>
                  </div>
                </div>

                {detailsEntries.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Gateway Metadata
                    </p>
                    <div className="rounded-lg border p-3 space-y-1.5 text-xs max-h-48 overflow-y-auto">
                      {detailsEntries.map(([key, val]) => (
                        <div
                          key={key}
                          className="flex justify-between gap-3 border-b last:border-b-0 pb-1 last:pb-0"
                        >
                          <span className="text-muted-foreground font-mono">
                            {key}
                          </span>
                          <span className="font-mono text-right break-all">
                            {typeof val === "object"
                              ? JSON.stringify(val)
                              : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog 2: Gateway Transaction Audit Trail */}
      <Dialog
        open={Boolean(selectedTransaction)}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gateway Transaction Audit</DialogTitle>
            <DialogDescription>
              Invoice pricing breakdown, fulfillment state &amp; gateway event
              log
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border bg-muted/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {selectedTransaction.invoiceNumber || "—"}
                  </p>
                  <p className="text-2xl font-bold tabular-nums mt-0.5">
                    {formatCurrency(
                      selectedTransaction.pricing?.expectedAmount ??
                      selectedTransaction.amount,
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {getPaymentStatusBadge(selectedTransaction.status)}
                  {selectedTransaction.invoiceNumber &&
                    selectedTransaction.status !== "completed" && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          reconcilingInvoice ===
                          selectedTransaction.invoiceNumber
                        }
                        onClick={() =>
                          handleReconcileSingle(
                            selectedTransaction.invoiceNumber!,
                          )
                        }
                        className="h-8 gap-1.5 text-xs"
                      >
                        {reconcilingInvoice ===
                          selectedTransaction.invoiceNumber ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        )}
                        <span>Reconcile Now</span>
                      </Button>
                    )}
                </div>
              </div>

              {selectedTransaction.failureReason && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400">
                  <strong>Failure Reason:</strong>{" "}
                  {selectedTransaction.failureReason}
                </div>
              )}

              {/* Pricing Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-3.5 space-y-2 text-xs">
                  <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                    Pricing Breakdown
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price</span>
                    <span className="tabular-nums">
                      {formatCurrency(selectedTransaction.pricing?.basePrice ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan Discount</span>
                    <span className="tabular-nums">
                      -{formatCurrency(selectedTransaction.pricing?.planDiscountAmount ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Promo Discount{" "}
                      {selectedTransaction.promoCode?.code
                        ? `(${selectedTransaction.promoCode.code})`
                        : ""}
                    </span>
                    <span className="tabular-nums">
                      -{formatCurrency(selectedTransaction.pricing?.promoDiscountAmount ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t font-semibold">
                    <span>Expected Amount</span>
                    <span className="tabular-nums">
                      {formatCurrency(
                        selectedTransaction.pricing?.expectedAmount ??
                        selectedTransaction.amount,
                      )}
                    </span>
                  </div>
                </div>

                {/* Fulfillment Checklist */}
                <div className="rounded-lg border p-3.5 space-y-2 text-xs">
                  <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                    Fulfillment Checklist
                  </p>
                  {(
                    [
                      ["paymentRecorded", "Payment Recorded"],
                      ["planUpdated", "Plan Activated / Updated"],
                      ["referralProcessed", "Referral Commission"],
                      ["promoRecorded", "Promo Redemption Logged"],
                      ["emailSent", "Confirmation Email"],
                    ] as const
                  ).map(([key, label]) => {
                    const done = Boolean(
                      selectedTransaction.fulfillmentSteps?.[key],
                    );
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-muted-foreground">{label}</span>
                        {done ? (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                          >
                            Done
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-[10px]"
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Event Trail */}
              {selectedTransaction.events &&
                selectedTransaction.events.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Event Trail
                    </p>
                    <div className="divide-y rounded-lg border max-h-56 overflow-y-auto">
                      {selectedTransaction.events.map((ev, i) => (
                        <div key={i} className="p-2.5 text-xs space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-semibold">
                              {ev.type}
                            </span>
                            <span className="text-muted-foreground">
                              {ev.source} &middot; {formatDateTime(ev.at)}
                            </span>
                          </div>
                          {ev.message && (
                            <p className="text-muted-foreground">
                              {ev.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog 3: Live PayStation TRX Verification */}
      <Dialog
        open={verifyDialogOpen}
        onOpenChange={(open) => {
          setVerifyDialogOpen(open);
          if (!open) {
            setVerifyTrxInput("");
            setVerifyResult(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Live PayStation TRX Lookup</DialogTitle>
            <DialogDescription>
              Query PayStation directly by gateway transaction ID (trxId)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyTrxSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="verifyTrxId">Transaction ID (trxId)</Label>
              <div className="flex gap-2">
                <Input
                  id="verifyTrxId"
                  placeholder="Enter PayStation trx_id..."
                  value={verifyTrxInput}
                  onChange={(e) => setVerifyTrxInput(e.target.value)}
                  className="font-mono"
                />
                <Button
                  type="submit"
                  disabled={
                    verifyTrxMutation.isPending || !verifyTrxInput.trim()
                  }
                >
                  {verifyTrxMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Check"
                  )}
                </Button>
              </div>
            </div>
          </form>

          {verifyResult && (
            <div className="rounded-lg border p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lookup Status</span>
                <Badge variant={verifyResult.found ? "default" : "secondary"}>
                  {verifyResult.found ? "Found on Gateway" : "Not Found"}
                </Badge>
              </div>
              {verifyResult.message && (
                <p className="text-muted-foreground">{verifyResult.message}</p>
              )}
              {verifyResult.data && (
                <div className="pt-2 border-t space-y-1 max-h-48 overflow-y-auto">
                  {Object.entries(verifyResult.data)
                    .filter(([, v]) => v !== null && v !== undefined && v !== "")
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-muted-foreground font-mono">
                          {k}
                        </span>
                        <span className="font-mono text-right break-all">
                          {typeof v === "object"
                            ? JSON.stringify(v)
                            : String(v)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
