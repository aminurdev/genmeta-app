import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SchedulerSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Banner */}
      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72 sm:w-96" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-4 w-4 rounded-sm" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3.5 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scheduled Jobs Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-64" />
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-lg border">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-4 w-44" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom 2 Columns */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {[1, 2].map((panel) => (
          <Card key={panel}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-52" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default SchedulerSkeleton;
