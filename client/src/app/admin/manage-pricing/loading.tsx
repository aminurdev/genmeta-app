import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
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
    <div className="container mx-auto py-6 space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in-50 duration-200">
      <h1 className="text-3xl font-bold mb-8">Pricing Management</h1>

      <div className="space-y-8">
        {/* Static Tabs */}
        <div className="grid w-full grid-cols-3 h-12 rounded-lg bg-muted p-1">
          <div className="rounded-md bg-background shadow-sm flex items-center justify-center text-sm font-medium">
            Credit Plans
          </div>
          <div className="flex items-center justify-center text-sm font-medium text-muted-foreground">
            Subscription Plans
          </div>
          <div className="flex items-center justify-center text-sm font-medium text-muted-foreground">
            Promo Codes
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center mt-8 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Manage Credit Plans</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Set up credit-based pricing options
            </p>
          </div>
          <Button disabled className="shadow-lg">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Plan
          </Button>
        </div>

        {/* Pricing Table Skeleton */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Plan Name</TableHead>
                <TableHead>Price (BDT)</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

