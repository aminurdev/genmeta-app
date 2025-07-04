"use client";

import { useState, useTransition, Suspense } from "react";
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
      }
    });
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20 p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-background/80 backdrop-blur-sm p-6">
          <CardHeader className="space-y-4 pb-8">
            <div className="text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-2">
                Sign in to your GenMeta account
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
                    Or continue with email
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
                            className="pl-11 h-12 border-muted-foreground/20 focus:border-violet-500 focus:ring-violet-500/20 focus-visible:ring-0 transition-all duration-200"
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
                        <div className="relative">
                          <Input
                            {...field}
                            disabled={isPending}
                            type={isShow ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-11 pr-11 h-12 border-muted-foreground/20 focus:border-violet-500 focus:ring-violet-500/20 focus-visible:ring-0 transition-all duration-200"
                          />
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
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
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end">
                  <Link
                    href="/reset-password"
                    className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <FormError message={error} />
                <FormSuccess message={success} />

                <Button
                  disabled={isPending}
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-violet-500/20 transition-all duration-200 group"
                >
                  {!isPending ? (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href={
                    redirect ? `/signup?redirectPath=${redirect}` : "/signup"
                  }
                  className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium hover:underline transition-colors"
                >
                  Create account
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

const LoginFormWrapper = () => (
  <Suspense
    fallback={
      <div className=" flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20">
        <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/80 dark:bg-background/80 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </CardContent>
        </Card>
      </div>
    }
  >
    <LoginForm />
  </Suspense>
);

export default LoginFormWrapper;
