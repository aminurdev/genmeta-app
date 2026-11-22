import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CartSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <MaxWidthWrapper className="py-8 sm:py-12 space-y-8 animate-in fade-in-50 duration-200">
        {/* Header */}
        <div className="space-y-3 border-b pb-6">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-8 w-36 rounded-md" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full rounded-md" />
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-xl border p-5 space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-64 max-w-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-36" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <div className="space-y-2.5 pt-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full rounded-md" />
              </CardContent>
            </Card>
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}

export default function Loading() {
  return <CartSkeleton />;
}
