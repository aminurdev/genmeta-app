import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ErrorsTableSkeleton({ rows = 10 }: { rows?: number }) {
  const rowList = Array.from({ length: Math.max(1, rows) });

  return (
    <>
      {/* Desktop Table Skeleton */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-10" />
              <TableHead>User</TableHead>
              <TableHead>Date / Last Seen</TableHead>
              <TableHead>Failures</TableHead>
              <TableHead>Error Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowList.map((_, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Skeleton className="h-4 w-4 rounded-sm" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-56" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-20 ml-auto rounded-md" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards Skeleton */}
      <div className="md:hidden divide-y rounded-lg border overflow-hidden">
        {rowList.map((_, idx) => (
          <div key={idx} className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ErrorsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Banner Skeleton */}
      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72 sm:w-96" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
        </div>
      </div>

      {/* 4 KPI Cards Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-4 w-4 rounded-sm" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3.5 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights Row Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-7">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3.5 w-60" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[240px] w-full rounded-lg" />
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3.5 w-52" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
              >
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Error Logs Card Skeleton */}
      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="text-base font-semibold">
              Processing Error Logs
            </CardTitle>
            <CardDescription>
              Loading recorded desktop processing failures...
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-9 w-64 rounded-md" />
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorsTableSkeleton rows={10} />
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorsSkeleton;
