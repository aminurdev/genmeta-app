import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import StatisticsContent from "./statistics-content";
import ApiKeyList from "./apikey-list";

export default function StatisticsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 border-b bg-background px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">API Key Statistics</h1>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<StatisticsLoading />}>
            <StatisticsContent />
          </Suspense>

          <Suspense fallback={<ApiKeyListLoading />}>
            <ApiKeyList />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function StatisticsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-8 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function ApiKeyListLoading() {
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
