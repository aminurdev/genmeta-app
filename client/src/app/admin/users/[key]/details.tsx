"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Edit,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  XCircle,
  Plus,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { api } from "@/services/api-client";

interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AppUserDetails {
  id: string;
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
    name?: string;
  };
  credit?: number | null;
  totalProcess: number;
  createdAt: string;
  allowedDevices?: string[];
  monthlyUsage: Record<string, number>;
  isValid: boolean;
}

interface Payment {
  trxID: string;
  plan: {
    type: string;
    name?: string;
  };
  amount: number;
  createdAt: string;
  id: string;
}

interface AppUserDetailsResponse {
  user: UserDetails;
  appUser: AppUserDetails;
  payments: Payment[];
}

export default function AppUserDetailsPage({ userKey }: { userKey: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [appUserDetails, setAppUserDetails] = useState<AppUserDetails | null>(
    null,
  );
  const [payments, setPayments] = useState<Payment[]>([]);

  // Action states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updatePlan, setUpdatePlan] = useState("");
  const [updateExpiryDays, setUpdateExpiryDays] = useState("30");

  // Add credit states
  const [addCreditDialogOpen, setAddCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState<string>("50");
  const [isAddingCredit, setIsAddingCredit] = useState(false);

  const fetchAppUserDetails = async (key: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/app/appuser/user/details/${key}`);
      const result = response.data;

      if (result.success) {
        const responseData: AppUserDetailsResponse = result.data;
        setUserDetails(responseData.user);
        setAppUserDetails(responseData.appUser);
        setPayments(responseData.payments);

        if (responseData.appUser) {
          setUpdatePlan(responseData.appUser.plan.type);
        }
      } else {
        throw new Error(result.message || "Failed to fetch App User details");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userKey) {
      fetchAppUserDetails(userKey);
    } else {
      setError("No user key provided");
      setLoading(false);
    }
  }, [userKey]);

  const copyToClipboard = (text: string, message = "Copied to clipboard") => {
    navigator.clipboard.writeText(text);
    toast(message);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "free":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "credit":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400";
      case "subscription":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getChartData = () => {
    if (!appUserDetails?.monthlyUsage) return [];

    return Object.entries(appUserDetails.monthlyUsage)
      .map(([month, count]) => ({
        month,
        usage: count,
      }))
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime(),
      );
  };

  const handleUpdateAppUser = async () => {
    if (!appUserDetails) return;

    try {
      setIsUpdating(true);
      const requestBody: {
        username: string;
        plan?: string;
        expiryDays?: number;
        credit?: number;
      } = {
        username: appUserDetails.username,
      };

      if (updatePlan) {
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

      const response = await api.put("/app/appuser/update", requestBody);
      const result = response.data;

      if (result.success) {
        toast("App user updated successfully");
        setUpdateDialogOpen(false);

        if (userKey) {
          fetchAppUserDetails(userKey);
        }
      } else {
        throw new Error(result.message || "Failed to update app user");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const resetDeviceId = async () => {
    if (!appUserDetails) return;

    try {
      setIsResetting(true);
      const response = await api.put("/app/appuser/reset-device", {
        key: appUserDetails.key,
      });
      const result = response.data;

      if (result.success) {
        toast("Device ID reset successfully");

        if (userKey) {
          fetchAppUserDetails(userKey);
        }
      } else {
        throw new Error(result.message || "Failed to reset device ID");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsResetting(false);
    }
  };

  const updateUserStatus = async (mode: "suspend" | "reactivate") => {
    if (!appUserDetails) return;

    try {
      setIsChangingStatus(true);
      const response = await api.put("/app/appuser/update-status", {
        key: appUserDetails.key,
        mode,
      });
      const result = response.data;

      if (result.success) {
        toast(
          result.message ||
            `App user ${
              mode === "suspend" ? "suspended" : "reactivated"
            } successfully`,
        );

        if (userKey) {
          fetchAppUserDetails(userKey);
        }
      } else {
        throw new Error(result.message || `Failed to ${mode} App User`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsChangingStatus(false);
    }
  };

  const deleteAppUser = async () => {
    if (!appUserDetails) return;

    try {
      setIsDeleting(true);
      const response = await api.delete(
        `/app/appuser/delete/${encodeURIComponent(appUserDetails.username)}`,
      );
      const result = response.data;

      if (result.success) {
        toast("App user deleted successfully");
        router.push("/admin/users");
      } else {
        throw new Error(result.message || "Failed to delete App User");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const openUpdateDialog = () => {
    if (!appUserDetails) return;

    setUpdatePlan(appUserDetails.plan.type);
    setUpdateExpiryDays("30");
    setUpdateDialogOpen(true);
  };

  const addCredits = async () => {
    if (!appUserDetails) return;

    try {
      setIsAddingCredit(true);
      const response = await api.put("/app/appuser/add-credits", {
        key: appUserDetails.key,
        credits: Number.parseInt(creditAmount),
      });
      const result = response.data;

      if (result.success) {
        toast(result.message || `${creditAmount} credits added successfully`);

        if (userKey) {
          fetchAppUserDetails(userKey);
        }

        setAddCreditDialogOpen(false);
        setCreditAmount("50");
      } else {
        throw new Error(result.message || "Failed to add credits");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsAddingCredit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading App User details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">Error loading App User details</h3>
        <p className="text-muted-foreground mt-2 mb-4">{error}</p>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App Users
            </Link>
          </Button>
          {userKey && (
            <Button onClick={() => fetchAppUserDetails(userKey)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!appUserDetails || !userDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">App User not found</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          The requested App User could not be found.
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/users" className="text-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to App Users
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">App User Details</h1>
            <p className="text-sm text-muted-foreground">
              Manage and monitor App User access & usage
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchAppUserDetails(userKey)}
          size="sm"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="font-medium text-muted-foreground">Name</div>
              <div className="col-span-2">{userDetails.name}</div>

              <div className="font-medium text-muted-foreground">Email</div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="truncate">{userDetails.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(userDetails.email)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="font-medium text-muted-foreground">Role</div>
              <div className="col-span-2">
                <Badge variant="secondary" className="text-xs">
                  {userDetails.role}
                </Badge>
              </div>

              <div className="font-medium text-muted-foreground">User ID</div>
              <div className="col-span-2 flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {String(userDetails.id).substring(0, 8)}...
                  {String(userDetails.id).substring(String(userDetails.id).length - 8)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(String(userDetails.id))}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="font-medium text-muted-foreground">
                Registered
              </div>
              <div className="col-span-2 text-sm">
                {formatDate(userDetails.createdAt)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App User License Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">App User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="font-medium text-muted-foreground">Access Key</div>
              <div className="col-span-2 flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {appUserDetails.key.substring(0, 8)}...
                  {appUserDetails.key.substring(appUserDetails.key.length - 8)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(appUserDetails.key)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="font-medium text-muted-foreground">Status</div>
              <div className="col-span-2">
                <Badge className={getStatusColor(appUserDetails.status)}>
                  {appUserDetails.status}
                </Badge>
              </div>

              <div className="font-medium text-muted-foreground">Plan</div>
              <div className="col-span-2">
                <Badge className={getPlanBadge(appUserDetails.plan.type)}>
                  {appUserDetails.plan.type.replace("_", " ")}
                </Badge>
              </div>

              {appUserDetails.plan.type !== "subscription" &&
                appUserDetails.credit !== null && (
                  <>
                    <div className="font-medium text-muted-foreground">
                      Credits
                    </div>
                    <div className="col-span-2 text-lg font-semibold text-green-600">
                      {appUserDetails.credit}
                    </div>
                  </>
                )}

              <div className="font-medium text-muted-foreground">
                Device Bound
              </div>
              <div className="col-span-2">
                {(appUserDetails?.allowedDevices?.length ?? 0) > 0 ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Yes ({appUserDetails.allowedDevices?.length})
                  </Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </div>

              <div className="font-medium text-muted-foreground">
                Total Usage
              </div>
              <div className="col-span-2 text-lg font-semibold">
                {appUserDetails.totalProcess.toLocaleString()}
              </div>

              <div className="font-medium text-muted-foreground">Created</div>
              <div className="col-span-2 text-sm">
                {formatDate(appUserDetails.createdAt)}
              </div>

              <div className="font-medium text-muted-foreground">Expires</div>
              <div className="col-span-2 text-sm">
                {formatDate(appUserDetails.expiresAt)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={openUpdateDialog}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={resetDeviceId}
              disabled={isResetting || !appUserDetails.allowedDevices?.length}
            >
              {isResetting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="mr-2 h-4 w-4" />
              )}
              Reset Device
            </Button>
            {appUserDetails.status === "active" ? (
              <Button
                variant="outline"
                onClick={() => updateUserStatus("suspend")}
                disabled={isChangingStatus}
              >
                {isChangingStatus ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldAlert className="mr-2 h-4 w-4" />
                )}
                Suspend
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => updateUserStatus("reactivate")}
                disabled={isChangingStatus}
              >
                {isChangingStatus ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Reactivate
              </Button>
            )}
            {appUserDetails.plan.type !== "subscription" && (
              <Button
                variant="outline"
                onClick={() => setAddCreditDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Credits
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete App User</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the App User profile for{" "}
                    <span className="font-semibold">{userDetails.name}</span>.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAppUser}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Usage Statistics
          </CardTitle>
          <CardDescription>Processing usage breakdown by month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {getChartData().length > 0 ? (
            <div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="month"
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="usage"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{
                        fill: "hsl(var(--primary))",
                        strokeWidth: 2,
                        r: 4,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Processes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getChartData().map((item) => (
                      <TableRow key={item.month}>
                        <TableCell className="font-medium">
                          {item.month}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.usage.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No usage data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {payment.trxID}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {payment.plan.name || payment.plan.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No payment history available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update App User</DialogTitle>
            <DialogDescription>
              Update the plan, expiry days, or credit for this app user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={appUserDetails.username}
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
            {updatePlan === "credit" && (
              <div className="grid gap-2">
                <Label htmlFor="credit">Credit</Label>
                <Input
                  id="credit"
                  type="number"
                  min="0"
                  placeholder="Credit amount"
                  defaultValue={appUserDetails.credit?.toString() || "0"}
                />
              </div>
            )}
            {updatePlan !== "free" && (
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

      <Dialog open={addCreditDialogOpen} onOpenChange={setAddCreditDialogOpen}>
        <DialogContent className="max-w-md">
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
    </div>
  );
}
