"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  EyeOff,
  Eye,
  Loader2,
  Shield,
  KeyRound,
  CheckCircle2,
  Check,
} from "lucide-react";
import { FormError } from "@/components/auth/form-error";
import { FormSuccess } from "@/components/auth/form-success";
import {
  requestPasswordReset,
  verifyOTP,
  resetPassword,
} from "@/services/auth-services";

const calculatePasswordStrength = (password: string) => {
  let score = 0;
  const checks = {
    length: password.length >= 6,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  if (checks.length) score += 20;
  if (checks.lowercase) score += 20;
  if (checks.uppercase) score += 20;
  if (checks.numbers) score += 20;
  if (checks.symbols) score += 20;

  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;

  let strength: "weak" | "medium" | "strong";
  if (score < 40) strength = "weak";
  else if (score < 80) strength = "medium";
  else strength = "strong";

  return { score, strength, checks };
};

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const stepParam = searchParams?.get("step");
  const emailParam = searchParams?.get("email") || "";
  const otpTokenParam = searchParams?.get("otpToken") || "";
  const tempTokenParam = searchParams?.get("tempToken") || "";

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState(otpTokenParam);
  const [tempToken, setTempToken] = useState(tempTokenParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [step, setStep] = useState(stepParam ? Number.parseInt(stepParam, 10) : 1);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    strength: "weak" | "medium" | "strong";
    checks: Record<string, boolean>;
  } | null>(null);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer for 60s resend code
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus OTP input when step 2 is active
  useEffect(() => {
    if (step === 2 && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("step", step.toString());
    if (email) params.set("email", email);
    if (otpToken) params.set("otpToken", otpToken);
    if (tempToken) params.set("tempToken", tempToken);

    router.replace(`/reset-password?${params.toString()}`, { scroll: false });
  }, [step, email, otpToken, tempToken, router]);

  // Request OTP (Step 1)
  const handleRequestOTP = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        setOtpToken(result.data?.otpToken || "");
        setSuccess("Verification code sent to your email");
        setResendTimer(60);
        setStep(2);
      } else {
        setError(result.message || "Failed to send code. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP (Step 2)
  const handleResendOTP = async () => {
    if (resendTimer > 0 || !email) return;

    setError("");
    setSuccess("");
    setIsResending(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        setOtpToken(result.data?.otpToken || "");
        setSuccess("A new verification code has been sent!");
        setResendTimer(60);
        setOtp("");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(result.message || "Failed to resend code. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  // Verify OTP (Step 2)
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await verifyOTP(otp, otpToken);

      if (result.success) {
        setTempToken(result.data?.tempToken || "");
        setSuccess("Code verified successfully");
        setStep(3);
      } else {
        setError(result.message || "Invalid verification code. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password (Step 3)
  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setError("Please fill in both password fields");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await resetPassword(
        newPassword,
        confirmNewPassword,
        tempToken
      );

      if (result.success) {
        setSuccess("Password reset successful");
        setStep(4);
      } else {
        setError(
          result.message || "Failed to reset password. Please try again."
        );
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setOtp("");
    setOtpToken("");
    setError("");
    setSuccess("");
    setResendTimer(0);
    setStep(1);
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    setError("");
    if (value) {
      setPasswordStrength(calculatePasswordStrength(value));
    } else {
      setPasswordStrength(null);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
      {/* Step 1: Email Form */}
      {step === 1 && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/40">
            <KeyRound className="h-5 w-5 text-foreground" />
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter the email address associated with your account and we&apos;ll send you a verification code.
          </p>

          <div className="mt-6 space-y-4 text-left">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground">
                Email address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleRequestOTP();
                    }
                  }}
                  className="pl-10 h-11 rounded-lg border-border bg-background focus-visible:ring-1 focus-visible:ring-foreground/20 text-sm"
                />
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <FormError message={error} />
            <FormSuccess message={success} />

            <Button
              disabled={isLoading || !email}
              onClick={handleRequestOTP}
              className="group w-full h-11 rounded-full font-medium mt-2 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Send verification code</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              Log in
            </Link>
          </p>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/80">
            Need help?{" "}
            <Link
              href="/contact"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Contact support
            </Link>
          </p>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {step === 2 && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/40">
            <Shield className="h-5 w-5 text-foreground" />
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Verify your email
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We sent a 6-digit verification code to
          </p>
          <p className="mt-1 font-mono text-xs font-medium text-foreground bg-muted/50 rounded-md py-1 px-2.5 inline-block">
            {email}
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Input
                ref={otpInputRef}
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                value={otp}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(clean);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                    e.preventDefault();
                    handleVerifyOTP();
                  }
                }}
                className="h-12 text-center font-mono text-2xl tracking-[0.4em] rounded-lg border-border bg-background focus-visible:ring-1 focus-visible:ring-foreground/20"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            <FormError message={error} />
            <FormSuccess message={success} />

            <Button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6 || isLoading}
              className="w-full h-11 rounded-full font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify and continue</span>
              )}
            </Button>

            <div className="pt-2 flex flex-col items-center gap-3">
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive the code?{" "}
                {resendTimer > 0 ? (
                  <span className="font-mono text-foreground font-medium">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    className="font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
                    onClick={handleResendOTP}
                    disabled={isResending}
                  >
                    {isResending ? "Sending..." : "Resend code"}
                  </button>
                )}
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToEmail}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change email
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: New Password */}
      {step === 3 && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/40">
            <Lock className="h-5 w-5 text-foreground" />
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Set new password
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Choose a strong password with at least 6 characters.
          </p>

          <div className="mt-6 space-y-4 text-left">
            {/* New Password */}
            <div className="space-y-1.5">
              <label htmlFor="newPassword" className="text-xs font-medium text-foreground">
                New password
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="pl-10 pr-10 h-11 rounded-lg border-border bg-background focus-visible:ring-1 focus-visible:ring-foreground/20 text-sm"
                />
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setShowNewPassword((prev) => !prev)}
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

              {/* Password strength meter */}
              {passwordStrength && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 grid grid-cols-4 gap-1">
                      <div
                        className={`h-1 rounded-full transition-colors ${
                          passwordStrength.score >= 20
                            ? passwordStrength.strength === "weak"
                              ? "bg-destructive"
                              : passwordStrength.strength === "medium"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                            : "bg-muted"
                        }`}
                      />
                      <div
                        className={`h-1 rounded-full transition-colors ${
                          passwordStrength.score >= 50
                            ? passwordStrength.strength === "medium"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                            : "bg-muted"
                        }`}
                      />
                      <div
                        className={`h-1 rounded-full transition-colors ${
                          passwordStrength.score >= 70
                            ? "bg-emerald-500"
                            : "bg-muted"
                        }`}
                      />
                      <div
                        className={`h-1 rounded-full transition-colors ${
                          passwordStrength.score >= 90
                            ? "bg-emerald-500"
                            : "bg-muted"
                        }`}
                      />
                    </div>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      {passwordStrength.strength}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        passwordStrength.checks.length
                          ? "text-foreground"
                          : "opacity-60"
                      }`}
                    >
                      <Check className="h-3 w-3" /> 6+ chars
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        passwordStrength.checks.uppercase
                          ? "text-foreground"
                          : "opacity-60"
                      }`}
                    >
                      <Check className="h-3 w-3" /> Uppercase
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        passwordStrength.checks.numbers
                          ? "text-foreground"
                          : "opacity-60"
                      }`}
                    >
                      <Check className="h-3 w-3" /> Number
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        passwordStrength.checks.symbols
                          ? "text-foreground"
                          : "opacity-60"
                      }`}
                    >
                      <Check className="h-3 w-3" /> Symbol
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmNewPassword"
                className="text-xs font-medium text-foreground"
              >
                Confirm new password
              </label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    setError("");
                  }}
                  disabled={isLoading}
                  autoComplete="new-password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading) {
                      e.preventDefault();
                      handleResetPassword();
                    }
                  }}
                  className="pl-10 pr-10 h-11 rounded-lg border-border bg-background focus-visible:ring-1 focus-visible:ring-foreground/20 text-sm"
                />
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showConfirmPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>

            <FormError message={error} />
            <FormSuccess message={success} />

            <Button
              onClick={handleResetPassword}
              disabled={isLoading || !newPassword || !confirmNewPassword}
              className="group w-full h-11 rounded-full font-medium mt-2 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Resetting password...</span>
                </>
              ) : (
                <>
                  <span>Reset password</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>

            <div className="pt-2 flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(2)}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to verification
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Success Screen */}
      {step === 4 && (
        <div className="text-center py-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Password reset successful!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Your password has been reset successfully. You can now log in with your new password.
          </p>

          <Button
            asChild
            className="group w-full h-11 rounded-full font-medium mt-6 gap-2"
          >
            <Link href="/login">
              <span>Continue to log in</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function ResetPasswordSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6 sm:p-8 animate-pulse space-y-6">
      <div className="mx-auto h-12 w-12 rounded-full bg-muted" />
      <div className="space-y-2 text-center">
        <div className="mx-auto h-6 w-44 rounded bg-muted" />
        <div className="mx-auto h-4 w-60 rounded bg-muted" />
      </div>
      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <div className="h-3.5 w-20 rounded bg-muted" />
          <div className="h-11 w-full rounded-lg bg-muted" />
        </div>
        <div className="h-11 w-full rounded-full bg-muted pt-2" />
      </div>
    </div>
  );
}

export default function EmailVerification() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
