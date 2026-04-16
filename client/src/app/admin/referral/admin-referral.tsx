"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Copy,
  Eye,
} from "lucide-react";
import Link from "next/link";
import PaginationView from "@/components/pagination-view";

import type { ReferralRes } from "@/types/admin";

interface AdminReferralDashboardProps {
  referralData: ReferralRes[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  searchTerm: string;
}

export function AdminReferralDashboard({
  referralData,
  pagination,
  onPageChange,
  onSearchChange,
  searchTerm,
}: AdminReferralDashboardProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        onSearchChange(localSearchTerm);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearchTerm, searchTerm, onSearchChange]);

  // Calculate statistics from current page data
  const totalUsers = pagination.total;
  const totalReferrals = referralData.reduce(
    (sum, user) => sum + user.referredCount,
    0,
  );
  const totalEarnings = referralData.reduce(
    (sum, user) => sum + user.totalEarned,
    0,
  );
  const totalPendingWithdrawals = referralData.reduce(
    (sum, user) => sum + user.pendingWithdrawals,
    0,
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Referral Management
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage user referrals and earnings
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Active referrers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Referrals
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalReferrals.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Successful referrals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Earnings
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalEarnings)}
              </div>
              <p className="text-xs text-muted-foreground">All-time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Withdrawals
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPendingWithdrawals}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>User Referral Data</CardTitle>
            <CardDescription>
              Manage and monitor all user referral activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or referral code..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Data Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead className="text-right">Referrals</TableHead>
                    <TableHead className="text-right">Total Earned</TableHead>
                    <TableHead className="text-right">
                      Available Balance
                    </TableHead>
                    <TableHead className="text-right">
                      Pending Withdrawals
                    </TableHead>
                    <TableHead>Withdraw Account</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No referral data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    referralData.map((user) => (
                      <TableRow
                        key={user.referrer._id}
                        className="hover:bg-muted/50"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.referrer.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.referrer.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {user.referralCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(user.referralCode)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">
                            {user.referredCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(user.totalEarned)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(user.availableBalance)}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.pendingWithdrawals > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-yellow-600 border-yellow-600"
                            >
                              {user.pendingWithdrawals}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.withdrawAccount ? (
                            <code className="bg-muted px-2 py-1 rounded text-sm">
                              {user.withdrawAccount}
                            </code>
                          ) : (
                            <span className="text-muted-foreground">
                              Not set
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/referral/${user.referrer._id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination and Results Summary */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.total,
                )}{" "}
                of {pagination.total} users
              </div>
              {pagination.totalPages > 1 && (
                <PaginationView
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  handlePageChange={onPageChange}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
