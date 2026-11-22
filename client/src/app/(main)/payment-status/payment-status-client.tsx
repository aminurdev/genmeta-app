"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Laptop,
  Loader2,
  Receipt,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPaymentStatus } from "@/services/pricing";
import { PaymentStatusData } from "@/types/pricing";

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
}: PaymentStatusClientProps) {
  const [transaction, setTransaction] = useState<PaymentStatusData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(invoice));
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
        pollTimer = setTimeout(() => {
          if (!cancelled) {
            void runVerification(attempt + 1);
          }
        }, AUTO_POLL_INTERVAL_MS);
      }
    };

    void runVerification(0);

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [invoice, fetchLatestStatus]);

  const handleManualRefresh = async () => {
    if (!invoice || isRefreshing) return;
    setIsRefreshing(true);
    await fetchLatestStatus(true);
    setIsRefreshing(false);
  };

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Determine effective display state
  const normalizedInitial = (initialStatus || "").toLowerCase();
  const effectiveStatus =
    transaction?.status ||
    (normalizedInitial === "success" || normalizedInitial === "completed"
      ? "completed"
      : normalizedInitial || (fetchError ? "verification_error" : "failed"));

  // 1. Loading / Initial Verification State
  if (isLoading && !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <Card className="w-full max-w-lg border shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-5">
            <div className="rounded-full p-4 bg-primary/10">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Verifying Payment
              </h1>
              <p className="text-muted-foreground text-sm max-w-sm">
                We are confirming your transaction directly with PayStation.
                Please wait a moment.
              </p>
              {invoice && (
                <p className="text-xs font-mono text-muted-foreground pt-2">
                  Invoice: {invoice}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Completed / Success State
  if (effectiveStatus === "completed") {
    const amountDisplay = transaction
      ? formatCurrency(transaction.amount, transaction.currency)
      : formatCurrency(legacyAmount, "BDT");
    const planName = transaction?.plan?.name || legacyPlan || "GenMeta Plan";
    const planType = transaction?.plan?.type || legacyPlanType || "subscription";
    const durationText = formatDuration(
      transaction?.plan?.planDuration ?? legacyDuration
    );
    const creditCount =
      transaction?.plan?.credit ??
      (legacyCredit ? parseInt(legacyCredit, 10) : null);
    const trxIdValue = transaction?.trxId || legacyTrxID || null;
    const invoiceValue = transaction?.invoiceNumber || invoice || null;
    const methodValue = transaction?.paymentMethod || null;
    const paidTimestamp = transaction?.fulfilledAt || transaction?.verifiedAt;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-emerald-950/20 dark:to-gray-950">
        <div className="w-full max-w-5xl">
          <Card className="border-2 border-green-200 dark:border-green-800 shadow-2xl overflow-hidden">
            <div className="bg-linear-to-br from-emerald-500/20 to-background p-8 relative overflow-hidden">
              <CardHeader className="flex flex-col items-center gap-4 p-0 relative z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-300/20 rounded-full animate-pulse" />
                  <div className="relative rounded-full p-4 bg-white shadow-xl ring-4 ring-emerald-200/50">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  </div>
                </div>

                <div className="text-center">
                  <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
                    Payment Successful!
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    {initialMessage ||
                      "Your payment has been verified and your plan is active."}
                  </p>
                </div>
              </CardHeader>
            </div>

            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transaction Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h2>Transaction Details</h2>
                </div>

                <div className="rounded-xl p-6 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 space-y-4">
                  {invoiceValue && (
                    <>
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-muted-foreground text-sm">
                          Invoice Number
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(invoiceValue, "invoice")}
                          className="inline-flex items-center gap-1.5 font-mono font-semibold text-xs sm:text-sm bg-background px-3 py-1 rounded-md border hover:bg-muted transition-colors cursor-pointer"
                          title="Copy Invoice Number"
                        >
                          {invoiceValue}
                          {copiedField === "invoice" ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      <Separator />
                    </>
                  )}

                  {trxIdValue && (
                    <>
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-muted-foreground flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4" />
                          Transaction ID
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(trxIdValue, "trxId")}
                          className="inline-flex items-center gap-1.5 font-mono font-semibold text-xs sm:text-sm bg-background px-3 py-1 rounded-md border hover:bg-muted transition-colors cursor-pointer"
                          title="Copy Transaction ID"
                        >
                          {trxIdValue}
                          {copiedField === "trxId" ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      <Separator />
                    </>
                  )}

                  {methodValue && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">
                          Payment Method
                        </span>
                        <Badge variant="secondary" className="font-medium">
                          {methodValue}
                        </Badge>
                      </div>
                      <Separator />
                    </>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4" />
                      Amount Paid
                    </span>
                    <span className="font-bold text-2xl text-green-600 dark:text-green-400">
                      {amountDisplay}
                    </span>
                  </div>

                  {paidTimestamp && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Paid At</span>
                        <span className="font-medium text-foreground">
                          {new Date(paidTimestamp).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Plan Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h2>Plan Details</h2>
                </div>

                <div className="rounded-xl p-6 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800 space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plan Name</span>
                    <span className="font-bold text-lg capitalize text-foreground">
                      {planName}
                    </span>
                  </div>

                  <Separator className="bg-green-200 dark:bg-green-800" />

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plan Type</span>
                    <span className="font-semibold capitalize px-3 py-1 rounded-full bg-linear-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 text-sm">
                      {planType}
                    </span>
                  </div>

                  {durationText && (
                    <>
                      <Separator className="bg-green-200 dark:bg-green-800" />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Duration
                        </span>
                        <span className="font-semibold text-foreground">
                          {durationText}
                        </span>
                      </div>
                    </>
                  )}

                  {planType === "credit" &&
                    creditCount !== null &&
                    Number.isFinite(creditCount) && (
                      <>
                        <Separator className="bg-green-200 dark:bg-green-800" />
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-emerald-500" />
                            Credits Included
                          </span>
                          <span className="font-bold text-xl text-green-600 dark:text-green-400 flex items-center gap-1">
                            {creditCount.toLocaleString()} Credits
                          </span>
                        </div>
                      </>
                    )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 p-8 pt-0">
              <Button
                asChild
                variant="outline"
                className="gap-2 w-full sm:w-auto border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/20"
              >
                <Link href="/dashboard" aria-label="Go to Dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button
                asChild
                className="gap-2 w-full sm:w-auto bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30"
              >
                <Link href="/download" aria-label="Download App">
                  <Laptop className="h-4 w-4" />
                  Download App
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-amber-50 via-yellow-50/40 to-background dark:from-gray-950 dark:via-amber-950/10 dark:to-gray-950">
        <Card className="w-full max-w-xl border-2 border-amber-200 dark:border-amber-800 shadow-xl">
          <CardHeader className="flex flex-col items-center text-center gap-4 pt-8">
            <div className="rounded-full p-4 bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Payment Confirmation Pending
              </h1>
              <p className="text-muted-foreground text-sm max-w-md">
                Your transaction is still being confirmed by the payment
                gateway. Once confirmed, your plan activates automatically.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-8">
            <div className="rounded-xl p-4 bg-muted/50 border space-y-2 text-sm">
              {invoice && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Invoice Number</span>
                  <span className="font-mono font-medium">{invoice}</span>
                </div>
              )}
              {transaction?.plan?.name && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{transaction.plan.name}</span>
                </div>
              )}
              {transaction?.amount && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 p-8 pt-4">
            {invoice && (
              <Button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="gap-2 w-full sm:w-auto"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Checking..." : "Verify Status Again"}
              </Button>
            )}
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 4. Canceled State
  if (effectiveStatus === "canceled") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <Card className="w-full max-w-xl border shadow-xl">
          <CardHeader className="flex flex-col items-center text-center gap-4 pt-8">
            <div className="rounded-full p-4 bg-muted">
              <Ban className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Payment Canceled
              </h1>
              <p className="text-muted-foreground text-sm max-w-md">
                {transaction?.failureReason ||
                  initialMessage ||
                  "You canceled the payment checkout. No charges were made."}
              </p>
            </div>
          </CardHeader>

          {invoice && (
            <CardContent className="px-8">
              <div className="rounded-lg p-3 bg-muted/50 border flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Invoice Reference</span>
                <span className="font-mono font-medium">{invoice}</span>
              </div>
            </CardContent>
          )}

          <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 p-8 pt-4">
            <Button asChild className="w-full sm:w-auto">
              <Link
                href={
                  transaction?.plan?.id
                    ? `/cart?planId=${transaction.plan.id}`
                    : "/pricing"
                }
              >
                Return to Cart
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 5. Failed / Expired / Amount Mismatch / Verification Error State
  const errorHeading =
    effectiveStatus === "expired"
      ? "Payment Session Expired"
      : effectiveStatus === "amount_mismatch"
        ? "Payment Verification Held"
        : effectiveStatus === "verification_error"
          ? "Verification Unavailable"
          : "Payment Failed";

  const errorDescription =
    effectiveStatus === "amount_mismatch"
      ? "The amount reported by the gateway did not match your order total. Please contact support with your invoice number."
      : transaction?.failureReason ||
        fetchError ||
        initialMessage ||
        "We could not complete your payment. No plan changes have been applied.";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-red-50 via-rose-50/40 to-background dark:from-gray-950 dark:via-red-950/10 dark:to-gray-950">
      <Card className="w-full max-w-xl border-2 border-destructive/30 shadow-xl">
        <CardHeader className="flex flex-col items-center text-center gap-4 pt-8">
          <div className="rounded-full p-4 bg-destructive/10">
            {effectiveStatus === "verification_error" ||
            effectiveStatus === "amount_mismatch" ? (
              <AlertTriangle className="h-12 w-12 text-destructive" />
            ) : (
              <XCircle className="h-12 w-12 text-destructive" />
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {errorHeading}
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">
              {errorDescription}
            </p>
          </div>
        </CardHeader>

        {invoice && (
          <CardContent className="px-8">
            <div className="rounded-xl p-4 bg-muted/50 border flex justify-between items-center text-sm gap-3">
              <span className="text-muted-foreground">Invoice Number</span>
              <button
                type="button"
                onClick={() => handleCopy(invoice, "errorInvoice")}
                className="inline-flex items-center gap-1.5 font-mono font-medium bg-background px-2.5 py-1 rounded border hover:bg-muted cursor-pointer"
              >
                {invoice}
                {copiedField === "errorInvoice" ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 p-8 pt-4">
          {invoice && effectiveStatus === "verification_error" && (
            <Button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              variant="secondary"
              className="gap-2 w-full sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Retry Verification
            </Button>
          )}
          <Button asChild className="w-full sm:w-auto">
            <Link
              href={
                transaction?.plan?.id
                  ? `/cart?planId=${transaction.plan.id}`
                  : "/pricing"
              }
            >
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/contact">Contact Support</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
