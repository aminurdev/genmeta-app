"use client";

import { useState, useTransition, Suspense } from "react";
import type * as z from "zod";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { loginSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import Social from "./social";
import { loginUser } from "@/services/auth-services";
import { useRouter, useSearchParams } from "next/navigation";

const LoginForm = () => {
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirectPath");
  const errorMessage = searchParams?.get("error");
  const message = searchParams?.get("message") ?? "";

  const [error, setError] = useState<string | undefined>(
    errorMessage ?? undefined
  );
  const [success, setSuccess] = useState<string | undefined>(message ?? "");
  const [isShow, setIsShow] = useState<boolean>(false);
  const [isPending, setTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setError("");
    setSuccess("");
    setTransition(async () => {
      try {
        const res = await loginUser(values);
        if (res?.success) {
          setSuccess(res?.message);
          if (redirect) {
            router.push(redirect);
          } else {
            router.push("/");
          }
        } else {
          setError(res?.message);
        }
      } catch (err: unknown) {
        console.error(err);
        setError("Failed to sign in. Please try again.");
      }
    });
  };

  const signupHref = redirect
    ? `/signup?redirectPath=${encodeURIComponent(redirect)}`
    : "/signup";

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your GenMeta account to continue
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
          or continue with email
        </span>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <Link
                    href="/reset-password"
                    className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      disabled={isPending}
                      type={isShow ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
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
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* Switch link */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={signupHref}
          className="font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Sign up
        </Link>
      </p>

      {/* Legal disclaimer */}
      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/80">
        By continuing, you agree to our{" "}
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

function LoginFormSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6 sm:p-8 animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-36 rounded bg-muted" />
        <div className="h-4 w-56 rounded bg-muted" />
      </div>
      <div className="h-11 w-full rounded-full bg-muted" />
      <div className="h-px w-full bg-border" />
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="h-3.5 w-20 rounded bg-muted" />
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

export default function LoginFormWrapper() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
