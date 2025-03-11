"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse } from "@/app/(main)/dashboard/page";
import { getAccessToken, getBaseApi } from "@/services/image-services";
import { getCurrentUser } from "@/services/auth-services";

interface DataProps {
  userActivity: ApiResponse["data"]["userActivity"];
  isLoading?: boolean;
}

// Calculate renewal date from expiration date
const calculateRenewalDate = (expiresDate: string): string => {
  if (!expiresDate) return "No active subscription";

  try {
    const date = new Date(expiresDate);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid renewal date";
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error calculating renewal date:", error);
    return "Error calculating renewal date";
  }
};

export default function AccountTab({
  userActivity,
  isLoading = false,
}: DataProps) {
  const [savingAccount, setSavingAccount] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [accountForm, setAccountForm] = useState({
    id: "",
    name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  interface User {
    id: string;
    name: string;
    email: string;
  }

  useEffect(() => {
    const fetchUser = async () => {
      const user: User = await getCurrentUser();
      if (user) {
        setAccountForm({
          id: user.id,
          name: user.name,
          email: user.email,
        });
      }
    };

    fetchUser();
  }, []);

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setAccountForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [id]: value,
    }));

    // Clear error when typing
    if (passwordErrors[id as keyof typeof passwordErrors]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [id]: "",
      }));
    }
  };

  // Save account changes
  const handleSaveAccount = async () => {
    setSavingAccount(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success
      toast.success("Account details updated successfully");
    } catch (error) {
      console.error("Error saving account details:", error);
      toast.error("Failed to update account details");
    } finally {
      setSavingAccount(false);
    }
  };

  // Update password
  const handleUpdatePassword = async () => {
    // Validate passwords
    const errors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Check if there are any errors
    if (Object.values(errors).some((error) => error)) {
      setPasswordErrors(errors);
      return;
    }

    setUpdatingPassword(true);

    try {
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseApi}/users/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(passwordForm),
      });

      const result = await response.json();

      if (result.success || result.status === "success") {
        toast.success(result.message || "Password updated successfully");

        // Reset form on success
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(result.message || "Failed to update password");

        // If the error is about invalid old password, set the error
        if (result.message?.toLowerCase().includes("invalid old password")) {
          setPasswordErrors((prev) => ({
            ...prev,
            currentPassword: "Invalid current password",
          }));
        }
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Enable 2FA
  const handleEnable2FA = () => {
    toast.info("Two-factor authentication setup will be available soon");
  };

  // Determine subscription status
  const subscriptionStatus = userActivity?.plan?.status || "inactive";
  const isSubscriptionActive = subscriptionStatus.toLowerCase() === "active";

  // Format plan price
  const formatPrice = (price: number) => {
    if (!price && price !== 0) return "N/A";
    return `৳${price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Update your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Skeleton className="h-10 w-full" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    disabled
                    value={accountForm.name}
                    onChange={handleAccountChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    disabled
                    value={accountForm.email}
                    onChange={handleAccountChange}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="hidden">
            <Button
              onClick={handleSaveAccount}
              disabled={isLoading || savingAccount}
            >
              {savingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Manage your subscription plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Skeleton className="h-16 w-full" />
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {userActivity.plan.planId?.title || "No Plan"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userActivity.plan.planId?.price
                          ? formatPrice(userActivity.plan.planId.price) +
                            "/month"
                          : "Free"}
                      </p>
                    </div>
                    <Badge
                      variant={isSubscriptionActive ? "default" : "outline"}
                    >
                      {isSubscriptionActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-4 text-sm">
                    {isSubscriptionActive && (
                      <p>
                        Renews on{" "}
                        {calculateRenewalDate(
                          userActivity?.plan?.expiresDate || ""
                        )}
                      </p>
                    )}
                    {userActivity.plan.planId?.tokens && (
                      <p className="mt-2">
                        Includes{" "}
                        {userActivity.plan.planId.tokens.toLocaleString()}{" "}
                        tokens per month
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{"BKash"}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-16 w-full mt-4" />
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showCurrentPassword
                          ? "Hide password"
                          : "Show password"}
                      </span>
                    </Button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-500">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showNewPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-500">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showConfirmPassword
                          ? "Hide password"
                          : "Show password"}
                      </span>
                    </Button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline" onClick={handleEnable2FA}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Enable
                </Button>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleUpdatePassword}
            disabled={isLoading || updatingPassword}
          >
            {updatingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
