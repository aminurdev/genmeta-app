import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PaymentStatusSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background py-12 sm:py-16">
      <MaxWidthWrapper className="w-full">
        <Card className="mx-auto max-w-xl border shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader className="flex flex-col items-center text-center space-y-3.5 pt-8 pb-4 px-6 sm:px-8">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>

          <CardContent className="space-y-5 px-6 sm:px-8 pb-6">
            <div className="rounded-xl border p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-56 max-w-full" />
            </div>

            <div className="rounded-xl border divide-y">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Skeleton className="h-11 flex-1 rounded-md" />
              <Skeleton className="h-11 flex-1 rounded-md" />
            </div>

            <div className="flex justify-center pt-1">
              <Skeleton className="h-3.5 w-60" />
            </div>
          </CardContent>

          <div className="border-t px-6 py-3.5 flex justify-center">
            <Skeleton className="h-3.5 w-44" />
          </div>
        </Card>
      </MaxWidthWrapper>
    </div>
  );
}

export default function Loading() {
  return <PaymentStatusSkeleton />;
}
