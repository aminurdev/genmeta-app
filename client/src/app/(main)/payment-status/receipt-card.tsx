"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Check,
  Copy,
  Download,
  Loader2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PaymentStatusData } from "@/types/pricing";
import {
  downloadReceiptPdf,
  generateBarcodeBars,
  printReceiptWithTitle,
  type ReceiptPdfData,
} from "./receipt-pdf";

export interface PaymentReceiptCardProps {
  transaction: PaymentStatusData | null;
  planName: string;
  planMetaLine: string;
  amountDisplay: string;
  currency: string;
  invoiceValue: string | null;
  trxIdValue: string | null;
  methodValue: string | null;
  paidTimestamp?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
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
  return format(date, "MMM d, yyyy · h:mm a");
}

function formatGatewayLabel(gateway?: string | null): string {
  if (!gateway) return "PayStation";
  if (gateway.toLowerCase() === "paystation") return "PayStation";
  return gateway;
}

const TEETH_INDICES = Array.from({ length: 28 }, (_, i) => i);

export function PaymentReceiptCard({
  transaction,
  planName,
  planMetaLine,
  amountDisplay,
  currency,
  invoiceValue,
  trxIdValue,
  methodValue,
  paidTimestamp,
  customerName,
  customerEmail,
  copiedField,
  onCopy,
  formatCurrency,
}: PaymentReceiptCardProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

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

  const barcodeSeed = invoiceValue || trxIdValue || planName;
  const barcodeBars = generateBarcodeBars(barcodeSeed);

  const billedPrimary = customerName?.trim() || customerEmail?.trim() || null;
  const billedSecondary =
    customerName?.trim() && customerEmail?.trim()
      ? customerEmail.trim()
      : null;

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
      toast.info("Opening print dialog to save receipt as PDF");
      printReceiptWithTitle(invoiceValue);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="lg:sticky lg:top-24 print:static print:mx-auto print:w-full print:max-w-[380px]">
      {/* Real Printed Paper Receipt */}
      <div className="relative">
        <div className="bg-white text-neutral-900 dark:bg-zinc-950 dark:text-zinc-100 border border-b-0 border-border/80 rounded-t-sm px-6 pt-7 pb-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.10)] dark:shadow-none print:bg-white print:text-neutral-900 print:border-neutral-300 print:shadow-none">
          {/* Merchant Header */}
          <div className="text-center space-y-1 pb-4">
            <p className="text-base font-bold tracking-[0.22em] uppercase">
              GENMETA
            </p>
            <p className="font-mono text-[11px] text-neutral-500 dark:text-zinc-400 print:text-neutral-600">
              genmeta.app · support@genmeta.app
            </p>
          </div>

          {/* Receipt Status Strip */}
          <div className="border-y border-dashed border-neutral-300 dark:border-zinc-800 print:border-neutral-300 py-2.5 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-semibold tracking-[0.16em] uppercase">
              PAYMENT RECEIPT
            </span>
            <span className="border border-emerald-600/50 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-400 print:border-neutral-900 print:text-neutral-900 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.18em] uppercase">
              PAID
            </span>
          </div>

          {/* Minimal Metadata List */}
          <dl className="py-4 space-y-2 font-mono text-xs border-b border-dashed border-neutral-300 dark:border-zinc-800 print:border-neutral-300">
            {formattedPaidAt && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-neutral-500 dark:text-zinc-400 print:text-neutral-600 shrink-0">
                  DATE
                </dt>
                <dd className="text-right font-medium">{formattedPaidAt}</dd>
              </div>
            )}

            {invoiceValue && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500 dark:text-zinc-400 print:text-neutral-600 shrink-0">
                  RECEIPT #
                </dt>
                <dd className="min-w-0 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(invoiceValue, "invoice", "Invoice number")
                    }
                    className="inline-flex items-center gap-1.5 font-semibold hover:opacity-75 transition-opacity cursor-pointer text-right truncate"
                    title="Copy invoice number"
                  >
                    <span className="truncate">{invoiceValue}</span>
                    {copiedField === "invoice" ? (
                      <Check className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400 print:hidden" />
                    ) : (
                      <Copy className="h-3 w-3 shrink-0 text-neutral-400 dark:text-zinc-500 print:hidden" />
                    )}
                  </button>
                </dd>
              </div>
            )}

            {trxIdValue && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500 dark:text-zinc-400 print:text-neutral-600 shrink-0">
                  TRX ID
                </dt>
                <dd className="min-w-0 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(trxIdValue, "trxId", "Transaction ID")
                    }
                    className="inline-flex items-center gap-1.5 font-semibold hover:opacity-75 transition-opacity cursor-pointer text-right truncate"
                    title="Copy transaction ID"
                  >
                    <span className="truncate">{trxIdValue}</span>
                    {copiedField === "trxId" ? (
                      <Check className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400 print:hidden" />
                    ) : (
                      <Copy className="h-3 w-3 shrink-0 text-neutral-400 dark:text-zinc-500 print:hidden" />
                    )}
                  </button>
                </dd>
              </div>
            )}

            {billedPrimary && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-neutral-500 dark:text-zinc-400 print:text-neutral-600 shrink-0">
                  BILLED TO
                </dt>
                <dd className="min-w-0 text-right">
                  <span className="block truncate font-semibold">
                    {billedPrimary}
                  </span>
                  {billedSecondary && (
                    <span className="block truncate text-[11px] text-neutral-500 dark:text-zinc-400 print:text-neutral-600">
                      {billedSecondary}
                    </span>
                  )}
                </dd>
              </div>
            )}

            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-neutral-500 dark:text-zinc-400 print:text-neutral-600 shrink-0">
                METHOD
              </dt>
              <dd className="text-right font-medium truncate">
                {methodDisplay}
              </dd>
            </div>
          </dl>

          {/* Itemized Line Items */}
          <div className="py-4 space-y-3 border-b border-dashed border-neutral-300 dark:border-zinc-800 print:border-neutral-300">
            <div className="flex items-center justify-between font-mono text-[10px] font-semibold tracking-wider uppercase text-neutral-500 dark:text-zinc-400 print:text-neutral-600">
              <span>DESCRIPTION</span>
              <span>AMOUNT</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug capitalize truncate">
                  {planName}
                </p>
                <p className="text-xs text-neutral-500 dark:text-zinc-400 print:text-neutral-600">
                  {planMetaLine}
                </p>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums shrink-0">
                {basePriceDisplay || totalPaidDisplay}
              </span>
            </div>

            {(planDiscountDisplay ||
              promoDiscountDisplay ||
              gatewayFeeDisplay) && (
              <div className="space-y-1.5 pt-1 text-xs">
                {planDiscountDisplay && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-neutral-500 dark:text-zinc-400 print:text-neutral-600">
                      Plan discount
                    </span>
                    <span className="font-mono tabular-nums">
                      -{planDiscountDisplay}
                    </span>
                  </div>
                )}
                {promoDiscountDisplay && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-neutral-500 dark:text-zinc-400 print:text-neutral-600 truncate">
                      {promoLabel}
                    </span>
                    <span className="font-mono tabular-nums shrink-0">
                      -{promoDiscountDisplay}
                    </span>
                  </div>
                )}
                {gatewayFeeDisplay && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-neutral-500 dark:text-zinc-400 print:text-neutral-600">
                      Gateway charge
                    </span>
                    <span className="font-mono tabular-nums shrink-0">
                      +{gatewayFeeDisplay}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Total Paid */}
          <div className="py-4 border-b border-dashed border-neutral-300 dark:border-zinc-800 print:border-neutral-300 space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs font-bold tracking-wider uppercase">
                TOTAL PAID
              </span>
              <span className="font-mono text-2xl font-bold tracking-tight tabular-nums">
                {totalPaidDisplay}{" "}
                <span className="text-xs font-medium text-neutral-500 dark:text-zinc-400 print:text-neutral-600">
                  {currency}
                </span>
              </span>
            </div>
            {totalSavingsDisplay && (
              <p className="font-mono text-[11px] text-neutral-500 dark:text-zinc-400 print:text-neutral-600 text-right tabular-nums">
                Total savings: {totalSavingsDisplay}
              </p>
            )}
          </div>

          {/* Barcode & Receipt Footer */}
          <div className="pt-5 text-center space-y-2.5">
            <svg
              viewBox="0 0 200 32"
              className="mx-auto h-8 w-48 text-neutral-900 dark:text-zinc-100 print:text-neutral-900"
              aria-hidden="true"
            >
              {barcodeBars.map((bar, idx) => (
                <rect
                  key={idx}
                  x={bar.x}
                  y={0}
                  width={bar.w}
                  height={32}
                  fill="currentColor"
                />
              ))}
            </svg>
            <p className="font-mono text-[10px] tracking-wider text-neutral-500 dark:text-zinc-400 print:text-neutral-600">
              {invoiceValue || trxIdValue || "GENMETA-VERIFIED"}
            </p>
            <div className="pt-1 space-y-0.5">
              <p className="font-mono text-[10px] font-semibold tracking-wider uppercase">
                Verified via {gatewayLabel} · Receipt emailed
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-zinc-400 print:text-neutral-600">
                Thank you for choosing GenMeta.
              </p>
            </div>
          </div>
        </div>

        {/* Serrated Sawtooth Paper Tear Edge */}
        <svg
          viewBox="0 0 280 10"
          preserveAspectRatio="none"
          className="block h-2.5 w-full print:block"
          aria-hidden="true"
        >
          <polygon
            points={
              "0,0 " +
              TEETH_INDICES.map((i) => {
                const mid = i * 10 + 5;
                const end = (i + 1) * 10;
                return `${mid},9 ${end},0`;
              }).join(" ")
            }
            className="fill-white dark:fill-zinc-950 print:fill-white"
          />
          <polyline
            points={
              "0,0 " +
              TEETH_INDICES.map((i) => {
                const mid = i * 10 + 5;
                const end = (i + 1) * 10;
                return `${mid},9 ${end},0`;
              }).join(" ")
            }
            fill="none"
            strokeWidth="1"
            className="stroke-border/80 print:stroke-neutral-300"
          />
        </svg>
      </div>

      {/* Download PDF & Print Controls */}
      <div className="mt-4 space-y-2.5 print:hidden">
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="gap-2 font-medium"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => printReceiptWithTitle(invoiceValue)}
            className="gap-2 font-medium"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Need help?</span>
          <span>·</span>
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
      </div>
    </div>
  );
}
