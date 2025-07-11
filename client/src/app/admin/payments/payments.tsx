"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Download,
  RefreshCw,
  MoreHorizontal,
  DollarSign,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  CalendarIcon,
  X,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Calendar } from "@/components/ui/calendar";
// import { cn } from "@/lib/utils";
import {
  getPaymentsHistory,
  PaymentResponse,
} from "@/services/admin-dashboard";

export function PaymentHistoryPage() {
  const today = new Date();
  const [payments, setPayments] = useState<PaymentResponse["data"] | null>(
    null
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: today,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [planTypeFilter, setPlanTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm !== "" ||
    planTypeFilter !== "all" ||
    (dateRange?.from &&
      dateRange?.to &&
      (dateRange.from.getTime() !==
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).getTime() ||
        dateRange.to.getTime() !== today.getTime()));

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getPaymentsHistory({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        sortBy,
        sortOrder,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
      });
      if (response.success) {
        setPayments(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to fetch payment history");
      console.error("Error fetching payments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortBy, sortOrder, dateRange]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePlanTypeFilter = (type: string) => {
    setPlanTypeFilter(type);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleExport = () => {
    toast.success("Export functionality will be implemented");
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const getPlanTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "subscription":
        return (
          <Badge
            variant="outline"
            className="bg-violet-50 text-violet-700 border-violet-200"
          >
            Subscription
          </Badge>
        );
      case "credit":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Credits
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            {type}
          </Badge>
        );
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setPlanTypeFilter("all");
    setDateRange({
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: today,
    });
    setCurrentPage(1);
    toast.success("Filters cleared");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
                <p className="font-medium">Error loading payment history</p>
              </div>
              <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
              <Button
                onClick={fetchPayments}
                className="mt-4 bg-transparent"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20 p-6">
      <div>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Payment History
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all payment transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchPayments} variant="outline" size="sm">
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="border-b-0 -mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-violet-600" />
                <CardTitle className="text-lg">Filters & Search</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <Label
                  htmlFor="search"
                  className="text-sm font-medium mb-2 block"
                >
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Search by user name, email, payment ID..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Plan Type Filter */}
              <div>
                <Label
                  htmlFor="planType"
                  className="text-sm font-medium mb-2 block"
                >
                  Plan Type
                </Label>
                <Select
                  value={planTypeFilter}
                  onValueChange={handlePlanTypeFilter}
                >
                  <SelectTrigger id="planType">
                    <SelectValue placeholder="Filter by plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="credit">Credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              {/* <div>
                <Label
                  htmlFor="dateRange"
                  className="text-sm font-medium mb-2 block"
                >
                  Date Range
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dateRange"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      className="rounded-md border-0"
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* Main Payment Management Card */}
        <Card className="border-t-0">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Payment Records</CardTitle>
                <CardDescription>
                  {payments
                    ? `Showing ${payments.payments.length} of ${payments.total} payments`
                    : "Loading payment data..."}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Payment Table */}
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead
                      className="cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        <CalendarIcon className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Payment Details</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center gap-2">
                        Amount
                        <DollarSign className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Skeleton Loading Rows
                    Array.from({ length: pageSize }, (_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded animate-pulse"></div>
                            <div className="h-3 bg-muted/60 rounded animate-pulse w-16"></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                            <div className="h-3 bg-muted/60 rounded animate-pulse w-32"></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="h-6 bg-muted rounded animate-pulse w-20"></div>
                            <div className="h-3 bg-muted/60 rounded animate-pulse w-16"></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="h-6 bg-muted rounded animate-pulse w-20"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-6 bg-muted rounded animate-pulse w-20"></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="h-8 w-8 bg-muted rounded animate-pulse ml-auto"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : payments && payments.payments.length > 0 ? (
                    payments.payments
                      .filter(
                        (payment) =>
                          planTypeFilter === "all" ||
                          payment.plan?.type === planTypeFilter
                      )
                      .map((payment) => (
                        <TableRow
                          key={payment._id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {format(
                                  new Date(payment.createdAt),
                                  "MMM dd, yyyy"
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(payment.createdAt), "hh:mm a")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {payment.user.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {payment.user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                {payment.paymentID}
                              </div>
                              <div className="font-mono text-xs text-muted-foreground">
                                TRX: {payment.trxID}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getPlanTypeBadge(
                              payment.plan?.type ??
                                payment.plan?.name ??
                                "Unknown"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">
                              ৳{payment.amount.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.transactionStatus)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleCopyToClipboard(
                                      payment.paymentID,
                                      "Payment ID"
                                    )
                                  }
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy Payment ID
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleCopyToClipboard(
                                      payment.trxID,
                                      "Transaction ID"
                                    )
                                  }
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy Transaction ID
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                          <DollarSign className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          No payments found
                        </h3>
                        <p className="text-muted-foreground">
                          {searchTerm || planTypeFilter !== "all"
                            ? "Try adjusting your filters or search terms"
                            : "Payment history will appear here once transactions are made"}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {payments && payments.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {payments.totalPages} • Total{" "}
                  {payments.total} payments
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, payments.totalPages) },
                      (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      }
                    )}
                    {payments.totalPages > 5 && (
                      <>
                        <span className="text-muted-foreground px-2">...</span>
                        <Button
                          variant={
                            currentPage === payments.totalPages
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(payments.totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {payments.totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(
                        Math.min(payments.totalPages, currentPage + 1)
                      )
                    }
                    disabled={currentPage === payments.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
