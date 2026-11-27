"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Download,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { QUERY_KEYS } from "@/services/constants";
import { usePaymentStatusQuery } from "@/services/queries/pricing";
import { useInvalidateDashboard } from "@/services/queries/dashboard";
import type { PaymentStatusData } from "@/types/pricing";
import { downloadReceiptPdf, type ReceiptPdfData } from "./receipt-pdf";

export interface PaymentStatusClientProps {
  invoice?: string;
  initialStatus?: string;
  initialMessage?: string;
  legacyAmount?: string;
  legacyPlan?: string;
  legacyPlanType?: string;
  legacyDuration?: string;
  legacyCredit?: string;
  legacyTrxID?: string;
  customerName?: string | null;
  customerEmail?: string | null;
}

const MAX_AUTO_POLLS = 4;
const AUTO_POLL_INTERVAL_MS = 2500;

function formatCurrency(
  amount: number | string | undefined | null,
  currency = "BDT"
): string {
  const num = Number(amount);
  if (!Number.isFinite(num)) return String(amount || "0");
  if (currency.toUpperCase() === "BDT") {
    return `৳${num.toLocaleString("en-US", {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${currency} ${num.toLocaleString("en-US")}`;
}

function formatDuration(days: number | string | null | undefined): string {
  if (days === null || days === undefined || days === "" || days === "N/A") {
    return "";
  }
  const numDays = parseInt(String(days), 10);
  if (!Number.isFinite(numDays) || numDays <= 0) return "";
  if (numDays >= 365) {
    const years = Math.floor(numDays / 365);
    return `${years} Year${years > 1 ? "s" : ""}`;
  }
  if (numDays >= 30) {
    const months = Math.floor(numDays / 30);
    return `${months} Month${months > 1 ? "s" : ""}`;
  }
  return `${numDays} Day${numDays > 1 ? "s" : ""}`;
}

function parseValidDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatGatewayLabel(gateway?: string | null): string {
  if (!gateway) return "PayStation";
  if (gateway.toLowerCase() === "paystation") return "PayStation";
  return gateway;
}

export function PaymentStatusClient({
  invoice,
  initialStatus,
  initialMessage,
  legacyAmount,
  legacyPlan,
  legacyPlanType,
  legacyDuration,
  legacyCredit,
  legacyTrxID,
  customerName,
  customerEmail,
}: PaymentStatusClientProps) {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const invalidateDashboard = useInvalidateDashboard();
  const hasInvalidatedRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: statusRes,
    isLoading: isQueryLoading,
    refetch,
  } = usePaymentStatusQuery(invoice, {
    pollIntervalMs: AUTO_POLL_INTERVAL_MS,
    maxAutoPolls: MAX_AUTO_POLLS,
  });

  const dataUpdateCount = invoice
    ? (queryClient.getQueryState(QUERY_KEYS.paymentStatus(invoice))
        ?.dataUpdateCount ?? 0)
    : 0;

  const transaction: PaymentStatusData | null =
    statusRes?.success && statusRes.data?.transaction
      ? statusRes.data.transaction
      : null;

  const fetchError: string | null =
    statusRes && (!statusRes.success || !statusRes.data?.transaction)
      ? (!statusRes.success && statusRes.message
          ? statusRes.message
          : "Unable to verify payment status right now.")
      : null;

  const isLoading = Boolean(invoice) && isQueryLoading;

  const isPendingState = Boolean(
    transaction &&
      (transaction.status === "pending" ||
        transaction.status === "processing" ||
        transaction.status === "initiated")
  );

  const pollAttempt = Math.min(dataUpdateCount, MAX_AUTO_POLLS);
  const isAutoPolling = isPendingState && dataUpdateCount <= MAX_AUTO_POLLS;

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  // Determine effective display state
  const normalizedInitial = (initialStatus || "").toLowerCase();
  const effectiveStatus =
    transaction?.status ||
    (normalizedInitial === "success" || normalizedInitial === "completed"
      ? "completed"
      : normalizedInitial || (fetchError ? "verification_error" : "failed"));

  // Refresh cached dashboard queries once when payment succeeds
  useEffect(() => {
    if (effectiveStatus === "completed" && !hasInvalidatedRef.current) {
      hasInvalidatedRef.current = true;
      invalidateDashboard();
    }
  }, [effectiveStatus, invalidateDashboard]);

  const handleManualRefresh = async () => {
    if (!invoice || isRefreshing) return;
    setIsRefreshing(true);
    const result = await refetch();
    setIsRefreshing(false);

    const tx =
      result.data?.success && result.data.data?.transaction
        ? result.data.data.transaction
        : null;

    if (tx?.status === "completed") {
      toast.success("Payment confirmed! Your plan is now active.");
    } else if (
      tx?.status === "pending" ||
      tx?.status === "processing" ||
      tx?.status === "initiated"
    ) {
      toast.info("Still awaiting confirmation from PayStation.");
    } else if (!tx) {
      toast.error("Unable to verify payment status right now.");
    }
  };

  const handleCopy = useCallback(
    async (value: string, field: string, label = "Reference") => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          throw new Error("Clipboard API unavailable");
        }
        setCopiedField(field);
        toast.success(`${label} copied`);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => {
          setCopiedField(null);
        }, 2000);
      } catch {
        toast.error(`Unable to copy ${label.toLowerCase()}`);
      }
    },
    []
  );

  // 1. Loading / Initial Verification State
  if (isLoading && !transaction) {
    const verificationStages = [
      { label: "Connecting to PayStation", status: "done" as const },
      { label: "Verifying transaction", status: "active" as const },
      { label: "Activating your plan", status: "pending" as const },
    ];

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 sm:py-20">
        <MaxWidthWrapper className="w-full">
          <Card className="mx-auto max-w-lg border shadow-sm">
            <CardHeader className="flex flex-col items-center text-center space-y-4 pt-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-muted/40">
                <Loader2 className="h-7 w-7 animate-spin text-foreground" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Verifying your payment
                </h1>
                <p className="text-sm text-muted-foreground max-w-sm">
                  We are confirming your transaction directly with PayStation.
                  This usually takes a few seconds.
                </p>
              </div>
              {invoice && (
                <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground">
                  <span>Invoice:</span>
                  <span className="font-medium text-foreground">{invoice}</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="pb-8 pt-2">
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                {verificationStages.map((stage) => (
                  <div
                    key={stage.label}
                    className="flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      {stage.status === "done" ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : stage.status === "active" ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border bg-background text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                        </span>
                      )}
                      <span
                        className={cn(
                          stage.status === "pending"
                            ? "text-muted-foreground"
                            : "font-medium text-foreground"
                        )}
                      >
                        {stage.label}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {stage.status === "done"
                        ? "Done"
                        : stage.status === "active"
                          ? "Checking"
                          : "Next"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </MaxWidthWrapper>
      </div>
    );
  }

  // 2. Completed / Success State
  if (effectiveStatus === "completed") {
    const currency = transaction?.currency || "BDT";
    const amountRaw = transaction
      ? (transaction.paidAmount ?? transaction.amount)
      : legacyAmount;
    const amountDisplay = formatCurrency(amountRaw, currency);
    const planName = transaction?.plan?.name || legacyPlan || "GenMeta Plan";
    const planType =
      (transaction?.plan?.type || legacyPlanType || "subscription").toLowerCase();
    const isCredit = planType === "credit";
    const rawDuration = transaction?.plan?.planDuration ?? legacyDuration;
    const durationText = formatDuration(rawDuration);
    const parsedLegacyCredit =
      legacyCredit !== undefined && legacyCredit !== ""
        ? parseInt(legacyCredit, 10)
        : null;
    const creditCount =
      transaction?.plan?.credit ??
      (parsedLegacyCredit !== null && Number.isFinite(parsedLegacyCredit)
        ? parsedLegacyCredit
        : null);
    const trxIdValue = transaction?.trxId || legacyTrxID || null;
    const invoiceValue = transaction?.invoiceNumber || invoice || null;
    const methodValue = transaction?.paymentMethod || null;
    const paidTimestamp =
      transaction?.fulfilledAt ||
      transaction?.verifiedAt ||
      transaction?.createdAt ||
      null;

    const baseDate = parseValidDate(paidTimestamp);
    const formattedPaidAt = baseDate
      ? format(baseDate, "MMM d, yyyy · h:mm a")
      : null;
    const durationDaysNum = Number(rawDuration);
    const validUntilDate =
      baseDate && Number.isFinite(durationDaysNum) && durationDaysNum > 0
        ? addDays(baseDate, durationDaysNum)
        : null;

    const pricing = transaction?.pricing;
    const basePrice = pricing?.basePrice ?? null;
    const planDiscountAmount = pricing?.planDiscountAmount ?? 0;
    const promoDiscountAmount = pricing?.promoDiscountAmount ?? 0;
    const expectedAmount = pricing?.expectedAmount ?? null;
    const paidAmountRaw =
      pricing?.paidAmount ?? transaction?.paidAmount ?? expectedAmount;
    const gatewayFee =
      pricing?.payWithCharge === 1 &&
      paidAmountRaw !== null &&
      expectedAmount !== null &&
      paidAmountRaw - expectedAmount > 0.01
        ? Math.round((paidAmountRaw - expectedAmount) * 100) / 100
        : 0;
    const totalSavings =
      Math.round((planDiscountAmount + promoDiscountAmount) * 100) / 100;

    const payerMobileNo = transaction?.payerMobileNo || null;
    const gatewayLabel = formatGatewayLabel(transaction?.gateway);
    const methodDisplay = methodValue
      ? payerMobileNo
        ? `${methodValue} (${payerMobileNo})`
        : methodValue
      : payerMobileNo || gatewayLabel;

    const basePriceDisplay =
      pricing && basePrice !== null ? formatCurrency(basePrice, currency) : null;
    const planDiscountDisplay =
      planDiscountAmount > 0
        ? formatCurrency(planDiscountAmount, currency)
        : null;
    const promoLabel = transaction?.promoCode?.code
      ? `Promo (${transaction.promoCode.code} · ${transaction.promoCode.discountPercent}%)`
      : "Promo discount";
    const promoDiscountDisplay =
      promoDiscountAmount > 0
        ? formatCurrency(promoDiscountAmount, currency)
        : null;
    const gatewayFeeDisplay =
      gatewayFee > 0 ? formatCurrency(gatewayFee, currency) : null;
    const totalPaidDisplay =
      pricing && paidAmountRaw !== null
        ? formatCurrency(paidAmountRaw, currency)
        : amountDisplay;
    const totalSavingsDisplay =
      totalSavings > 0 ? formatCurrency(totalSavings, currency) : null;

    const planMetaLine = (
      isCredit
        ? [
            "Credit Pack",
            creditCount !== null && Number.isFinite(creditCount)
              ? `${creditCount.toLocaleString()} credits`
              : null,
            durationText || null,
          ]
        : ["Subscription", "Unlimited", durationText || null]
    )
      .filter(Boolean)
      .join(" · ");

    const whatsappText = invoiceValue
      ? `Hi GenMeta Support, I have a question about my payment (Invoice: ${invoiceValue}).`
      : "Hi GenMeta Support, I have a question about my recent payment.";
    const whatsappUrl = `https://wa.me/8801817710493?text=${encodeURIComponent(
      whatsappText
    )}`;

    const handleDownloadPdf = async () => {
      if (isDownloadingPdf) return;
      setIsDownloadingPdf(true);
      try {
        const pdfData: ReceiptPdfData = {
          planName,
          planMetaLine,
          amountDisplay: totalPaidDisplay,
          currency,
          basePriceDisplay,
          planDiscountDisplay,
          promoLabel: promoDiscountDisplay ? promoLabel : null,
          promoDiscountDisplay,
          gatewayFeeDisplay,
          totalSavingsDisplay,
          invoiceNumber: invoiceValue,
          trxId: trxIdValue,
          paymentMethod: methodValue,
          payerMobileNo,
          gatewayLabel,
          paidAtDisplay: formattedPaidAt,
          customerName,
          customerEmail,
        };
        await downloadReceiptPdf(pdfData);
        toast.success("Receipt PDF downloaded");
      } catch {
        toast.error("Failed to generate receipt PDF");
      } finally {
        setIsDownloadingPdf(false);
      }
    };

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 sm:py-16">
        <MaxWidthWrapper className="w-full">
          <Card className="mx-auto max-w-xl border shadow-sm">
            <CardHeader className="flex flex-col items-center text-center space-y-3.5 pt-8 pb-4 px-6 sm:px-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Payment Confirmed</span>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  Payment successful
                </h1>
                <p className="text-sm text-muted-foreground max-w-md text-pretty">
                  {initialMessage ||
                    `Thank you for your purchase. Your ${planName} plan is now active and ready to use.`}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 px-6 sm:px-8 pb-6">
              {/* Activated Plan Summary Box */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold capitalize text-foreground">
                    {planName}
                  </h2>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1 font-medium text-xs",
                      isCredit
                        ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400"
                        : "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400"
                    )}
                  >
                    {isCredit ? (
                      <Coins className="h-3 w-3" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {isCredit ? "Credit Pack" : "Subscription"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {planMetaLine}
                  {validUntilDate
                    ? ` · Valid until ${format(validUntilDate, "MMM d, yyyy")}`
                    : ""}
                </p>
              </div>

              {/* Transaction Summary List */}
              <div className="rounded-xl border divide-y text-sm">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <div className="flex items-center gap-2">
                    {totalSavingsDisplay && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 text-[11px] tabular-nums"
                      >
                        Saved {totalSavingsDisplay}
                      </Badge>
                    )}
                    <span className="font-semibold tabular-nums text-foreground">
                      {totalPaidDisplay} {currency}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium text-right text-foreground">
                    {methodDisplay}
                  </span>
                </div>

                {formattedPaidAt && (
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium text-right text-foreground">
                      {formattedPaidAt}
                    </span>
                  </div>
                )}

                {invoiceValue && (
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-muted-foreground">Invoice Number</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(invoiceValue, "invoice", "Invoice number")
                      }
                      className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 font-mono text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span>{invoiceValue}</span>
                      {copiedField === "invoice" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                )}

                {trxIdValue && (
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(trxIdValue, "trxId", "Transaction ID")
                      }
                      className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 font-mono text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span>{trxIdValue}</span>
                      {copiedField === "trxId" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button asChild size="lg" className="h-11 flex-1 gap-2 font-medium">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="h-11 flex-1 gap-2 font-medium"
                >
                  {isDownloadingPdf ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download Receipt (PDF)</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Desktop App Shortcut */}
              <div className="text-center pt-1">
                <Link
                  href="/download"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Need the desktop app? Download GenMeta for Windows</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>

            <div className="border-t px-6 py-3.5 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <span>Need help?</span>
              <Link
                href="/contact"
                className="text-foreground underline underline-offset-4 hover:opacity-80"
              >
                Contact Support
              </Link>
              <span>·</span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:opacity-80"
              >
                WhatsApp
              </a>
            </div>
          </Card>
        </MaxWidthWrapper>
      </div>
    );
  }

  // 3. Pending / Processing State
  if (
    effectiveStatus === "pending" ||
    effectiveStatus === "processing" ||
    effectiveStatus === "initiated"
  ) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 sm:py-20">
        <MaxWidthWrapper className="w-full">
          <Card className="mx-auto max-w-xl border border-amber-500/30 shadow-sm">
            <CardHeader className="flex flex-col items-center text-center space-y-4 pt-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
                <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-amber-500",
                    isAutoPolling && "animate-pulse"
                  )}
                />
                <span>
                  {isAutoPolling
                    ? `Auto-checking gateway (${pollAttempt}/${MAX_AUTO_POLLS})...`
                    : "Awaiting confirmation"}
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Payment confirmation pending
                </h1>
                <p className="text-sm text-muted-foreground max-w-md">
                  Your transaction is still being confirmed by PayStation. Once
                  confirmed, your plan activates automatically on your account.
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6 sm:px-8">
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3 text-sm">
                {invoice && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Invoice Number</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(invoice, "pendingInvoice", "Invoice number")
                      }
                      className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 font-mono text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span>{invoice}</span>
                      {copiedField === "pendingInvoice" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                )}

                {transaction?.plan?.name && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium capitalize text-foreground">
                      {transaction.plan.name}
                    </span>
                  </div>
                )}

                {transaction?.amount !== undefined && transaction?.amount !== null && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 px-6 sm:px-8 pb-8 pt-2">
              {invoice && (
                <Button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing || isAutoPolling}
                  className="gap-2 w-full sm:w-auto"
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      (isRefreshing || isAutoPolling) && "animate-spin"
                    )}
                  />
                  <span>
                    {isRefreshing
                      ? "Checking..."
                      : isAutoPolling
                        ? "Checking automatically..."
                        : "Check Status Now"}
                  </span>
                </Button>
              )}
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        </MaxWidthWrapper>
      </div>
    );
  }

  // 4. Canceled State
  if (effectiveStatus === "canceled") {
    const returnHref = transaction?.plan?.id
      ? `/cart?planId=${encodeURIComponent(transaction.plan.id)}`
      : "/pricing";

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 sm:py-20">
        <MaxWidthWrapper className="w-full">
          <Card className="mx-auto max-w-xl border shadow-sm">
            <CardHeader className="flex flex-col items-center text-center space-y-4 pt-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-muted">
                <Ban className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Payment canceled — no charges were made
                </h1>
                <p className="text-sm text-muted-foreground max-w-md">
                  {transaction?.failureReason ||
                    initialMessage ||
                    "You canceled the payment checkout before completing it. Your account was not billed."}
                </p>
              </div>
            </CardHeader>

            {invoice && (
              <CardContent className="px-6 sm:px-8">
                <div className="rounded-xl border bg-muted/30 p-4 flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    Invoice Reference
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(invoice, "canceledInvoice", "Invoice number")
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 font-mono text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                  >
                    <span>{invoice}</span>
                    {copiedField === "canceledInvoice" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </CardContent>
            )}

            <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 px-6 sm:px-8 pb-8 pt-2">
              <Button asChild className="w-full sm:w-auto">
                <Link href={returnHref}>Return to Checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/pricing">View Plans</Link>
              </Button>
            </CardFooter>
          </Card>
        </MaxWidthWrapper>
      </div>
    );
  }

  // 5. Refunded State
  if (effectiveStatus === "refunded") {
    const refundedInvoice = transaction?.invoiceNumber || invoice || null;
    const refundedTrx = transaction?.trxId || legacyTrxID || null;
    const refundedAmount =
      transaction?.paidAmount ?? transaction?.amount ?? legacyAmount;

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 sm:py-20">
        <MaxWidthWrapper className="w-full">
          <Card className="mx-auto max-w-xl border border-blue-500/30 shadow-sm">
            <CardHeader className="flex flex-col items-center text-center space-y-4 pt-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10">
                <RotateCcw className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <Badge
                variant="outline"
                className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
              >
                Refunded
              </Badge>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Payment refunded
                </h1>
                <p className="text-sm text-muted-foreground max-w-md">
                  {transaction?.failureReason ||
                    initialMessage ||
                    "This transaction has been refunded. Depending on your payment method, funds may take a few business days to reflect."}
                </p>
              </div>
            </CardHeader>

            {(refundedInvoice || refundedTrx || refundedAmount) && (
              <CardContent className="px-6 sm:px-8">
                <div className="rounded-xl border bg-muted/30 p-4 space-y-3 text-sm">
                  {refundedInvoice && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        Invoice Number
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            refundedInvoice,
                            "refundInvoice",
                            "Invoice number"
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 font-mono text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                      >
                        <span>{refundedInvoice}</span>
                        {copiedField === "refundInvoice" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  )}

                  {refundedTrx && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        Transaction ID
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(refundedTrx, "refundTrx", "Transaction ID")
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 font-mono text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                      >
                        <span>{refundedTrx}</span>
                        {copiedField === "refundTrx" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  )}

                  {refundedAmount !== undefined && refundedAmount !== null && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(
                          refundedAmount,
                          transaction?.currency || "BDT"
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            )}

            <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 px-6 sm:px-8 pb-8 pt-2">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </CardFooter>
          </Card>
        </MaxWidthWrapper>
      </div>
    );
  }

  // 6. Failed / Expired / Amount Mismatch / Verification Error State
  const errorHeading =
    effectiveStatus === "expired"
      ? "Payment session expired"
      : effectiveStatus === "amount_mismatch"
        ? "Payment verification held"
        : effectiveStatus === "verification_error"
          ? "Verification unavailable"
          : "Payment failed";

  const errorDescription =
    effectiveStatus === "amount_mismatch"
      ? "The amount reported by the gateway did not match your order total. Please contact support with your invoice number."
      : transaction?.failureReason ||
        fetchError ||
        initialMessage ||
        "We could not complete your payment. No plan changes have been applied to your account.";

  const retryCheckoutHref = transaction?.plan?.id
    ? `/cart?planId=${encodeURIComponent(transaction.plan.id)}`
    : "/pricing";

  const mismatchWhatsappUrl = `https://wa.me/8801817710493?text=${encodeURIComponent(
    invoice
      ? `Hi GenMeta Support, my payment verification is held (Invoice: ${invoice}). Please help verify it.`
      : "Hi GenMeta Support, my payment verification is held. Please help verify it."
  )}`;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 sm:py-20">
      <MaxWidthWrapper className="w-full">
        <Card className="mx-auto max-w-xl border border-destructive/30 shadow-sm">
          <CardHeader className="flex flex-col items-center text-center space-y-4 pt-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10">
              {effectiveStatus === "verification_error" ||
              effectiveStatus === "amount_mismatch" ? (
                <AlertTriangle className="h-7 w-7 text-destructive" />
              ) : (
                <XCircle className="h-7 w-7 text-destructive" />
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {errorHeading}
              </h1>
              <p className="text-sm text-muted-foreground max-w-md">
                {errorDescription}
              </p>
            </div>
          </CardHeader>

          {invoice && (
            <CardContent className="px-6 sm:px-8">
              <div className="rounded-xl border bg-muted/30 p-4 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Invoice Number</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(invoice, "errorInvoice", "Invoice number")
                  }
                  className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 font-mono text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                >
                  <span>{invoice}</span>
                  {copiedField === "errorInvoice" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </CardContent>
          )}

          <CardFooter className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 px-6 sm:px-8 pb-8 pt-2">
            {invoice && effectiveStatus === "verification_error" && (
              <Button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                variant="secondary"
                className="gap-2 w-full sm:w-auto"
              >
                <RefreshCw
                  className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                />
                <span>Retry Verification</span>
              </Button>
            )}
            <Button asChild className="w-full sm:w-auto">
              <Link href={retryCheckoutHref}>Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/contact">Contact Support</Link>
            </Button>
            {effectiveStatus === "amount_mismatch" && (
              <Button
                asChild
                variant="outline"
                className="gap-1.5 w-full sm:w-auto"
              >
                <a
                  href={mismatchWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp Support</span>
                </a>
              </Button>
            )}
          </CardFooter>

          <div className="border-t px-6 py-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Need immediate help? Share your invoice number with support.</span>
          </div>
        </Card>
      </MaxWidthWrapper>
    </div>
  );
}
