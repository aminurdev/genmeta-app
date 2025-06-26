import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import PaymentList from "./payments";

export default function PaymentsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 border-b bg-background px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Payments</h1>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<PaymentLoading />}>
            <PaymentList />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function PaymentLoading() {
  return (
    <div className="mt-6 rounded-lg border bg-card shadow-sm">
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="p-4">
        <Skeleton className="h-10 w-full mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full mb-2" />
        ))}
      </div>
    </div>
  );
}
