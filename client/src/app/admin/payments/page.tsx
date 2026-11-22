import { Suspense } from "react";
import { PaymentHistoryPage } from "./payments";
import { PaymentsSkeleton } from "./payments-skeleton";

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<PaymentsSkeleton />}>
      <PaymentHistoryPage />
    </Suspense>
  );
}
