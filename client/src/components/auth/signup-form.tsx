"use client";

import type React from "react";

import { useState, useTransition, Suspense, useRef, useEffect } from "react";
import type * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";
import Social from "@/components/auth/social";
import { signUpSchema } from "@/schemas";
import {
  registerUser,
  resendVerificationEmail,
  verifyEmail,
} from "@/services/auth-services";
import { useRouter, useSearchParams } from "next/navigation";

const SignUpForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isShow, setIsShow] = useState<boolean>(false);
  const [isShowConfirm, setIsShowConfirm] = useState<boolean>(false);
  const [isPending, setTransition] = useTransition();
  const [showEmailVerification, setShowEmailVerification] =
    useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [otpToken, setOtpToken] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isResendingOtp, setIsResendingOtp] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const redirect = searchParams?.get("redirectPath");

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      terms: false,
    },
  });

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

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    setError("");
    setSuccess("");

    setTransition(async () => {
      try {
        const result = await registerUser(values);

        if (result?.success) {
          setUserEmail(values.email);
          setShowEmailVerification(true);
          setOtpToken(result.data?.otpToken);
          setResendTimer(60); // Start 60 second timer for resend
        } else {
          setError(result?.message);
        }
      } catch (err: unknown) {
        console.error(err);
        setError("An error occurred during registration");
      }
    });
  };

  const handleOtpChange = (value: string) => {
    // Only allow digits and limit to 6 characters
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
        // Registration complete and user is logged in
        setSuccess("Email verified successfully! Welcome!");

        // Redirect after a short delay to show success message
        setTimeout(() => {
          if (redirect) {
            router.push(redirect);
          } else {
            router.push("/"); // or wherever you want to redirect after login
          }
        }, 1500);
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
        setResendTimer(60); // Reset timer
        setOtp(""); // Clear current OTP
        setOtpToken(result.data?.otpToken); // Update OTP token
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && otp.length === 6) {
      verifyOtp();
    }
  };

  // Email Verification Step with OTP
  if (showEmailVerification) {
    return (
      <Card className="max-w-md w-full mx-auto mb-5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            <p className="text-neutral-600 dark:text-neutral-300">
              We&apos;ve sent a 6-digit verification code to
            </p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 mt-1">
              {userEmail}
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Enter verification code
              </label>
              <Input
                ref={otpInputRef}
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                disabled={isVerifyingOtp}
              />
              {otpError && (
                <p className="text-sm text-red-600 mt-1">{otpError}</p>
              )}
            </div>

            <FormSuccess message={success} />

            <Button
              onClick={verifyOtp}
              disabled={otp.length !== 6 || isVerifyingOtp}
              className="w-full"
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Didn&apos;t receive the code?{" "}
                {resendTimer > 0 ? (
                  <span className="text-neutral-500">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-500"
                    onClick={resendOtp}
                    disabled={isResendingOtp}
                  >
                    {isResendingOtp ? "Sending..." : "Resend code"}
                  </Button>
                )}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleBackToForm}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign Up
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Original Sign Up Form
  return (
    <Card className="max-w-md w-full mx-auto mb-5">
      <CardHeader>
        <CardTitle className="text-3xl">Create your account</CardTitle>
        <CardDescription>
          <p className="text-neutral-600 max-w-sm mt-2 dark:text-neutral-300">
            Already have an account?{" "}
            <Link
              href={redirect ? `/login?redirectPath=${redirect}` : "/login"}
              className="underline text-blue-500"
            >
              Login
            </Link>
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          disabled={isPending}
                          type="text"
                          placeholder="John Doe"
                          className="pl-10"
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          disabled={isPending}
                          type="email"
                          placeholder="john.doe@example.com"
                          className="pl-10"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          disabled={isPending}
                          type={isShow ? "text" : "password"}
                          placeholder="******"
                          className="pl-10 pr-10"
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2"
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="confirmPassword"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          disabled={isPending}
                          type={isShowConfirm ? "text" : "password"}
                          placeholder="******"
                          className="pl-10 pr-10"
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2"
                          onClick={() => setIsShowConfirm((prev) => !prev)}
                        >
                          {isShowConfirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {isShowConfirm ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="terms"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={isPending}
                          id="terms"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I accept the{" "}
                          <Link
                            href="/terms"
                            className="text-primary underline"
                          >
                            Terms and Conditions
                          </Link>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormError message={error} />
              <FormSuccess message={success} />
              <Button
                disabled={isPending}
                type="submit"
                className="w-full mt-4"
              >
                {!isPending ? (
                  "Create free account"
                ) : (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                )}
              </Button>
            </form>
          </Form>
          <div className="relative flex justify-center items-center">
            <span className="text-neutral-800 dark:text-neutral-300 text-lg bg-card z-10 px-2">
              or
            </span>
            <span className="w-full h-px absolute left-0 top-1/2 translate-y-1/2 bg-slate-200" />
          </div>

          <Social />
        </div>
      </CardContent>
    </Card>
  );
};

const SignUpFormWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <SignUpForm />
  </Suspense>
);

export default SignUpFormWrapper;
