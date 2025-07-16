"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { getBaseApi } from "@/services/image-services";
import { getAccessToken } from "@/services/auth-services";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Copy,
  Edit,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
  XCircle,
  Plus,
} from "lucide-react";

interface UserDetails {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AppKeyDetails {
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
  monthlyProcess: Record<string, number>;
  isValid: boolean;
}

interface Payment {
  _id: string;
  trxID: string;
  plan: {
    type: string;
  };
  amount: number;
  createdAt: string;
}

interface AppKeyDetailsResponse {
  user: UserDetails;
  appKey: AppKeyDetails;
  payments: Payment[];
}

export default function AppKeyDetailsPage({ appKey }: { appKey: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [appKeyDetails, setAppKeyDetails] = useState<AppKeyDetails | null>(
    null
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

  useEffect(() => {
    if (appKey) {
      fetchAppKeyDetails(appKey);
    } else {
      setError("No API key provided");
      setLoading(false);
    }
  }, [appKey]);

  const fetchAppKeyDetails = async (key: string) => {
    try {
      setLoading(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${baseApi}/app/appkey/user/details/${key}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch API key details");
      }

      const result = await response.json();

      if (result.success) {
        const responseData: AppKeyDetailsResponse = result.data;
        setUserDetails(responseData.user);
        setAppKeyDetails(responseData.appKey);
        setPayments(responseData.payments);

        // Initialize update form with current values
        if (responseData.appKey) {
          setUpdatePlan(responseData.appKey.plan.type);
        }
      } else {
        throw new Error(result.message || "Failed to fetch API key details");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, message = "Copied to clipboard") => {
    navigator.clipboard.writeText(text);
    toast(message);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-700 hover:bg-green-500/20";
      case "suspended":
        return "bg-red-500/20 text-red-700 hover:bg-red-500/20";
      default:
        return "bg-gray-500/20 text-gray-700 hover:bg-gray-500/20";
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "free":
        return "bg-gray-500/20 text-gray-700 hover:bg-gray-500/20";
      case "free_trial":
        return "bg-blue-500/20 text-blue-700 hover:bg-blue-500/20";
      case "credit":
        return "bg-amber-500/20 text-amber-700 hover:bg-amber-500/20";
      case "subscription":
        return "bg-purple-500/20 text-purple-700 hover:bg-purple-500/20";
      default:
        return "bg-gray-500/20 text-gray-700 hover:bg-gray-500/20";
    }
  };

  const updateAppKey = async () => {
    if (!appKeyDetails) return;

    try {
      setIsUpdating(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      // Create the request body with only the necessary fields
      const requestBody: {
        username: string;
        plan?: string;
        expiryDays?: number;
        credit?: number;
      } = {
        username: appKeyDetails.username,
      };

      // Only include the plan if it's set
      if (updatePlan) {
        requestBody.plan = updatePlan;
      }

      // Only include expiryDays if it's set and valid
      if (updateExpiryDays && !isNaN(Number(updateExpiryDays))) {
        requestBody.expiryDays = Number.parseInt(updateExpiryDays);
      }

      // Include credit if credit plan and value set
      if (updatePlan === "credit") {
        const creditInput = document.getElementById(
          "credit"
        ) as HTMLInputElement;
        if (creditInput && creditInput.value) {
          requestBody.credit = Number.parseInt(creditInput.value);
        }
      }

      const response = await fetch(`${baseApi}/app/appkey/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to update app user");
      }

      const result = await response.json();

      if (result.success) {
        toast("App user updated successfully");
        setUpdateDialogOpen(false);

        // Refresh the app user details
        if (appKey) {
          fetchAppKeyDetails(appKey);
        }
      } else {
        throw new Error(result.message || "Failed to update app user");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const resetDeviceId = async () => {
    if (!appKeyDetails) return;

    try {
      setIsResetting(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseApi}/app/appkey/reset-device`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: appKeyDetails.key,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to reset device ID");
      }

      if (result.success) {
        toast("Device ID reset successfully");

        // Refresh the API key details
        if (appKey) {
          fetchAppKeyDetails(appKey);
        }
      } else {
        throw new Error(result.message || "Failed to reset device ID");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsResetting(false);
    }
  };

  const updateKeyStatus = async (mode: "suspend" | "reactivate") => {
    if (!appKeyDetails) return;

    try {
      setIsChangingStatus(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseApi}/app/appkey/update-status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: appKeyDetails.key,
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

        // Refresh the API key details
        if (appKey) {
          fetchAppKeyDetails(appKey);
        }
      } else {
        throw new Error(result.message || `Failed to ${mode} API key`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsChangingStatus(false);
    }
  };

  const deleteAppKey = async () => {
    if (!appKeyDetails) return;

    try {
      setIsDeleting(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${baseApi}/app/appkey/delete/${appKeyDetails.username}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete API key");
      }

      const result = await response.json();

      if (result.success) {
        toast("API key deleted successfully");

        // Navigate back to the API keys list
        router.push("/api-keys");
      } else {
        throw new Error(result.message || "Failed to delete API key");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const openUpdateDialog = () => {
    if (!appKeyDetails) return;

    setUpdatePlan(appKeyDetails.plan.type);
    setUpdateExpiryDays("30"); // Default to 30 days
    setUpdateDialogOpen(true);
  };

  const addCredits = async () => {
    if (!appKeyDetails) return;

    try {
      setIsAddingCredit(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseApi}/app/appkey/add-credits`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: appKeyDetails.key,
          credits: parseInt(creditAmount),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add credits");
      }

      if (result.success) {
        toast(result.message || `${creditAmount} credits added successfully`);

        // Refresh the API key details
        if (appKey) {
          fetchAppKeyDetails(appKey);
        }

        setAddCreditDialogOpen(false);
        setCreditAmount("50");
      } else {
        throw new Error(result.message || "Failed to add credits");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsAddingCredit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading API key details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">Error loading API key details</h3>
        <p className="text-muted-foreground mt-2 mb-4">{error}</p>
        <div className="flex gap-4">
          <Button onClick={() => router.push("/api-keys")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to API Keys
          </Button>
          {appKey && (
            <Button onClick={() => fetchAppKeyDetails(appKey)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!appKeyDetails || !userDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">API key not found</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          The requested API key could not be found.
        </p>
        <Button onClick={() => router.push("/api-keys")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to API Keys
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/api-keys")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-2xl font-bold">API Key Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchAppKeyDetails(appKey!)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>
              Details about the user associated with this API key
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">Name</div>
              <div className="col-span-2">{userDetails.name}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">Email</div>
              <div className="col-span-2 flex items-center gap-2">
                {userDetails.email}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    copyToClipboard(
                      userDetails.email,
                      "Email copied to clipboard"
                    )
                  }
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">Role</div>
              <div className="col-span-2 capitalize">{userDetails.role}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">User ID</div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-xs font-mono truncate">
                  {userDetails._id}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    copyToClipboard(
                      userDetails._id,
                      "User ID copied to clipboard"
                    )
                  }
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">Registered</div>
              <div className="col-span-2">
                {/* {formatDate(userDetails.createdAt)} */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Key Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              API Key Details
            </CardTitle>
            <CardDescription>
              Information about the API key and its usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">API Key</div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="font-mono text-xs truncate">
                  {appKeyDetails.key.substring(0, 8)}...
                  {appKeyDetails.key.substring(appKeyDetails.key.length - 8)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    copyToClipboard(
                      appKeyDetails.key,
                      "API key copied to clipboard"
                    )
                  }
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">Status</div>
              <div className="col-span-2">
                <Badge
                  variant="outline"
                  className={getStatusColor(appKeyDetails.status)}
                >
                  {appKeyDetails.status}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">Plan</div>
              <div className="col-span-2">
                <Badge
                  variant="outline"
                  className={getPlanBadge(appKeyDetails.plan.type)}
                >
                  {appKeyDetails.plan.type.replace("_", " ")}
                  {appKeyDetails.plan.id && ` (${appKeyDetails.plan.id})`}
                </Badge>
              </div>
            </div>
            {appKeyDetails.credit !== undefined && (
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium">Credits Remaining</div>
                <div className="col-span-2">{appKeyDetails.credit}</div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">Device Bound</div>
              <div className="col-span-2">
                {appKeyDetails.deviceId ? (
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                    <span>Yes</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-muted-foreground mr-1" />
                    <span>No</span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">Total Processes</div>
              <div className="col-span-2">{appKeyDetails.totalProcess}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">Created</div>
              <div className="col-span-2">
                {/* {formatDate(appKeyDetails.createdAt)} */}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">Expires</div>
              <div className="col-span-2">
                {/* {formatDate(appKeyDetails.expiresAt)} */}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={openUpdateDialog}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={resetDeviceId}
              disabled={isResetting}
            >
              {isResetting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="mr-2 h-4 w-4" />
              )}
              {isResetting ? "Resetting..." : "Reset Device ID"}
            </Button>
            {appKeyDetails.status === "active" ? (
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => updateKeyStatus("suspend")}
                disabled={isChangingStatus}
              >
                {isChangingStatus ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldAlert className="mr-2 h-4 w-4" />
                )}
                {isChangingStatus ? "Suspending..." : "Suspend Key"}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="text-green-600"
                onClick={() => updateKeyStatus("reactivate")}
                disabled={isChangingStatus}
              >
                {isChangingStatus ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                {isChangingStatus ? "Reactivating..." : "Reactivate Key"}
              </Button>
            )}
            {appKeyDetails.plan.type === "credit" && (
              <Button
                variant="outline"
                onClick={() => setAddCreditDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Credits
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Key
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the API key for{" "}
                    <span className="font-semibold">
                      {appKeyDetails.username}
                    </span>{" "}
                    and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAppKey}
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
          </CardFooter>
        </Card>
      </div>

      {/* Monthly Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Usage
          </CardTitle>
          <CardDescription>API usage statistics by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(appKeyDetails.monthlyProcess || {}).map(
              ([month, count]) => (
                <Card key={month}>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{count}</div>
                    <p className="text-sm text-muted-foreground">
                      Processes in {month}
                    </p>
                  </CardContent>
                </Card>
              )
            )}
            {Object.keys(appKeyDetails.monthlyProcess || {}).length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                No monthly usage data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Recent payments made by this user</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
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
                  <TableRow key={payment._id}>
                    <TableCell className="font-medium">
                      {payment.trxID}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.plan.type}
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      {/* {formatDate(payment.createdAt)} */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No payment history available
            </div>
          )}
        </CardContent>
      </Card>

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
                value={appKeyDetails.username}
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
                  <SelectItem value="free_trial">Free Trial</SelectItem>
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
                  defaultValue={appKeyDetails.credit?.toString() || "0"}
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
            <Button onClick={updateAppKey} disabled={isUpdating}>
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
    </div>
  );
}
