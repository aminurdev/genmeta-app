"use client";

import type React from "react";
import { useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/services/auth-services";

interface PasswordChangeFormProps {
  hasPassword?: boolean;
  passwordChangedAt?: string | null;
  onPasswordUpdated?: () => void;
}

export function PasswordChangeForm({
  hasPassword = true,
  passwordChangedAt = null,
  onPasswordUpdated,
}: PasswordChangeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasPassword && !formData.currentPassword.trim()) {
      toast.error("Please enter your current password.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (formData.newPassword.length > 72) {
      toast.error("Password must be at most 72 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword(
        hasPassword ? formData.currentPassword : undefined,
        formData.newPassword,
        formData.confirmPassword
      );

      if (result.success) {
        toast.success(
          result.message ||
            "Your password has been updated and other sessions were signed out."
        );
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        onPasswordUpdated?.();
      } else {
        toast.error(
          result.message || "Failed to update password. Please try again."
        );
      }
    } catch {
      toast.error("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formattedLastChanged = (() => {
    if (!passwordChangedAt) return null;
    const date = new Date(passwordChangedAt);
    if (Number.isNaN(date.getTime())) return null;
    return format(date, "MMM d, yyyy 'at' h:mm a");
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          {hasPassword ? "Change Password" : "Set Account Password"}
        </CardTitle>
        <CardDescription>
          {hasPassword
            ? "Update your password to keep your account secure. Changing your password signs out other web sessions."
            : "Add a password to enable email and password sign-in alongside Google."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {formattedLastChanged && (
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Last changed on{" "}
            <span className="font-medium text-foreground">
              {formattedLastChanged}
            </span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          {hasPassword && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) =>
                    handleInputChange("currentPassword", e.target.value)
                  }
                  placeholder="Enter your current password"
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={
                    showCurrentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() =>
                    setShowCurrentPassword((prev) => !prev)
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  handleInputChange("newPassword", e.target.value)
                }
                placeholder="At least 8 characters"
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={
                  showNewPassword ? "Hide new password" : "Show new password"
                }
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                placeholder="Confirm your new password"
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                {hasPassword ? "Update Password" : "Set Password"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
