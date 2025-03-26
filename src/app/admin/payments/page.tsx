"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  Download,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePayments } from "@/hooks/use-payments";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export default function PaymentsPage() {
  const { payments, loading, error, pagination, fetchPayments } = usePayments();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchPayments({
      page: 1,
      search: value,
      status: statusFilter === "all" ? undefined : statusFilter,
      paymentMethod:
        paymentMethodFilter === "all" ? undefined : paymentMethodFilter,
      startDate: dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined,
      endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    fetchPayments({
      page: 1,
      search: searchTerm,
      status: value === "all" ? undefined : value,
      paymentMethod:
        paymentMethodFilter === "all" ? undefined : paymentMethodFilter,
      startDate: dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined,
      endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    });
  };

  const handlePaymentMethodFilter = (value: string) => {
    setPaymentMethodFilter(value);
    setCurrentPage(1);
    fetchPayments({
      page: 1,
      search: searchTerm,
      status: statusFilter === "all" ? undefined : statusFilter,
      paymentMethod: value === "all" ? undefined : value,
      startDate: dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined,
      endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1);
    fetchPayments({
      page: 1,
      search: searchTerm,
      status: statusFilter === "all" ? undefined : statusFilter,
      paymentMethod:
        paymentMethodFilter === "all" ? undefined : paymentMethodFilter,
      startDate: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
      endDate: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPayments({
      page,
      search: searchTerm,
      status: statusFilter === "all" ? undefined : statusFilter,
      paymentMethod:
        paymentMethodFilter === "all" ? undefined : paymentMethodFilter,
      startDate: dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined,
      endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      case "cancelled":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500">
            Error Loading Payments
          </h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                View and manage all payment transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal",
                          !dateRange?.from &&
                            !dateRange?.to &&
                            "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange?.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          "Date Range"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateRangeChange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1 md:max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search transactions..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={handleStatusFilter}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={paymentMethodFilter}
                      onValueChange={handlePaymentMethodFilter}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Payment Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="bKash">bKash</SelectItem>
                        <SelectItem value="nagad">Nagad</SelectItem>
                        <SelectItem value="rocket">Rocket</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">
                          <div className="flex items-center gap-1">
                            Invoice
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Date
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Tokens</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <>
                          {Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Skeleton className="h-8 w-[100px]" />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Skeleton className="h-8 w-8 rounded-full" />
                                  <div className="flex flex-col gap-1">
                                    <Skeleton className="h-4 w-[120px]" />
                                    <Skeleton className="h-3 w-[160px]" />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-8 w-[100px]" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-6 w-[80px]" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-8 w-[100px]" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-8 w-[60px]" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-8 w-[80px]" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-8 w-[40px]" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : payments.length > 0 ? (
                        payments.map((payment) => (
                          <TableRow key={payment.paymentId}>
                            <TableCell className="font-medium text-nowrap">
                              {payment.invoiceNumber}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {payment.user.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {payment.user.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {payment.user.email}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(payment.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${getStatusColor(payment.status)}`}
                              >
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{payment.paymentMethod}</TableCell>
                            <TableCell>{payment.tokensAdded}</TableCell>
                            <TableCell className="text-right font-medium">
                              {payment.currency} {payment.amount}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View details
                                  </DropdownMenuItem>
                                  {payment.status === "Pending" && (
                                    <DropdownMenuItem>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Process payment
                                    </DropdownMenuItem>
                                  )}
                                  {(payment.status === "Completed" ||
                                    payment.status === "Pending") && (
                                    <DropdownMenuItem className="text-red-600">
                                      <X className="mr-2 h-4 w-4" />
                                      Cancel payment
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download invoice
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            No transactions found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <strong>{pagination.currentPage}</strong> to{" "}
                    <strong>{pagination.totalPages}</strong> of{" "}
                    <strong>{pagination.totalPayments}</strong> transactions
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            handlePageChange(Math.max(currentPage - 1, 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(
                              Math.min(currentPage + 1, pagination.totalPages)
                            )
                          }
                          className={
                            currentPage === pagination.totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
