import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardStats from "@/components/admin/app/AdminDashboardStats";

export default async function StatsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex flex-col p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor platform statistics, user activity, and system performance
          </p>
        </div>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardStats />
        </Suspense>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mb-2" />
              <Skeleton className="h-3 w-20 sm:w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
              <Skeleton className="h-3 sm:h-4 w-40 sm:w-48" />
            </CardHeader>
            <CardContent className="h-[250px] sm:h-[300px] flex items-center justify-center p-4 sm:p-6 pt-0">
              <div className="w-full h-full relative">
                <Skeleton className="absolute bottom-0 left-0 w-full h-40 sm:h-48 rounded-t-lg" />
                <div className="absolute bottom-0 left-0 w-full h-40 sm:h-48 flex items-end justify-between px-2 sm:px-4">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Skeleton
                      key={j}
                      className="w-6 sm:w-8 rounded-t"
                      style={{ height: `${Math.random() * 80 + 20}%` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Table Skeleton */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="p-4 sm:p-6">
          <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
          <Skeleton className="h-3 sm:h-4 w-40 sm:w-48" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 sm:space-x-4 p-2 sm:p-3 rounded-lg bg-muted/30">
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                  <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                  <Skeleton className="h-2 sm:h-3 w-32 sm:w-48" />
                </div>
                <div className="hidden sm:block">
                  <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                </div>
                <div className="hidden md:block">
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                </div>
                <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 flex-shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
