"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/auth/form-error";
import { FormSuccess } from "@/components/auth/form-success";
import { resendVerificationEmail, verifyEmail } from "@/services/auth-services";
import { useAuth } from "@/components/providers/auth-provider";

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token, email: emailParam } = use(searchParams);
  const router = useRouter();
  const { setUser, refreshUser } = useAuth();
  const hasVerifiedRef = useRef(false);

  const [status, setStatus] = useState<"loading" | "success" | "error" | "form">(
    token ? "loading" : "form"
  );
  const [message, setMessage] = useState<string>("");

  const [email, setEmail] = useState(emailParam || "");
  const [otp, setOtp] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (!token || hasVerifiedRef.current) {
      return;
    }
    hasVerifiedRef.current = true;

    const runVerification = async () => {
      try {
        const result = await verifyEmail({ token });
        if (result.success) {
          if (result.data?.user) {
            setUser(result.data.user);
          } else {
            await refreshUser();
          }
          setStatus("success");
          setMessage(result.message || "Your email has been verified!");
          router.refresh();
        } else {
          setStatus("error");
          setMessage(result.message || "Verification link is invalid or expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    };

    runVerification();
  }, [token, refreshUser, router, setUser]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (otp.length !== 6) {
      setFormError("Please enter your 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyEmail({ email: email.trim(), otp: otp.trim() });
      if (result.success) {
        if (result.data?.user) {
          setUser(result.data.user);
        } else {
          await refreshUser();
        }
        setStatus("success");
        setMessage(result.message || "Your email has been verified!");
        router.replace("/dashboard");
        router.refresh();
      } else {
        setFormError(result.message || "Invalid or expired verification code.");
      }
    } catch {
      setFormError("Failed to verify email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address first.");
      return;
    }

    setFormError("");
    setFormSuccess("");
    setIsResending(true);
    try {
      const result = await resendVerificationEmail(email.trim());
      if (result.success) {
        setFormSuccess("A new 6-digit verification code has been sent.");
        setResendTimer(60);
      } else {
        setFormError(result.message || "Unable to resend verification code.");
      }
    } catch {
      setFormError("Unable to resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border border-border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted/40">
            <Shield className="h-5 w-5 text-foreground" />
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            Email Verification
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center text-center space-y-5 pt-4">
          {status === "loading" && (
            <>
              <Loader2 className="animate-spin h-10 w-10 text-primary" />
              <p className="text-sm text-muted-foreground">
                Verifying your email, please wait...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <p className="text-base font-medium text-emerald-600 dark:text-emerald-400">
                {message || "Your email has been verified!"}
              </p>
              <Button asChild className="w-full rounded-full">
                <Link href="/dashboard">Continue to Dashboard</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm font-medium text-destructive">{message}</p>
              <div className="flex flex-col gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => setStatus("form")}
                >
                  Enter 6-digit code manually
                </Button>
                <Button asChild className="w-full rounded-full">
                  <Link href="/login">Back to Login</Link>
                </Button>
              </div>
            </>
          )}

          {status === "form" && (
            <form onSubmit={handleOtpSubmit} className="w-full space-y-4 text-left">
              <div className="space-y-1.5">
                <label htmlFor="verify-email" className="text-xs font-medium text-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Input
                    id="verify-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFormError("");
                    }}
                    disabled={isSubmitting}
                    className="pl-10 h-11 rounded-lg"
                  />
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="verify-otp" className="text-xs font-medium text-foreground">
                  6-digit verification code
                </label>
                <Input
                  id="verify-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setFormError("");
                  }}
                  maxLength={6}
                  disabled={isSubmitting}
                  className="h-12 text-center font-mono text-2xl tracking-[0.4em] rounded-lg"
                />
              </div>

              <FormError message={formError} />
              <FormSuccess message={formSuccess} />

              <Button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="w-full h-11 rounded-full font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="pt-1 text-center text-xs text-muted-foreground">
                Didn&apos;t get a code?{" "}
                {resendTimer > 0 ? (
                  <span className="font-mono text-foreground">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                  >
                    {isResending ? "Sending..." : "Resend code"}
                  </button>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
