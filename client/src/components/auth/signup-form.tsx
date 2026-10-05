"use client";

import type React from "react";
import { useState, useTransition, Suspense, useRef, useEffect } from "react";
import type * as z from "zod";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormError } from "@/components/auth/form-error";
import { FormSuccess } from "@/components/auth/form-success";
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Lock,
  ArrowLeft,
  Shield,
  ArrowRight,
  Check,
  Zap,
} from "lucide-react";
import Social from "@/components/auth/social";
import { signUpSchema } from "@/schemas";
import {
  registerUser,
  resendVerificationEmail,
  verifyEmail,
} from "@/services/auth-services";
import { useRouter, useSearchParams } from "next/navigation";

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

const generateSecurePassword = () => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 4; i < 14; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

const SignUpForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isShow, setIsShow] = useState<boolean>(false);
  const [isPending, setTransition] = useTransition();
  const [showEmailVerification, setShowEmailVerification] = useState<boolean>(
    searchParams?.get("step") === "verify"
  );
  const [userEmail, setUserEmail] = useState<string>(
    searchParams?.get("email") || ""
  );
  const [otpToken, setOtpToken] = useState<string>(
    searchParams?.get("token") || ""
  );
  const [otp, setOtp] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isResendingOtp, setIsResendingOtp] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    strength: "weak" | "medium" | "strong";
    checks: Record<string, boolean>;
  } | null>(null);

  let referral = searchParams?.get("ref");

  useEffect(() => {
    if (referral) {
      localStorage.setItem("referralCode", referral);
    }
  }, [referral]);

  const handlePasswordChange = (value: string) => {
    form.setValue("password", value, { shouldValidate: true });
    if (value) {
      setPasswordStrength(calculatePasswordStrength(value));
    } else {
      setPasswordStrength(null);
    }
  };

  // Timer for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus OTP input when verification step shows
  useEffect(() => {
    if (showEmailVerification && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [showEmailVerification]);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const updateUrlForVerification = (email: string, token: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("step", "verify");
    params.set("email", email);
    params.set("token", token);
    if (referral) {
      params.set("ref", referral);
    }
    if (searchParams?.get("redirectPath")) {
      params.set("redirectPath", searchParams?.get("redirectPath") || "");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const clearVerificationFromUrl = () => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("step");
    params.delete("email");
    params.delete("token");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    setError("");
    setSuccess("");
    setTransition(async () => {
      try {
        referral = localStorage.getItem("referralCode");

        const result = await registerUser(values, referral);
        if (result?.success) {
          setUserEmail(values.email);
          setShowEmailVerification(true);
          setOtpToken(result.data?.otpToken || "");
          setResendTimer(60);
          updateUrlForVerification(values.email, result.data?.otpToken || "");
        } else {
          setError(result?.message);
        }
      } catch (err: unknown) {
        console.error(err);
        setError("An error occurred during registration. Please try again.");
      }
    });
  };

  const handleOtpChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(cleanValue);
    setOtpError("");
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError("Please enter a 6-digit code");
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError("");
    try {
      const result = await verifyEmail(otpToken, otp);
      if (result.success) {
        setSuccess("Email verified successfully! Welcome!");
        clearVerificationFromUrl();
        setTimeout(() => {
          if (searchParams?.get("redirectPath")) {
            router.push(searchParams?.get("redirectPath") || "/");
          } else {
            router.push("/");
          }
        }, 1200);
      } else {
        setOtpError(result.message || "Invalid verification code");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setOtpError("Failed to verify code. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    setIsResendingOtp(true);
    setOtpError("");
    try {
      const result = await resendVerificationEmail(userEmail);
      if (result.success) {
        setSuccess("Verification code sent!");
        setResendTimer(60);
        setOtp("");
        setOtpToken(result.data?.otpToken || "");
        updateUrlForVerification(userEmail, result.data?.otpToken || "");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setOtpError(result.message || "Failed to resend code");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setOtpError("Failed to resend code. Please try again.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleBackToForm = () => {
    setShowEmailVerification(false);
    setUserEmail("");
    setOtp("");
    setOtpError("");
    setResendTimer(0);
    clearVerificationFromUrl();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && otp.length === 6) {
      verifyOtp();
    }
  };

  const loginHref = searchParams?.get("redirectPath")
    ? `/login?redirectPath=${encodeURIComponent(
        searchParams?.get("redirectPath") || ""
      )}`
    : "/login";

  // Step 2: Email Verification
  if (showEmailVerification) {
    return (
      <div className="w-full rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm text-center">
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
          {userEmail}
        </p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Input
              ref={otpInputRef}
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="••••••"
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              onKeyDown={handleKeyPress}
              className="h-12 text-center font-mono text-2xl tracking-[0.4em] rounded-lg border-border bg-background focus-visible:ring-1 focus-visible:ring-foreground/20"
              maxLength={6}
              disabled={isVerifyingOtp}
            />
            {otpError && (
              <p className="text-xs text-destructive text-center">{otpError}</p>
            )}
          </div>

          <FormSuccess message={success} />

          <Button
            onClick={verifyOtp}
            disabled={otp.length !== 6 || isVerifyingOtp}
            className="w-full h-11 rounded-full font-medium"
          >
            {isVerifyingOtp ? (
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
                <span className="font-mono text-foreground">
                  Resend in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  className="font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
                  onClick={resendOtp}
                  disabled={isResendingOtp}
                >
                  {isResendingOtp ? "Sending..." : "Resend code"}
                </button>
              )}
            </p>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBackToForm}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to registration
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Sign Up Form
  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
          Create an account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Start generating metadata for your microstock files
        </p>
      </div>

      {/* Social login */}
      <Social />

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative bg-card px-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          or register with email
        </span>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-medium text-foreground">
                  Full name
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      disabled={isPending}
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      className="pl-10 h-11 rounded-lg border-border bg-background focus-visible:ring-1 focus-visible:ring-foreground/20 text-sm"
                    />
                    <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            name="email"
            control={form.control}
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-medium text-foreground">
                  Email address
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      disabled={isPending}
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      className="pl-10 h-11 rounded-lg border-border bg-background focus-visible:ring-1 focus-visible:ring-foreground/20 text-sm"
                    />
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-medium text-foreground">
                    Password
                  </FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newPassword = generateSecurePassword();
                      handlePasswordChange(newPassword);
                      setIsShow(true);
                    }}
                    className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                    title="Generate secure password"
                  >
                    <Zap className="h-3 w-3" />
                    <span>Generate</span>
                  </Button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      disabled={isPending}
                      type={isShow ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      onChange={(e) => {
                        field.onChange(e);
                        handlePasswordChange(e.target.value);
                      }}
                      className="pl-10 pr-10 h-11 rounded-lg border-border bg-background focus-visible:ring-1 focus-visible:ring-foreground/20 text-sm"
                    />
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                      onClick={() => setIsShow((prev) => !prev)}
                    >
                      {isShow ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {isShow ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />

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
              </FormItem>
            )}
          />

          <FormError message={error} />
          <FormSuccess message={success} />

          <Button
            disabled={isPending}
            type="submit"
            className="group w-full h-11 rounded-full font-medium mt-2 gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* Switch link */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Log in
        </Link>
      </p>

      {/* Legal disclaimer */}
      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/80">
        By creating an account, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy-policy"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
};

function SignUpFormSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6 sm:p-8 animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-44 rounded bg-muted" />
        <div className="h-4 w-60 rounded bg-muted" />
      </div>
      <div className="h-11 w-full rounded-full bg-muted" />
      <div className="h-px w-full bg-border" />
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="h-3.5 w-20 rounded bg-muted" />
          <div className="h-11 w-full rounded-lg bg-muted" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 rounded bg-muted" />
          <div className="h-11 w-full rounded-lg bg-muted" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-16 rounded bg-muted" />
          <div className="h-11 w-full rounded-lg bg-muted" />
        </div>
        <div className="h-11 w-full rounded-full bg-muted pt-2" />
      </div>
    </div>
  );
}

export default function SignUpFormWrapper() {
  return (
    <Suspense fallback={<SignUpFormSkeleton />}>
      <SignUpForm />
    </Suspense>
  );
}
