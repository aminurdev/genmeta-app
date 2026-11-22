import React from "react";
import { Coins, Layers, PlusCircle, RefreshCw, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Loading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Pricing &amp; Promo Codes
            </h1>
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <p className="text-sm text-muted-foreground">
            Manage all credit packs, subscriptions, and promotional campaigns
            from one unified view.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" disabled className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" disabled className="gap-1.5">
            <Tag className="h-4 w-4" />
            New Promo Code
          </Button>
          <Button size="sm" disabled className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            New Pricing Plan
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Active Plans", icon: Layers },
          { label: "Credit Packs", icon: Coins },
          { label: "Subscriptions", icon: Sparkles },
          { label: "Promo Codes", icon: Tag },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3.5 w-36" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pricing Plans Unified Card Skeleton */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
          <div className="flex flex-col lg:flex-row gap-3">
            <Skeleton className="h-9 flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="hidden md:block rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Plan</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Quota &amp; Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3.5 w-24" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Skeleton className="h-5 w-24 rounded-md" />
                        <Skeleton className="h-5 w-16 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-9 rounded-full" />
                        <Skeleton className="h-4 w-14" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Skeleton className="h-8 w-16 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden divide-y rounded-lg border">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
                <Skeleton className="h-5 w-28" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Promo Codes Card Skeleton */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
