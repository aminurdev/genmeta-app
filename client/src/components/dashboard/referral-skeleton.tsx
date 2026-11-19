import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Users,
  Wallet,
  TrendingUp,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ReferralDashboardSkeleton() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in-50 duration-200">
      {/* 1. Static Commission Promo Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800/40 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
              Earn ৳50 BDT Commission
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400/80">
              Every single user you refer will earn you ৳50 BDT commission when
              they join our platform!
            </p>
          </div>
        </div>
      </div>

      {/* 2. Static Page Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-semibold text-balance">
          Referral Program
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Earn commissions by referring new users to our platform
        </p>
      </div>

      {/* 3. 4 Core Stat Cards with real labels & dynamic skeleton values */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earned */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Earned
                </p>
                <div className="mt-1">
                  <Skeleton className="h-7 w-20" />
                </div>
              </div>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  This Month
                </p>
                <div className="mt-1">
                  <Skeleton className="h-7 w-20" />
                </div>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Available */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Available
                </p>
                <div className="mt-1">
                  <Skeleton className="h-7 w-20" />
                </div>
              </div>
              <Wallet className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* Referrals */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Referrals
                </p>
                <div className="mt-1">
                  <Skeleton className="h-7 w-12" />
                </div>
              </div>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Action Cards Grid */}
      <div className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          {/* Share & Earn Card */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Share & Earn</CardTitle>
              <CardDescription className="text-sm">
                Your unique referral link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-md" />
                <Button size="sm" disabled className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span>Code:</span>
                  <Skeleton className="h-5 w-16 rounded font-mono" />
                </div>
                <Button variant="ghost" size="sm" disabled className="h-auto p-1 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Withdraw Funds Card */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Withdraw Funds</CardTitle>
              <CardDescription className="text-sm">
                Withdraw your referral commissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Available to withdraw</p>
                  <Skeleton className="h-6 w-20 mt-1" />
                </div>
                <Button size="sm" disabled>
                  Request Withdrawal
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Minimum withdrawal amount: ৳100 BDT
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 5. Referred Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Referred Users</CardTitle>
            <CardDescription className="text-sm">
              Users who joined using your referral link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3].map((row) => (
                    <TableRow key={row}>
                      <TableCell>
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-36" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ReferralDashboardSkeleton;

