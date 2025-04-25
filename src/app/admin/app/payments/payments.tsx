"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBaseApi } from "@/services/image-services";
import { getAccessToken } from "@/services/auth-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon,
  Download,
  Eye,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Payment {
  _id: string;
  user: User;
  paymentID: string;
  trxID: string;
  plan: string;
  amount: number;
  createdAt: string;
  transactionStatus: string;
}

interface PaymentHistoryResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  payments: Payment[];
}

export default function PaymentHistory() {
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [userId, setUserId] = useState("");

  // Date range states
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  // Payment data states
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View payment details dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch payments when page, limit, search term, or date range changes
  useEffect(() => {
    fetchPaymentHistory();
  }, [currentPage, limit, debouncedSearchTerm, userId, startDate, endDate]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", limit.toString());

      if (debouncedSearchTerm) {
        queryParams.append("search", debouncedSearchTerm);
      }

      if (userId) {
        queryParams.append("userId", userId);
      }

      if (startDate) {
        queryParams.append("startDate", format(startDate, "yyyy-MM-dd"));
      }

      if (endDate) {
        queryParams.append("endDate", format(endDate, "yyyy-MM-dd"));
      }

      const response = await fetch(
        `${baseApi}/app/paymentHistory/get?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }

      const result = await response.json();

      if (result.success) {
        const responseData: PaymentHistoryResponse = result.data;
        setPayments(responseData.payments);
        setTotalPages(responseData.totalPages);
        setTotalPayments(responseData.total);
        setCurrentPage(responseData.page);
      } else {
        throw new Error(result.message || "Failed to fetch payment history");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500/20 text-green-700 hover:bg-green-500/20";
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/20";
      case "failed":
        return "bg-red-500/20 text-red-700 hover:bg-red-500/20";
      default:
        return "bg-gray-500/20 text-gray-700 hover:bg-gray-500/20";
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "monthly":
        return "bg-blue-500/20 text-blue-700 hover:bg-blue-500/20";
      case "yearly":
        return "bg-purple-500/20 text-purple-700 hover:bg-purple-500/20";
      case "lifetime":
        return "bg-green-500/20 text-green-700 hover:bg-green-500/20";
      default:
        return "bg-gray-500/20 text-gray-700 hover:bg-gray-500/20";
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setUserId("");
    setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setEndDate(new Date());
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = [
      "Payment ID",
      "Transaction ID",
      "User Name",
      "User Email",
      "Plan",
      "Amount",
      "Date",
      "Status",
    ];
    const csvRows = [headers];

    payments.forEach((payment) => {
      const row = [
        payment.paymentID,
        payment.trxID,
        payment.user.name,
        payment.user.email,
        payment.plan,
        payment.amount.toString(),
        new Date(payment.createdAt).toISOString(),
        payment.transactionStatus,
      ];
      csvRows.push(row);
    });

    // Convert to CSV string
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `payment-history-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openViewDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setViewDialogOpen(true);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>

          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(1)}>
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {pages}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderPaymentTable = () => {
    if (loading && payments.length === 0) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (error && payments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <XCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium">Error loading payment history</h3>
          <p className="text-muted-foreground mt-2 mb-4">{error}</p>
          <Button onClick={fetchPaymentHistory} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    if (payments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No payments found</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {debouncedSearchTerm || userId || startDate || endDate
              ? "Try adjusting your filters"
              : "No payment records available"}
          </p>
          {(debouncedSearchTerm || userId || startDate || endDate) && (
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          )}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment ID</TableHead>
            <TableHead>Transaction ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment._id}>
              <TableCell className="font-medium">{payment.paymentID}</TableCell>
              <TableCell>{payment.trxID}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{payment.user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {payment.user.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getPlanBadge(payment.plan)}>
                  {payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell>{formatDate(payment.createdAt)}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getStatusColor(payment.transactionStatus)}
                >
                  {payment.transactionStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openViewDialog(payment)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View payment details</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View and manage payment transactions
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchPaymentHistory}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex items-center gap-1"
            disabled={payments.length === 0}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by payment ID, transaction ID, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Filter by user ID (optional)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal sm:w-[200px]",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="endDate"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal sm:w-[200px]",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-full sm:w-32">
              <Select
                value={limit.toString()}
                onValueChange={(value) => setLimit(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rows per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="20">20 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="sm:mb-0"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {renderPaymentTable()}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {payments.length > 0 ? (currentPage - 1) * limit + 1 : 0} to{" "}
            {Math.min(currentPage * limit, totalPayments)} of {totalPayments}{" "}
            payments
          </div>
          {totalPages > 1 && renderPagination()}
        </div>
      </CardContent>

      {/* View Payment Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Detailed information about the payment transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Payment ID</Label>
                <div className="col-span-3 font-medium">
                  {selectedPayment.paymentID}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Transaction ID</Label>
                <div className="col-span-3">{selectedPayment.trxID}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">User</Label>
                <div className="col-span-3">
                  <div className="font-medium">{selectedPayment.user.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedPayment.user.email}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Plan</Label>
                <div className="col-span-3">
                  <Badge
                    variant="outline"
                    className={getPlanBadge(selectedPayment.plan)}
                  >
                    {selectedPayment.plan.charAt(0).toUpperCase() +
                      selectedPayment.plan.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Amount</Label>
                <div className="col-span-3 font-medium">
                  {formatCurrency(selectedPayment.amount)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Date</Label>
                <div className="col-span-3">
                  {formatDate(selectedPayment.createdAt)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <div className="col-span-3">
                  <Badge
                    variant="outline"
                    className={getStatusColor(
                      selectedPayment.transactionStatus
                    )}
                  >
                    {selectedPayment.transactionStatus}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">User ID</Label>
                <div className="col-span-3 text-xs font-mono">
                  {selectedPayment.user._id}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
