import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import StatisticsContent from "./statistics-content";
import AppKeyList from "./appkey-list";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function StatisticsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex flex-col p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              App Users
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Monitor application usage, app users, and access statistics
            </p>
          </div>
          <Button
            variant="outline"
            className="h-9 sm:h-10 px-3 sm:px-4 text-sm border-0 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <RefreshCw className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
        <div className="space-y-4 sm:space-y-6">
          <Suspense fallback={<StatisticsLoading />}>
            <StatisticsContent />
          </Suspense>

          <Suspense fallback={<AppKeyListLoading />}>
            <AppKeyList />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function StatisticsLoading() {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border-0 bg-card p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <Skeleton className="h-3 sm:h-4 w-1/2 mb-2" />
          <Skeleton className="h-6 sm:h-8 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function AppKeyListLoading() {
  return (
    <div className="rounded-lg border-0 bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4 sm:p-6 border-b border-border/50">
        <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
        <Skeleton className="h-3 sm:h-4 w-40 sm:w-48 mt-2" />
      </div>
      <div className="p-4 sm:p-6">
        <Skeleton className="h-9 sm:h-10 w-full mb-3 sm:mb-4" />
        <div className="space-y-2 sm:space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-3 sm:space-x-4 p-2 sm:p-3 rounded-lg bg-muted/30"
            >
              <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1 sm:space-y-2">
                <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                <Skeleton className="h-2 sm:h-3 w-32 sm:w-48" />
              </div>
              <div className="hidden sm:block">
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
              </div>
              <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
