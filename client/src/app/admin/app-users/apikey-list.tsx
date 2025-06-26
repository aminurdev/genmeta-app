"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Edit,
  Copy,
  MoreHorizontal,
  Trash2,
  Plus,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Search,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

interface ApiKey {
  _id: string;
  userId: string;
  username: string;
  key: string;
  expiresAt: string;
  isActive: boolean;
  status: string;
  suspendedAt: string | null;
  plan: {
    type: string;
    id?: string;
  };
  credit?: number;
  totalProcess: number;
  createdAt: string;
  deviceId?: string | null;
}

interface ApiKeysResponse {
  apiKeys: ApiKey[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export default function ApiKeyList() {
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalKeys, setTotalKeys] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // API key states
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingUsername, setDeletingUsername] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateUsername, setUpdateUsername] = useState("");
  const [updatePlan, setUpdatePlan] = useState("");
  const [updateExpiryDays, setUpdateExpiryDays] = useState("30");
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("all");

  // Create API key states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createPlan, setCreatePlan] = useState("free");
  const [createExpiryDays, setCreateExpiryDays] = useState("7");
  const [isCreating, setIsCreating] = useState(false);

  // Add credit states
  const [addCreditDialogOpen, setAddCreditDialogOpen] = useState(false);
  const [creditApiKey, setCreditApiKey] = useState<string>("");
  const [creditAmount, setCreditAmount] = useState<string>("50");
  const [isAddingCredit, setIsAddingCredit] = useState(false);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchApiKeys = useCallback(async () => {
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

      if (selectedPlanFilter !== "all") {
        queryParams.append("plan", selectedPlanFilter);
      }

      if (selectedStatusFilter !== "all") {
        queryParams.append("status", selectedStatusFilter);
      }

      const response = await fetch(
        `${baseApi}/app/apikey/get?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch API keys");
      }

      const result = await response.json();

      if (result.success) {
        const responseData: ApiKeysResponse = result.data;
        setApiKeys(responseData.apiKeys);
        setTotalPages(responseData.totalPages);
        setTotalKeys(responseData.total);
        setCurrentPage(responseData.currentPage);
      } else {
        throw new Error(result.message || "Failed to fetch API keys");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    limit,
    debouncedSearchTerm,
    selectedPlanFilter,
    selectedStatusFilter,
  ]);

  // Fetch API keys when page, limit, or search term changes
  useEffect(() => {
    fetchApiKeys();
  }, [
    currentPage,
    limit,
    debouncedSearchTerm,
    selectedPlanFilter,
    selectedStatusFilter,
    fetchApiKeys,
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast("API key has been copied to clipboard");
  };

  const deleteApiKey = async (username: string) => {
    try {
      setDeletingUsername(username);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseApi}/app/apikey/delete/${username}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete API key");
      }

      const result = await response.json();

      if (result.success) {
        // Refresh the API keys list
        fetchApiKeys();

        toast("API key deleted successfully");
      } else {
        throw new Error(result.message || "Failed to delete API key");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setDeletingUsername(null);
    }
  };

  const resetDeviceId = async (apiKey: string) => {
    try {
      setProcessingKey(apiKey);
      setProcessingAction("reset-device");

      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseApi}/app/apikey/reset-device`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: apiKey,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to reset device ID");
      }

      if (result.success) {
        toast("Device ID reset successfully");

        // Refresh the API keys to get updated data
        await fetchApiKeys();
      } else {
        throw new Error(result.message || "Failed to reset device ID");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setProcessingKey(null);
      setProcessingAction(null);
    }
  };

  const updateKeyStatus = async (
    apiKey: string,
    mode: "suspend" | "reactivate"
  ) => {
    try {
      setProcessingKey(apiKey);
      setProcessingAction(mode);

      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseApi}/app/apikey/update-status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: apiKey,
          mode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${mode} API key`);
      }

      if (result.success) {
        toast(
          result.message ||
            `API key ${
              mode === "suspend" ? "suspended" : "reactivated"
            } successfully`
        );

        // Refresh the API keys list
        await fetchApiKeys();
      } else {
        throw new Error(result.message || `Failed to ${mode} API key`);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setProcessingKey(null);
      setProcessingAction(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-700 hover:bg-green-500/20";
      case "suspended":
        return "bg-red-500/20 text-red-700 hover:bg-red-500/20";
      default:
        return "bg-gray-500/20 text-gray-700 hover:bg-gray-500/20";
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "free":
        return "bg-gray-500/20 text-gray-700 hover:bg-gray-500/20";
      case "credit":
        return "bg-amber-500/20 text-amber-700 hover:bg-amber-500/20";
      case "subscription":
        return "bg-purple-500/20 text-purple-700 hover:bg-purple-500/20";
      default:
        return "bg-gray-500/20 text-gray-700 hover:bg-gray-500/20";
    }
  };

  const updateApiKey = async () => {
    try {
      setIsUpdating(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      // Create the request body with only the necessary fields
      const requestBody: {
        username: string;
        plan?: string;
        expiryDays?: number;
      } = {
        username: updateUsername,
      };

      // Only include the plan if it's set
      if (updatePlan) {
        requestBody.plan = updatePlan;
      }

      // Only include expiryDays if it's set and valid
      if (updateExpiryDays && !isNaN(Number(updateExpiryDays))) {
        requestBody.expiryDays = Number.parseInt(updateExpiryDays);
      }

      const response = await fetch(`${baseApi}/app/apikey/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to update API key");
      }

      const result = await response.json();

      if (result.success) {
        toast("API key updated successfully");

        // Refresh the API keys list
        await fetchApiKeys();

        setUpdateDialogOpen(false);
      } else {
        throw new Error(result.message || "Failed to update API key");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const createApiKey = async () => {
    try {
      setIsCreating(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      // Build request body based on selected plan
      const requestBody: {
        username: string;
        plan?: string | { type: string; id: string };
        expiryDays: number;
        initialCredit?: number;
      } = {
        username: createUsername,
        expiryDays: Number.parseInt(createExpiryDays),
      };

      // Handle different plan types
      if (createPlan === "credit") {
        requestBody.plan = "credit";
        requestBody.initialCredit = 100; // Default value, could be made configurable
      } else if (createPlan === "subscription") {
        requestBody.plan = {
          type: "subscription",
          id: "premium_monthly", // Default value, could be made configurable
        };
      } else {
        requestBody.plan = createPlan;
      }

      const response = await fetch(`${baseApi}/app/apikey/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create API key");
      }

      if (result.success) {
        // Refresh the API keys list to include the new key
        await fetchApiKeys();

        toast("API key created successfully");

        // Show the new API key in a toast for easy copying
        toast(
          <div className="mt-2 flex items-center space-x-2">
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
              {result.data.apiKey}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={() => copyToClipboard(result.data.apiKey)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        );

        setCreateDialogOpen(false);
        // Reset form
        setCreateUsername("");
        setCreatePlan("free");
        setCreateExpiryDays("7");
      } else {
        throw new Error(result.message || "Failed to create API key");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const openUpdateDialog = (apiKey: ApiKey) => {
    setUpdateUsername(apiKey.username);
    setUpdatePlan(apiKey.plan.type);
    setUpdateExpiryDays("30"); // Default to 30 days
    setUpdateDialogOpen(true);
  };

  const openCreateDialog = () => {
    setCreateUsername("");
    setCreatePlan("free");
    setCreateExpiryDays("7");
    setCreateDialogOpen(true);
  };

  const isProcessing = (apiKey: string, action: string) => {
    return processingKey === apiKey && processingAction === action;
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = [
      "Username",
      "API Key",
      "Plan",
      "Status",
      "Expires At",
      "Created At",
      "Processes",
      "Device Bound",
    ];
    const csvRows = [headers];

    apiKeys.forEach((key) => {
      const row = [
        key.username,
        key.key,
        key.plan.type, // Access the 'type' property of the plan
        key.status,
        key.expiresAt,
        key.createdAt,
        key.totalProcess.toString(),
        key.deviceId ? "Yes" : "No",
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
      `api-keys-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
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

  const renderApiKeyTable = () => {
    if (loading && apiKeys.length === 0) {
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

    if (error && apiKeys.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <XCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium">Error loading API keys</h3>
          <p className="text-muted-foreground mt-2 mb-4">{error}</p>
          <Button onClick={fetchApiKeys} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    if (apiKeys.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <KeyRound className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No API keys found</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {debouncedSearchTerm
              ? `No results found for "${debouncedSearchTerm}"`
              : "Create your first API key to get started"}
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Device Bound</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Processes</TableHead>
            {apiKeys.some((key) => key.credit !== undefined) && (
              <TableHead>Credit</TableHead>
            )}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.map((apiKey) => (
            <TableRow key={apiKey._id}>
              <TableCell className="font-medium">{apiKey.username}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs">
                    {apiKey.key.substring(0, 8)}...
                    {apiKey.key.substring(apiKey.key.length - 8)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(apiKey.key)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getPlanBadge(apiKey.plan.type)}
                >
                  {apiKey.plan.type.replace("_", " ")}
                  {apiKey.plan.id && ` (${apiKey.plan.id})`}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getStatusColor(apiKey.status)}
                >
                  {apiKey.status}
                </Badge>
              </TableCell>
              <TableCell>
                {apiKey.deviceId ? (
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-muted-foreground">Yes</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-muted-foreground mr-1" />
                    <span className="text-xs text-muted-foreground">No</span>
                  </div>
                )}
              </TableCell>
              <TableCell>{formatDate(apiKey.expiresAt)}</TableCell>
              <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
              <TableCell>{apiKey.totalProcess}</TableCell>
              {apiKeys.some((key) => key.credit !== undefined) && (
                <TableCell>{apiKey.credit || 0}</TableCell>
              )}
              <TableCell className="text-right flex items-center justify-end">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/admin/app/users/${apiKey.key}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View user details</span>
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => copyToClipboard(apiKey.key)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy API Key
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openUpdateDialog(apiKey)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Key
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {apiKey.plan.type === "credit" && (
                      <DropdownMenuItem
                        onClick={() => openAddCreditDialog(apiKey)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Credits
                      </DropdownMenuItem>
                    )}

                    {/* Reset Device ID option */}
                    <DropdownMenuItem
                      onClick={() => resetDeviceId(apiKey.key)}
                      disabled={isProcessing(apiKey.key, "reset-device")}
                    >
                      {isProcessing(apiKey.key, "reset-device") ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Smartphone className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing(apiKey.key, "reset-device")
                        ? "Resetting..."
                        : "Reset Device ID"}
                    </DropdownMenuItem>

                    {/* Suspend/Reactivate option */}
                    {apiKey.status === "active" ? (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => updateKeyStatus(apiKey.key, "suspend")}
                        disabled={isProcessing(apiKey.key, "suspend")}
                      >
                        {isProcessing(apiKey.key, "suspend") ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldAlert className="mr-2 h-4 w-4" />
                        )}
                        {isProcessing(apiKey.key, "suspend")
                          ? "Suspending..."
                          : "Suspend Key"}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        className="text-green-600"
                        onClick={() =>
                          updateKeyStatus(apiKey.key, "reactivate")
                        }
                        disabled={isProcessing(apiKey.key, "reactivate")}
                      >
                        {isProcessing(apiKey.key, "reactivate") ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="mr-2 h-4 w-4" />
                        )}
                        {isProcessing(apiKey.key, "reactivate")
                          ? "Reactivating..."
                          : "Reactivate Key"}
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Key
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the API key for {apiKey.username} and remove
                            it from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteApiKey(apiKey.username)}
                            disabled={deletingUsername === apiKey.username}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deletingUsername === apiKey.username ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const addCredits = async () => {
    try {
      setIsAddingCredit(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseApi}/app/apikey/add-credits`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: creditApiKey,
          credits: parseInt(creditAmount),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add credits");
      }

      if (result.success) {
        toast(result.message || `${creditAmount} credits added successfully`);

        // Refresh the API keys list
        await fetchApiKeys();

        setAddCreditDialogOpen(false);
        setCreditAmount("50");
      } else {
        throw new Error(result.message || "Failed to add credits");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsAddingCredit(false);
    }
  };

  const openAddCreditDialog = (apiKey: ApiKey) => {
    setCreditApiKey(apiKey.key);
    setCreditAmount("50");
    setAddCreditDialogOpen(true);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage your API keys and their permissions
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchApiKeys}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={openCreateDialog}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Create API Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or API key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <div className="w-40">
              <Select
                value={selectedPlanFilter}
                onValueChange={setSelectedPlanFilter}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by plan" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free Plan</SelectItem>
                  <SelectItem value="credit">Credit Plan</SelectItem>
                  <SelectItem value="subscription">
                    Subscription Plan
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select
                value={selectedStatusFilter}
                onValueChange={setSelectedStatusFilter}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Select
                value={limit.toString()}
                onValueChange={(value) => setLimit(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rows per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 rows</SelectItem>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="20">20 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {renderApiKeyTable()}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {apiKeys.length > 0 ? (currentPage - 1) * limit + 1 : 0} to{" "}
            {Math.min(currentPage * limit, totalKeys)} of {totalKeys} API keys
          </div>
          {totalPages > 1 && renderPagination()}
        </div>
      </CardContent>

      {/* Update API Key Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update API Key</DialogTitle>
            <DialogDescription>
              Update the plan, expiry days, or credit for the API key.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={updateUsername}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan">Plan</Label>
              <Select value={updatePlan} onValueChange={setUpdatePlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Plan</SelectItem>
                  <SelectItem value="credit">Credit Plan</SelectItem>
                  <SelectItem value="subscription">
                    Subscription Plan
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiryDays">Expiry Days</Label>
              <Input
                id="expiryDays"
                type="number"
                min="1"
                max="365"
                value={updateExpiryDays}
                onChange={(e) => setUpdateExpiryDays(e.target.value)}
              />
            </div>
            {updatePlan === "credit" && (
              <div className="grid gap-2">
                <Label htmlFor="credit">Credit</Label>
                <Input
                  id="credit"
                  type="number"
                  min="0"
                  placeholder="Credit amount"
                  defaultValue="0"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={updateApiKey} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for a user. The username must match an
              existing user&apos;s email in the database.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="createUsername">Username (Email)</Label>
              <Input
                id="createUsername"
                type="email"
                placeholder="user@example.com"
                value={createUsername}
                onChange={(e) => setCreateUsername(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createPlan">Plan</Label>
              <Select value={createPlan} onValueChange={setCreatePlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Plan</SelectItem>
                  <SelectItem value="credit">Credit Plan</SelectItem>
                  <SelectItem value="subscription">
                    Subscription Plan
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {createPlan === "credit" && (
              <div className="grid gap-2">
                <Label htmlFor="initialCredit">Initial Credits</Label>
                <Input
                  id="initialCredit"
                  type="number"
                  min="1"
                  defaultValue="100"
                />
              </div>
            )}

            {createPlan === "subscription" && (
              <div className="grid gap-2">
                <Label htmlFor="subscriptionPlanId">Subscription Plan ID</Label>
                <Select defaultValue="premium_monthly">
                  <SelectTrigger>
                    <SelectValue placeholder="Select subscription plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium_monthly">
                      Premium Monthly
                    </SelectItem>
                    <SelectItem value="premium_yearly">
                      Premium Yearly
                    </SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="createExpiryDays">Expiry Days</Label>
              <Input
                id="createExpiryDays"
                type="number"
                min="1"
                max="365"
                value={createExpiryDays}
                onChange={(e) => setCreateExpiryDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={createApiKey}
              disabled={isCreating || !createUsername.trim()}
              className="flex items-center gap-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Create Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Credits Dialog */}
      <Dialog open={addCreditDialogOpen} onOpenChange={setAddCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>
              Add additional credits to this API key.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="creditAmount">Credit Amount</Label>
              <Input
                id="creditAmount"
                type="number"
                min="1"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddCreditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={addCredits} disabled={isAddingCredit}>
              {isAddingCredit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Credits"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
