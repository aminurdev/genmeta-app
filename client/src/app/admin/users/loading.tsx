import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-background via-background to-muted/20 animate-in fade-in-50 duration-200">
      <div className="flex flex-col p-3 sm:p-4 lg:p-6 w-full">
        {/* Static Header */}
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
            disabled
            className="h-9 sm:h-10 px-3 sm:px-4 text-sm border-0 shadow-sm"
          >
            <RefreshCw className="mr-1 sm:mr-2 h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>

        {/* 8 Metric Cards */}
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm"
              >
                <div className="flex items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <Skeleton className="h-7 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>

          {/* App Key Table Skeleton */}
          <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Skeleton className="h-10 w-full sm:w-72" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            <div className="divide-y divide-border/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48 font-mono" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-md" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

