"use client";

import { useEffect, useState } from "react";
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
  User2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { AppUsers } from "@/types/admin";
import { useAllUsersQuery } from "@/services/queries/admin-dashboard";
import PaginationView from "@/components/pagination-view";
import {
  addCredits,
  createUser,
  deleteAppUser,
  resetDeviceId,
  updateUser,
  updateUserStats,
} from "@/services/admin-dashboard";

export default function AppUserList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("all");

  const buildQueryParams = () => {
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

    return queryParams.toString();
  };

  const { data, isLoading, error, refetch } =
    useAllUsersQuery(buildQueryParams());

  const responseData = data && data.success ? data.data : undefined;
  const appUsers = responseData?.users ?? [];
  const totalPages =
    responseData?.totalPages ??
    ((data as unknown as Record<string, Record<string, { totalPages?: number }>>)?.data?.pagination?.totalPages || 1);
  const totalUsers =
    responseData?.total ??
    ((data as unknown as Record<string, Record<string, { total?: number }>>)?.data?.pagination?.total || 0);

  // Action states
  const [deletingUsername, setDeletingUsername] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateUsername, setUpdateUsername] = useState("");
  const [updatePlan, setUpdatePlan] = useState("");
  const [updateExpiryDays, setUpdateExpiryDays] = useState("30");
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Create App User states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createPlan, setCreatePlan] = useState("free");
  const [createExpiryDays, setCreateExpiryDays] = useState("7");
  const [isCreating, setIsCreating] = useState(false);

  // Add credit states
  const [addCreditDialogOpen, setAddCreditDialogOpen] = useState(false);
  const [creditAppUserKey, setCreditAppUserKey] = useState<string>("");
  const [creditAmount, setCreditAmount] = useState<string>("50");
  const [isAddingCredit, setIsAddingCredit] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast("Access key has been copied to clipboard");
  };

  const deleteUser = async (username: string) => {
    try {
      setDeletingUsername(username);
      const result = await deleteAppUser(username);
      if (result.success) {
        toast("App user deleted successfully");
        await refetch();
      } else {
        throw new Error(result.message || "Failed to delete app user");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setDeletingUsername(null);
    }
  };

  const handleResetDeviceId = async (key: string) => {
    try {
      setProcessingKey(key);
      setProcessingAction("reset-device");
      const result = await resetDeviceId(key);

      if (result.success) {
        toast("Device ID reset successfully");
        await refetch();
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

  const handleUpdateUserStatus = async (
    key: string,
    mode: "suspend" | "reactivate",
  ) => {
    try {
      setProcessingKey(key);
      setProcessingAction(mode);

      const result = await updateUserStats(key, mode);

      if (result.success) {
        toast(
          result.message ||
            `App user ${
              mode === "suspend" ? "suspended" : "reactivated"
            } successfully`,
        );
        await refetch();
      } else {
        throw new Error(result.message || `Failed to ${mode} app user`);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setProcessingKey(null);
      setProcessingAction(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";

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

  const handleUpdateAppUser = async () => {
    try {
      setIsUpdating(true);

      const requestBody: {
        username: string;
        plan?: string;
        expiryDays?: number;
        credit?: number;
      } = {
        username: updateUsername,
      };

      if (updatePlan && updatePlan !== "N/A") {
        requestBody.plan = updatePlan;
      }

      if (updateExpiryDays && !isNaN(Number(updateExpiryDays))) {
        requestBody.expiryDays = Number.parseInt(updateExpiryDays);
      }

      if (updatePlan === "credit") {
        const creditInput = document.getElementById(
          "credit",
        ) as HTMLInputElement;
        if (creditInput && creditInput.value) {
          requestBody.credit = Number.parseInt(creditInput.value);
        }
      }

      const result = await updateUser(requestBody);

      if (result.success) {
        toast("App user updated successfully");
        await refetch();
        setUpdateDialogOpen(false);
      } else {
        throw new Error(result.message || "Failed to update app user");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateAppUser = async () => {
    try {
      setIsCreating(true);

      const requestBody: {
        username: string;
        plan?: string | { type: string; id: string };
        expiryDays: number;
        initialCredit?: number;
      } = {
        username: createUsername,
        expiryDays: Number.parseInt(createExpiryDays),
      };

      if (createPlan === "credit") {
        requestBody.plan = "credit";
        const initialCreditInput = document.getElementById(
          "initialCredit",
        ) as HTMLInputElement;
        requestBody.initialCredit = initialCreditInput
          ? Number.parseInt(initialCreditInput.value) || 100
          : 100;
      } else if (createPlan === "subscription") {
        requestBody.plan = {
          type: "subscription",
          id: "premium_monthly",
        };
      } else {
        requestBody.plan = createPlan;
      }

      const result = await createUser(requestBody);

      if (result.success) {
        await refetch();
        toast("App user created successfully");

        const createdKey = result.data?.key;
        if (createdKey) {
          toast(
            <div className="mt-2 flex items-center space-x-2">
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                {createdKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => copyToClipboard(createdKey)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>,
          );
        }

        setCreateDialogOpen(false);
        setCreateUsername("");
        setCreatePlan("free");
        setCreateExpiryDays("7");
      } else {
        throw new Error(result.message || "Failed to create app user");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const openUpdateDialog = (appUser: AppUsers) => {
    setUpdateUsername(appUser.username || appUser.email || "");
    setUpdatePlan(appUser.plan?.type || "N/A");
    setUpdateExpiryDays("30");
    setUpdateDialogOpen(true);
  };

  const openCreateDialog = () => {
    setCreateUsername("");
    setCreatePlan("free");
    setCreateExpiryDays("7");
    setCreateDialogOpen(true);
  };

  const isProcessing = (key: string, action: string) => {
    return processingKey === key && processingAction === action;
  };

  const exportToCSV = () => {
    const headers = [
      "Username",
      "Access Key",
      "Plan",
      "Status",
      "Expires At",
      "Created At",
      "Processes",
      "Device Bound",
    ];
    const csvRows = [headers];

    appUsers.forEach((user) => {
      const row = [
        user.username,
        user.key,
        user.plan?.type ?? "",
        user.status,
        user.expiresAt ?? "",
        user.createdAt,
        user.totalProcess?.toString() ?? "0",
        (user.allowedDevices?.length ?? 0) > 0 ? "Yes" : "No",
      ];
      csvRows.push(row.map((value) => value?.toString() ?? ""));
    });

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `app-users-export-${new Date().toISOString().split("T")[0]}.csv`,
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

  const renderAppUserTable = () => {
    if (isLoading && appUsers.length === 0) {
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

    if (error && appUsers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <XCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium">Error loading App Users</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {error instanceof Error
              ? error.message
              : "An unknown error occurred"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    if (appUsers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <User2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No App Users found</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {debouncedSearchTerm
              ? `No results found for "${debouncedSearchTerm}"`
              : "Create your first App User to get started"}
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create App User
          </Button>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Access Key</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Device Bound</TableHead>
            <TableHead className="text-center">Expires</TableHead>
            <TableHead className="text-center">Created</TableHead>
            <TableHead className="text-center">Processes</TableHead>
            {appUsers.some((u) => u.credit !== undefined) && (
              <TableHead className="text-center">Credit</TableHead>
            )}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appUsers.map((appUser) => (
            <TableRow key={appUser._id}>
              <TableCell className="font-medium">
                {appUser.username || appUser.email || appUser.name || "User"}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {appUser.key ? (
                    <>
                      <span className="font-mono text-xs">
                        {appUser.key.length > 16
                          ? `${appUser.key.substring(0, 8)}...${appUser.key.substring(
                              appUser.key.length - 8,
                            )}`
                          : appUser.key}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(appUser.key)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Not initialized
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getPlanBadge(appUser.plan?.type || "")}
                >
                  {appUser.plan?.type.replace("_", " ")}
                  {appUser.plan?.id && appUser.plan?.name
                    ? ` (${appUser.plan.name})`
                    : ""}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getStatusColor(appUser.status)}
                >
                  {appUser.status}
                </Badge>
              </TableCell>
              <TableCell className="flex justify-center">
                {(appUser.allowedDevices?.length ?? 0) > 0 ? (
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
              <TableCell className="text-center">
                {formatDate(appUser?.expiresAt || "")}
              </TableCell>
              <TableCell className="text-center">
                {formatDate(appUser.createdAt)}
              </TableCell>
              <TableCell className="text-center">
                {appUser.totalProcess}
              </TableCell>
              {appUsers.some((u) => u.credit !== undefined) && (
                <TableCell className="text-center">
                  {appUser.plan?.type === "subscription"
                    ? "Unlimited"
                    : appUser.credit || 0}
                </TableCell>
              )}
              <TableCell className="text-right flex items-center justify-end">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/admin/users/${appUser.key || appUser._id}`}>
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
                    {appUser.key && (
                      <DropdownMenuItem
                        onClick={() => copyToClipboard(appUser.key)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Access Key
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => openUpdateDialog(appUser)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit App User
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {appUser.plan?.type === "credit" && appUser.key && (
                      <DropdownMenuItem
                        onClick={() => openAddCreditDialog(appUser)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Credits
                      </DropdownMenuItem>
                    )}

                    {appUser.key && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleResetDeviceId(appUser.key)}
                          disabled={isProcessing(appUser.key, "reset-device")}
                        >
                          {isProcessing(appUser.key, "reset-device") ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Smartphone className="mr-2 h-4 w-4" />
                          )}
                          {isProcessing(appUser.key, "reset-device")
                            ? "Resetting..."
                            : "Reset Device ID"}
                        </DropdownMenuItem>

                        {appUser.status === "active" ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              handleUpdateUserStatus(appUser.key, "suspend")
                            }
                            disabled={isProcessing(appUser.key, "suspend")}
                          >
                            {isProcessing(appUser.key, "suspend") ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldAlert className="mr-2 h-4 w-4" />
                            )}
                            {isProcessing(appUser.key, "suspend")
                              ? "Suspending..."
                              : "Suspend App User"}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() =>
                              handleUpdateUserStatus(appUser.key, "reactivate")
                            }
                            disabled={isProcessing(appUser.key, "reactivate")}
                          >
                            {isProcessing(appUser.key, "reactivate") ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldCheck className="mr-2 h-4 w-4" />
                            )}
                            {isProcessing(appUser.key, "reactivate")
                              ? "Reactivating..."
                              : "Reactivate App User"}
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    <DropdownMenuSeparator />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete App User
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the app user access for {appUser.username} and
                            remove it from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUser(appUser.username)}
                            disabled={deletingUsername === appUser.username}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deletingUsername === appUser.username ? (
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

  const handleAddCredits = async () => {
    try {
      setIsAddingCredit(true);

      const result = await addCredits(creditAppUserKey, parseInt(creditAmount));

      if (result.success) {
        toast(result.message || `${creditAmount} credits added successfully`);
        await refetch();
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

  const openAddCreditDialog = (appUser: AppUsers) => {
    setCreditAppUserKey(appUser.key);
    setCreditAmount("50");
    setAddCreditDialogOpen(true);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between max-md:flex-col max-md:items-start gap-4">
        <div>
          <CardTitle>App Users</CardTitle>
          <CardDescription>
            Manage app users and their access permissions
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
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
            Create App User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or access key..."
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

        {renderAppUserTable()}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {appUsers.length > 0 ? (currentPage - 1) * limit + 1 : 0} to{" "}
            {Math.min(currentPage * limit, totalUsers ?? 0)} of {totalUsers ?? 0}{" "}
            App Users
          </div>
          <PaginationView
            currentPage={currentPage}
            totalPages={totalPages}
            paginationItemsToDisplay={5}
            handlePageChange={handlePageChange}
          />
        </div>
      </CardContent>

      {/* Update App User Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update App User</DialogTitle>
            <DialogDescription>
              Update the plan and expiry settings for this app user.
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
              {updatePlan !== "free" && (
                <>
                  <Label htmlFor="expiryDays">Expiry Days</Label>
                  <Input
                    id="expiryDays"
                    type="number"
                    min="1"
                    max="365"
                    value={updateExpiryDays}
                    onChange={(e) => setUpdateExpiryDays(e.target.value)}
                  />
                </>
              )}
            </div>
            {updatePlan === "credit" && (
              <div className="grid gap-2">
                <Label htmlFor="credit">Credit</Label>
                <Input
                  id="credit"
                  type="number"
                  min="0"
                  placeholder="Credit amount"
                  defaultValue="1000"
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
            <Button onClick={handleUpdateAppUser} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create App User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New App User</DialogTitle>
            <DialogDescription>
              Create a new app user access profile. The username must match an
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAppUser}
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
                  Create User
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
              Add additional credits to this app user.
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
            <Button onClick={handleAddCredits} disabled={isAddingCredit}>
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
