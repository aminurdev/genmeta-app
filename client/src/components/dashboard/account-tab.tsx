"use client";

import type React from "react";

import { useState } from "react";
import { CreditCard, Loader2, Save, ShieldCheck } from "lucide-react";
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
import { ApiResponse } from "@/app/(main)/dashboard/page";

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
    name: userActivity?.name || "John Doe",
    email: userActivity?.email || "john@example.com",
    company: userActivity?.company || "Acme Inc.",
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success
      toast.success("Password updated successfully");

      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Cancel subscription
  // const handleCancelSubscription = async () => {
  //   setCancelingSubscription(true);

  //   try {
  //     // Simulate API call
  //     await new Promise((resolve) => setTimeout(resolve, 1000));

  //     // Success
  //     toast.success("Subscription canceled successfully");
  //   } catch (error) {
  //     console.error("Error canceling subscription:", error);
  //     toast.error("Failed to cancel subscription");
  //   } finally {
  //     setCancelingSubscription(false);
  //   }
  // };

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
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Skeleton className="h-10 w-full" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={accountForm.name}
                    onChange={handleAccountChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={accountForm.email}
                    onChange={handleAccountChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={accountForm.company}
                    onChange={handleAccountChange}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
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
                      {/* <p className="font-medium">
                        {userActivity?.paymentMethod?.type || "Visa"} ending in{" "}
                        {userActivity?.paymentMethod?.last4 || "4242"}
                      </p> */}
                      {/* <p className="text-xs text-muted-foreground">
                        Expires {userActivity?.paymentMethod?.expMonth || "12"}/
                        {userActivity?.paymentMethod?.expYear || "2026"}
                      </p> */}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          {/* <CardFooter className="flex flex-col items-start space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={isLoading || !isSubscriptionActive}
              >
                Change Plan
              </Button>
              <Button variant="outline" disabled={isLoading}>
                Update Payment
              </Button>
            </div>
            {isSubscriptionActive && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-red-500"
                    disabled={isLoading || cancelingSubscription}
                  >
                    {cancelingSubscription ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Cancel Subscription"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Canceling your subscription will immediately stop your
                      access to premium features. You will still have access
                      until the end of your current billing period on{" "}
                      {calculateRenewalDate(
                        userActivity?.plan?.expiresDate || ""
                      )}
                      .
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500 hover:bg-red-600"
                      onClick={handleCancelSubscription}
                    >
                      Yes, Cancel Subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardFooter> */}
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
              <div>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-500">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-500">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                  />
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
            disabled={
              isLoading ||
              updatingPassword ||
              !passwordForm.currentPassword ||
              !passwordForm.newPassword ||
              !passwordForm.confirmPassword
            }
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
