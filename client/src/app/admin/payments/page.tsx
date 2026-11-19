import { Suspense } from "react";
import { PaymentHistoryPage } from "./payments";
import { PaymentsSkeleton } from "./payments-skeleton";

export default function AdminPaymentsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-col">
        <main className="flex-1">
          <Suspense fallback={<PaymentsSkeleton />}>
            <PaymentHistoryPage />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
