import type { Metadata } from "next";
import { PaymentStatusClient } from "./payment-status-client";

export const metadata: Metadata = {
  title: "Payment Status",
  description:
    "View your GenMeta payment verification status, plan activation details, and digital receipt.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PaymentStatus({
  searchParams,
}: {
  searchParams: Promise<{
    invoice?: string;
    message?: string;
    amount?: string;
    plan?: string;
    status?: string;
    planType?: string;
    duration?: string;
    credit?: string;
    trxID?: string;
  }>;
}) {
  const {
    invoice,
    message,
    amount,
    plan,
    status,
    planType,
    duration,
    credit,
    trxID,
  } = await searchParams;

  return (
    <PaymentStatusClient
      invoice={invoice}
      initialStatus={status}
      initialMessage={message}
      legacyAmount={amount}
      legacyPlan={plan}
      legacyPlanType={planType}
      legacyDuration={duration}
      legacyCredit={credit}
      legacyTrxID={trxID}
    />
  );
}
