"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Infinity as InfinityIcon,
  LayoutDashboard,
  Loader2,
  Lock,
  MessageCircle,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { WindowsIcon } from "@/components/Home";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { creditFeatures, premiumFeatures } from "@/app/(public)/pricing/features";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getPaymentStatus } from "@/services/pricing";
import { useInvalidateDashboard } from "@/services/queries/dashboard";
import type { PaymentStatusData } from "@/types/pricing";
import { PaymentReceiptCard } from "./receipt-card";
import { printReceiptWithTitle } from "./receipt-pdf";

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

const CHECKOUT_STEPS = ["Select Plan", "Payment", "Confirmed"] as const;

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
  const [transaction, setTransaction] = useState<PaymentStatusData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(invoice));
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAutoPolling, setIsAutoPolling] = useState<boolean>(false);
  const [pollAttempt, setPollAttempt] = useState<number>(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const invalidateDashboard = useInvalidateDashboard();
  const hasInvalidatedRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const fetchLatestStatus = useCallback(
    async (refresh = true): Promise<PaymentStatusData | null> => {
      if (!invoice) return null;
      const res = await getPaymentStatus(invoice, { refresh });
      if (res.success && res.data?.transaction) {
        setTransaction(res.data.transaction);
        setFetchError(null);
        return res.data.transaction;
      }
      setFetchError(
        !res.success && res.message
          ? res.message
          : "Unable to verify payment status right now."
      );
      return null;
    },
    [invoice]
  );

  useEffect(() => {
    if (!invoice) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const runVerification = async (attempt: number) => {
      const tx = await fetchLatestStatus(true);
      if (cancelled) return;

      setIsLoading(false);

      const isPendingState =
        tx &&
        (tx.status === "pending" ||
          tx.status === "processing" ||
          tx.status === "initiated");

      if (isPendingState && attempt < MAX_AUTO_POLLS) {
        setIsAutoPolling(true);
        setPollAttempt(attempt + 1);
        pollTimer = setTimeout(() => {
          if (!cancelled) {
            void runVerification(attempt + 1);
          }
        }, AUTO_POLL_INTERVAL_MS);
      } else {
        setIsAutoPolling(false);
      }
    };

    void runVerification(0);

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [invoice, fetchLatestStatus]);

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
    const tx = await fetchLatestStatus(true);
    setIsRefreshing(false);

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
    const durationDaysNum = Number(rawDuration);
    const validUntilDate =
      baseDate && Number.isFinite(durationDaysNum) && durationDaysNum > 0
        ? addDays(baseDate, durationDaysNum)
        : null;

    const totalSavings = transaction?.pricing
      ? Math.round(
          ((transaction.pricing.planDiscountAmount || 0) +
            (transaction.pricing.promoDiscountAmount || 0)) *
            100
        ) / 100
      : 0;

    const featuresList = isCredit ? creditFeatures : premiumFeatures;
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

    const capacitySummary = isCredit
      ? creditCount !== null && Number.isFinite(creditCount)
        ? `${(creditCount * 5).toLocaleString()} images or ${creditCount.toLocaleString()} videos${durationText ? ` · ${durationText} validity` : ""}`
        : "Built-in API access with priority processing"
      : `Unlimited metadata generation using your own Gemini API key${durationText ? ` · ${durationText}` : ""}`;

    const onboardingSteps = [
      {
        title: "Install or open GenMeta Desktop",
        description:
          "Launch GenMeta for Windows 10/11 on your computer, or download the latest installer if you haven't set it up yet.",
        actionHref: "/download",
        actionLabel: "Download installer",
      },
      {
        title: "Sign in with your GenMeta account",
        description: isCredit
          ? "Your new credits and built-in API access activate automatically — no external Gemini API key required."
          : "Your subscription unlocks immediately. Add your Gemini API key in desktop settings to start generating.",
      },
      {
        title: "Drop a folder and generate metadata",
        description:
          "Import photos, vectors, or stock videos to create relevance-ranked titles, descriptions, and keywords ready for CSV export or embedding.",
      },
    ];

    return (
      <div className="min-h-screen bg-background print:min-h-0 print:bg-white">
        <MaxWidthWrapper className="py-8 sm:py-12 space-y-6 sm:space-y-8 print:py-0 print:px-0 print:space-y-0">
          {/* Top Checkout Stepper & Trust Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5 print:hidden">
            <nav aria-label="Checkout progress" className="flex flex-wrap items-center gap-2 text-xs">
              {CHECKOUT_STEPS.map((label, idx) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium",
                      idx === CHECKOUT_STEPS.length - 1
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-border bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {idx + 1}. {label}
                    </span>
                  </span>
                  {idx < CHECKOUT_STEPS.length - 1 && (
                    <span className="text-muted-foreground/50">/</span>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Verified by PayStation</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => printReceiptWithTitle(invoiceValue)}
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Print Receipt</span>
              </Button>
            </div>
          </div>

          {/* Hero Confirmation Banner */}
          <section className="relative overflow-hidden rounded-2xl border bg-background px-6 py-8 sm:px-10 sm:py-12 print:hidden">
            <div
              aria-hidden
              className="lp-grid-bg pointer-events-none absolute inset-0 opacity-60 print:hidden"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.10),transparent_70%)] print:hidden"
            />

            <div className="relative flex flex-col items-center text-center space-y-4">
              {/* Animated SVG Checkmark Emblem */}
              <div className="relative flex h-16 w-16 items-center justify-center print:hidden">
                <span
                  aria-hidden
                  className="animate-payment-halo absolute inset-0 rounded-full bg-emerald-500/20"
                />
                <svg
                  viewBox="0 0 56 56"
                  className="relative h-16 w-16"
                  aria-hidden="true"
                >
                  <circle
                    cx="28"
                    cy="28"
                    r="25"
                    className="fill-emerald-500/10 stroke-emerald-600 dark:stroke-emerald-400 animate-payment-circle"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M17.5 28.5 L24.5 35.5 L38.5 21.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-emerald-600 dark:stroke-emerald-400 animate-payment-check"
                    strokeWidth="3"
                  />
                </svg>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Payment Confirmed</span>
              </div>

              <div className="space-y-2 max-w-2xl">
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                  Payment successful!
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground text-pretty">
                  {initialMessage ||
                    `Thank you for your purchase. Your ${planName} plan is active immediately and ready to use.`}
                </p>
              </div>

              {/* Compact Hero Meta Strip */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/90 px-3 py-1 font-medium tabular-nums text-foreground">
                  <span className="text-muted-foreground font-normal">Paid</span>
                  {amountDisplay} {currency}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/90 px-3 py-1 font-medium text-foreground">
                  {isCredit ? (
                    <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  )}
                  <span className="capitalize">{planName}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/90 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-400">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Active immediately</span>
                </span>
              </div>
            </div>
          </section>

          {/* Main 12-Column Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start print:block">
            {/* Left Column: Activated Plan & Onboarding */}
            <div className="lg:col-span-7 space-y-6 print:hidden">
              {/* Activated Plan Card */}
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Activated Plan
                    </CardTitle>
                    <CardDescription>
                      Entitlements unlocked on your GenMeta account
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Active Now</span>
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Highlighted Plan Box */}
                  <div className="rounded-xl border bg-muted/30 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 font-medium",
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

                        {durationText && (
                          <Badge
                            variant="secondary"
                            className="gap-1 font-normal"
                          >
                            <Calendar className="h-3 w-3" />
                            {durationText}
                          </Badge>
                        )}
                      </div>

                      {totalSavings > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 tabular-nums"
                        >
                          Saved {formatCurrency(totalSavings, currency)}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="space-y-1">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight capitalize text-foreground">
                          {planName}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {capacitySummary}
                        </p>
                      </div>

                      <div className="sm:text-right shrink-0 tabular-nums">
                        {isCredit &&
                        creditCount !== null &&
                        Number.isFinite(creditCount) ? (
                          <div>
                            <div className="text-2xl font-bold text-foreground">
                              {creditCount.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Credits added
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex sm:flex-col sm:items-end items-center gap-1.5 sm:gap-0.5">
                            <InfinityIcon className="h-6 w-6 text-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Unlimited quota
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Validity Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                      <span>
                        {baseDate
                          ? `Activated on ${format(baseDate, "MMM d, yyyy")}`
                          : "Instant activation enabled"}
                      </span>
                      {validUntilDate && (
                        <span className="font-medium text-foreground">
                          Valid until {format(validUntilDate, "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Included Features */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      What&apos;s included now
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {featuresList.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 text-sm text-foreground/90"
                        >
                          <div className="mt-0.5 h-4 w-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Primary & Secondary CTAs */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden">
                    <Button
                      asChild
                      size="lg"
                      className="h-11 gap-2 flex-1 sm:flex-initial font-medium"
                    >
                      <Link href="/dashboard">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Go to Dashboard</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-11 gap-2 flex-1 sm:flex-initial font-medium"
                    >
                      <Link href="/download">
                        <WindowsIcon className="h-4 w-4" />
                        <span>Download for Windows</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* What Happens Next Onboarding Card */}
              <Card className="print:hidden">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    What happens next
                  </CardTitle>
                  <CardDescription>
                    Start generating microstock metadata in three quick steps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-0">
                    {onboardingSteps.map((step, index) => (
                      <li
                        key={step.title}
                        className="relative flex gap-4 pb-6 last:pb-0"
                      >
                        {index < onboardingSteps.length - 1 && (
                          <span
                            aria-hidden
                            className="absolute left-[13px] top-8 h-[calc(100%-2rem)] w-px bg-border"
                          />
                        )}
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background font-mono text-[11px] font-medium text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="pt-0.5 space-y-1">
                          <h3 className="text-sm font-medium text-foreground">
                            {step.title}
                          </h3>
                          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                            {step.description}
                          </p>
                          {step.actionHref && step.actionLabel && (
                            <Link
                              href={step.actionHref}
                              className="inline-flex items-center gap-1 pt-0.5 text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                            >
                              <span>{step.actionLabel}</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Sticky Real Paper Receipt */}
            <div className="lg:col-span-5 print:w-full">
              <PaymentReceiptCard
                transaction={transaction}
                planName={planName}
                planMetaLine={planMetaLine}
                amountDisplay={amountDisplay}
                currency={currency}
                invoiceValue={invoiceValue}
                trxIdValue={trxIdValue}
                methodValue={methodValue}
                paidTimestamp={paidTimestamp}
                customerName={customerName}
                customerEmail={customerEmail}
                copiedField={copiedField}
                onCopy={handleCopy}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
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
