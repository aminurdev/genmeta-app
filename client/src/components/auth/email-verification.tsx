"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Mail, Lock, EyeOff, Eye } from "lucide-react";
import { FormError } from "@/components/auth/form-error";
import { FormSuccess } from "@/components/auth/form-success";
import {
  requestPasswordReset,
  verifyOTP,
  resetPassword,
} from "@/services/auth-services";

export default function EmailVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get step and tokens from URL params
  const stepParam = searchParams?.get("step");
  const otpTokenParam = searchParams?.get("otpToken") || "";
  const tempTokenParam = searchParams?.get("tempToken");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState(otpTokenParam || "");
  const [tempToken, setTempToken] = useState(tempTokenParam || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [step, setStep] = useState(stepParam ? Number.parseInt(stepParam) : 1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Update URL when step or tokens change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("step", step.toString());

    if (otpToken) params.set("otpToken", otpToken);
    if (tempToken) params.set("tempToken", tempToken);

    router.replace(`/reset-password?${params.toString()}`);
  }, [step, otpToken, tempToken, router]);

  const handleRequestAgain = () => {
    setNewPassword("");
    setConfirmNewPassword("");
    setOtp("");
    setOtpToken("");
    setStep(1);
  };

  // Request OTP
  const handleRequestOTP = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        setOtpToken(result.data?.otpToken || "");
        setSuccess("OTP sent to your email address");
        setStep(2);
      } else {
        setError(result.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp) {
      setError("Please enter the OTP sent to your email");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await verifyOTP(otp, otpToken);

      if (result.success) {
        setTempToken(result.data?.tempToken || "");
        setSuccess("OTP verified successfully");
        setStep(3);
      } else {
        setError(result.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setError("Please enter and confirm your new password");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await resetPassword(
        newPassword,
        confirmNewPassword,
        tempToken
      );

      if (result.success) {
        setSuccess("Password reset successful");
        setStep(4); // Move to success screen
      } else {
        setError(
          result.message || "Failed to reset password. Please try again."
        );
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1 && step < 4) {
      setStep(step - 1);
    } else {
      router.push("/login");
    }
  };

  return (
    <div className=" w-full h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="mr-2"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl">Reset Password</CardTitle>
          </div>
          <CardDescription>
            {step === 1 && "Enter your email to receive a verification code"}
            {step === 2 && "Enter the verification code sent to your email"}
            {step === 3 && "Create a new password for your account"}
            {step === 4 && "Password reset successful!"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    type="email"
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium">
                  Verification Code
                </label>
                <Input
                  id="otp"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="text-center tracking-widest text-lg"
                  inputMode="numeric"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive a code?
                <Button
                  variant="link"
                  className="p-0 h-auto ml-1"
                  onClick={handleRequestAgain}
                >
                  Request again
                </Button>
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    placeholder="Enter new password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showNewPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="confirmNewPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmNewPassword"
                    placeholder="Confirm new password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-green-600 mb-2">
                  Password Reset Successful!
                </h3>
                <p className="text-muted-foreground">
                  Your password has been reset successfully. You can now log in
                  with your new password.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="block">
          <FormError message={error} />
          <FormSuccess message={success} />
          {step < 4 ? (
            <Button
              className="w-full mt-4"
              onClick={
                step === 1
                  ? handleRequestOTP
                  : step === 2
                  ? handleVerifyOTP
                  : handleResetPassword
              }
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  {step === 1 && "Send Verification Code"}
                  {step === 2 && "Verify Code"}
                  {step === 3 && "Reset Password"}
                </>
              )}
            </Button>
          ) : (
            <Button
              className="w-full mt-4"
              onClick={() => router.push("/login")}
            >
              Go to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
