"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  Check,
  Copy,
  Mail,
  MessageCircle,
  Printer,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PaymentStatusData } from "@/types/pricing";

export interface PaymentReceiptCardProps {
  transaction: PaymentStatusData | null;
  planName: string;
  amountDisplay: string;
  currency: string;
  invoiceValue: string | null;
  trxIdValue: string | null;
  methodValue: string | null;
  paidTimestamp?: string | null;
  copiedField: string | null;
  onCopy: (value: string, field: string, label: string) => void;
  formatCurrency: (
    amount: number | string | undefined | null,
    currency?: string
  ) => string;
}

function formatPaidTimestamp(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

function formatGatewayLabel(gateway?: string | null): string {
  if (!gateway) return "PayStation";
  if (gateway.toLowerCase() === "paystation") return "PayStation";
  return gateway;
}

export function PaymentReceiptCard({
  transaction,
  planName,
  amountDisplay,
  currency,
  invoiceValue,
  trxIdValue,
  methodValue,
  paidTimestamp,
  copiedField,
  onCopy,
  formatCurrency,
}: PaymentReceiptCardProps) {
  const formattedPaidAt = formatPaidTimestamp(paidTimestamp);
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

  const whatsappText = invoiceValue
    ? `Hi GenMeta Support, I have a question about my payment (Invoice: ${invoiceValue}).`
    : "Hi GenMeta Support, I have a question about my recent payment.";
  const whatsappUrl = `https://wa.me/8801817710493?text=${encodeURIComponent(
    whatsappText
  )}`;

  const payerMobileNo = transaction?.payerMobileNo || null;
  const gatewayLabel = formatGatewayLabel(transaction?.gateway);

  return (
    <div className="lg:sticky lg:top-24">
      <Card className="overflow-hidden border shadow-sm print:shadow-none print:border-border">
        <CardHeader className="space-y-4 pb-5">
          {/* Print-only Brand Header */}
          <div className="hidden print:flex items-center justify-between border-b pb-4">
            <div>
              <p className="text-base font-bold tracking-tight text-foreground">
                GenMeta
              </p>
              <p className="text-xs text-muted-foreground">
                GenMeta Technologies
              </p>
            </div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Official Payment Receipt
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span>Payment Receipt</span>
            </CardTitle>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
            >
              Paid
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Amount Paid
            </p>
            <div className="flex items-baseline gap-1.5 tabular-nums">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {amountDisplay}
              </span>
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {currency}
              </span>
            </div>
            {formattedPaidAt && (
              <p className="text-xs text-muted-foreground pt-0.5">
                Paid on {formattedPaidAt}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Itemized Pricing Breakdown */}
          <div className="border-t border-dashed pt-4 space-y-2.5 text-sm">
            {pricing && basePrice !== null ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground truncate">
                    {planName}
                  </span>
                  <span className="font-medium tabular-nums shrink-0">
                    {formatCurrency(basePrice, currency)}
                  </span>
                </div>

                {planDiscountAmount > 0 && (
                  <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400">
                    <span>Plan discount</span>
                    <span className="tabular-nums shrink-0">
                      -{formatCurrency(planDiscountAmount, currency)}
                    </span>
                  </div>
                )}

                {promoDiscountAmount > 0 && (
                  <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400">
                    <span>
                      {transaction?.promoCode?.code
                        ? `Promo ${transaction.promoCode.code} (${transaction.promoCode.discountPercent}%)`
                        : "Promo discount"}
                    </span>
                    <span className="tabular-nums shrink-0">
                      -{formatCurrency(promoDiscountAmount, currency)}
                    </span>
                  </div>
                )}

                {gatewayFee > 0 && (
                  <div className="flex items-center justify-between gap-3 text-muted-foreground">
                    <span>Gateway charge</span>
                    <span className="tabular-nums shrink-0">
                      +{formatCurrency(gatewayFee, currency)}
                    </span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex items-baseline justify-between gap-3 font-semibold text-foreground">
                  <span>Total Paid</span>
                  <span className="tabular-nums">
                    {formatCurrency(paidAmountRaw, currency)} {currency}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
                    You saved {formatCurrency(totalSavings, currency)} on this
                    order
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground truncate">
                    {planName}
                  </span>
                  <span className="font-medium tabular-nums shrink-0">
                    {amountDisplay}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-baseline justify-between gap-3 font-semibold text-foreground">
                  <span>Total Paid</span>
                  <span className="tabular-nums">
                    {amountDisplay} {currency}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Transaction Reference Metadata */}
          <dl className="border-t border-dashed pt-4 space-y-3 text-sm">
            {invoiceValue && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground shrink-0">
                  Invoice Number
                </dt>
                <dd className="min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(invoiceValue, "invoice", "Invoice number")
                    }
                    className="inline-flex max-w-full items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1 font-mono text-xs font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
                    title="Copy invoice number"
                  >
                    <span className="truncate">{invoiceValue}</span>
                    {copiedField === "invoice" ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                </dd>
              </div>
            )}

            {trxIdValue && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground shrink-0">
                  Transaction ID
                </dt>
                <dd className="min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(trxIdValue, "trxId", "Transaction ID")
                    }
                    className="inline-flex max-w-full items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1 font-mono text-xs font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
                    title="Copy transaction ID"
                  >
                    <span className="truncate">{trxIdValue}</span>
                    {copiedField === "trxId" ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                </dd>
              </div>
            )}

            {(methodValue || payerMobileNo) && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground shrink-0">
                  Payment Method
                </dt>
                <dd className="flex items-center gap-2">
                  {methodValue && (
                    <Badge variant="secondary" className="font-medium">
                      {methodValue}
                    </Badge>
                  )}
                  {payerMobileNo && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {payerMobileNo}
                    </span>
                  )}
                </dd>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground shrink-0">Gateway</dt>
              <dd className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{gatewayLabel} Verified</span>
              </dd>
            </div>
          </dl>

          {/* Email Confirmation Strip */}
          <div className="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
            <Mail className="h-4 w-4 shrink-0 mt-0.5 text-foreground/70" />
            <span>
              A confirmation receipt has been sent to your registered email
              address.
            </span>
          </div>

          {/* Utility Actions */}
          <div className="space-y-3 pt-1 print:hidden">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save Receipt</span>
            </Button>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
              <span>Need help with this payment?</span>
              <div className="flex items-center gap-3">
                <Link
                  href="/contact"
                  className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                >
                  Contact Support
                </Link>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
