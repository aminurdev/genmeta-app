"use client";

import type React from "react";
import { useState, useTransition, Suspense, useRef, useEffect } from "react";
import type * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Check,
  X,
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

  // Calculate score
  if (checks.length) score += 20;
  if (checks.lowercase) score += 20;
  if (checks.uppercase) score += 20;
  if (checks.numbers) score += 20;
  if (checks.symbols) score += 20;

  // Bonus for longer passwords
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

  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly (12 characters total)
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
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

  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    strength: "weak" | "medium" | "strong";
    checks: Record<string, boolean>;
  } | null>(null);

  const redirect = searchParams?.get("redirectPath");

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  let referral = searchParams?.get("ref");

  useEffect(() => {
    if (referral) {
      localStorage.setItem("referralCode", referral);
    }
  }, [referral]);

  const handlePasswordChange = (value: string) => {
    form.setValue("password", value);
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
      <div className="flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20 p-4 w-full">
        <div className="w-full max-w-lg">
          <Card className="shadow-md border bg-white/80 dark:bg-background/80 backdrop-blur-sm p-6">
            <CardHeader className="space-y-4 pb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/50">
                <Shield className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-base space-y-2">
                <p className="text-muted-foreground">
                  We&apos;ve sent a 6-digit verification code to
                </p>
                <p className="font-semibold text-foreground text-lg">
                  {userEmail}
                </p>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-foreground"
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
                    className="text-center text-2xl font-mono tracking-[0.5em] h-14 border-muted-foreground/20 focus:border-violet-500 focus:ring-violet-500/20"
                    maxLength={6}
                    disabled={isVerifyingOtp}
                  />
                  {otpError && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {otpError}
                    </p>
                  )}
                </div>

                <FormSuccess message={success} />

                <Button
                  onClick={verifyOtp}
                  disabled={otp.length !== 6 || isVerifyingOtp}
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-violet-500/20 transition-all duration-200 group"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Verify Email
                    </>
                  )}
                </Button>

                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive the code?{" "}
                    {resendTimer > 0 ? (
                      <span className="text-violet-600 dark:text-violet-400 font-medium">
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium"
                        onClick={resendOtp}
                        disabled={isResendingOtp}
                      >
                        {isResendingOtp ? "Sending..." : "Resend code"}
                      </Button>
                    )}
                  </p>

                  <Button
                    variant="outline"
                    onClick={handleBackToForm}
                    className="w-full border-muted-foreground/20 hover:bg-muted/50 transition-all duration-200 bg-transparent"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign Up
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Original Sign Up Form
  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20 p-4 w-full">
      <div className="w-full max-w-lg">
        <Card className="shadow-md border bg-white/80 dark:bg-background/80 backdrop-blur-sm p-6">
          <CardHeader className="space-y-4 pb-8">
            <div className="text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-2">
                Join GenMeta and start enhancing your images
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Social Login Section - Moved to Top */}
            <div className="space-y-4">
              <Social />

              <div className="relative flex justify-center items-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted-foreground/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-4 text-muted-foreground font-medium">
                    Or create with email
                  </span>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            disabled={isPending}
                            type="text"
                            placeholder="Enter your full name"
                            className="pl-11 h-12 border-muted-foreground/20 focus:border-violet-500 focus:ring-violet-500/20 transition-all duration-200 focus-visible:ring-0"
                          />
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            disabled={isPending}
                            type="email"
                            placeholder="Enter your email"
                            className="pl-11 h-12 border-muted-foreground/20 focus:border-violet-500 focus:ring-violet-500/20 transition-all duration-200 focus-visible:ring-0"
                          />
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="relative">
                            <Input
                              {...field}
                              disabled={isPending}
                              type={isShow ? "text" : "password"}
                              placeholder="Create a password"
                              onChange={(e) => {
                                field.onChange(e);
                                handlePasswordChange(e.target.value);
                              }}
                              className="pl-11 pr-20 h-12 border-muted-foreground/20 focus:border-violet-500 focus:ring-violet-500/20 transition-all duration-200 focus-visible:ring-0"
                            />
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-transparent"
                                onClick={() => setIsShow((prev) => !prev)}
                              >
                                {isShow ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                                )}
                                <span className="sr-only">
                                  {isShow ? "Hide password" : "Show password"}
                                </span>
                              </Button>{" "}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newPassword = generateSecurePassword();
                                  handlePasswordChange(newPassword);
                                  setIsShow(true); // Show password so user can see it
                                }}
                                className="h-12 px-3 text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/20"
                              >
                                <Zap className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Password Strength Indicator */}
                          {passwordStrength && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      passwordStrength.strength === "weak"
                                        ? "bg-red-500 w-1/3"
                                        : passwordStrength.strength === "medium"
                                        ? "bg-yellow-500 w-2/3"
                                        : "bg-green-500 w-full"
                                    }`}
                                  />
                                </div>
                                <span
                                  className={`text-xs font-medium ${
                                    passwordStrength.strength === "weak"
                                      ? "text-red-600 dark:text-red-400"
                                      : passwordStrength.strength === "medium"
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-green-600 dark:text-green-400"
                                  }`}
                                >
                                  {passwordStrength.strength === "weak"
                                    ? "Weak"
                                    : passwordStrength.strength === "medium"
                                    ? "Medium"
                                    : "Strong"}
                                </span>
                              </div>

                              {/* Password Requirements */}
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                <div
                                  className={`flex items-center gap-1 ${
                                    passwordStrength.checks.length
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {passwordStrength.checks.length ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                  6+ characters
                                </div>
                                <div
                                  className={`flex items-center gap-1 ${
                                    passwordStrength.checks.uppercase
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {passwordStrength.checks.uppercase ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                  Uppercase
                                </div>
                                <div
                                  className={`flex items-center gap-1 ${
                                    passwordStrength.checks.lowercase
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {passwordStrength.checks.lowercase ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                  Lowercase
                                </div>
                                <div
                                  className={`flex items-center gap-1 ${
                                    passwordStrength.checks.numbers
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {passwordStrength.checks.numbers ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                  Numbers
                                </div>
                                <div
                                  className={`flex items-center gap-1 ${
                                    passwordStrength.checks.symbols
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {passwordStrength.checks.symbols ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                  Symbols
                                </div>
                              </div>
                            </div>
                          )}
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
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-violet-500/20 transition-all duration-200 group"
                >
                  {!isPending ? (
                    <>
                      Create Free Account
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href={redirect ? `/login?redirectPath=${redirect}` : "/login"}
                  className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                By signing in, you agree to our{" "}
                <Link
                  href="/terms"
                  className="underline hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
                {" and "}
                <Link
                  href="/privacy"
                  className="underline hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

const SignUpFormWrapper = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20 w-full">
        <Card className="w-full max-w-lg shadow-md border-0 bg-white/80 dark:bg-background/80 backdrop-blur-sm p-6">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </CardContent>
        </Card>
      </div>
    }
  >
    <SignUpForm />
  </Suspense>
);

export default SignUpFormWrapper;
