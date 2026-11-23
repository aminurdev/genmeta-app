import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PaymentStatusSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <MaxWidthWrapper className="py-8 sm:py-12 space-y-8 animate-in fade-in-50 duration-200">
        {/* Top Progress / Trust Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-40 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>

        {/* Hero Confirmation Skeleton */}
        <div className="rounded-2xl border bg-muted/20 p-6 sm:p-10">
          <div className="flex flex-col items-center text-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-9 w-64 sm:w-80" />
            <Skeleton className="h-4 w-80 max-w-full" />
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-32 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
          </div>
        </div>

        {/* Main 12-Column Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border p-5 space-y-4">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-7 w-48" />
                      <Skeleton className="h-4 w-64 max-w-full" />
                    </div>
                    <Skeleton className="h-8 w-28" />
                  </div>
                  <Skeleton className="h-4 w-52" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-5 w-full" />
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Skeleton className="h-11 w-full sm:w-44 rounded-md" />
                  <Skeleton className="h-11 w-full sm:w-48 rounded-md" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-5">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="flex gap-4">
                    <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3.5 w-full max-w-md" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Paper Receipt Skeleton */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-t-sm border px-6 pt-7 pb-6 space-y-5 bg-card">
              <div className="flex flex-col items-center space-y-2 pb-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
              <div className="border-y border-dashed py-3 flex items-center justify-between">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-5 w-12 rounded-none" />
              </div>
              <div className="space-y-2.5 border-b border-dashed pb-4">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="space-y-3 border-b border-dashed pb-4">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="flex items-baseline justify-between border-b border-dashed pb-4">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-7 w-28" />
              </div>
              <div className="flex flex-col items-center space-y-2 pt-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}

export default function Loading() {
  return <PaymentStatusSkeleton />;
}
