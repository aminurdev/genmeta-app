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
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { FormError } from "./form-error";
import { FormSuccess } from "./form-success";
import Social from "./social";
import { loginUser } from "@/services/auth-services";
import { useRouter, useSearchParams } from "next/navigation";

const LoginForm = () => {
  const searchParams = useSearchParams();
  const message = searchParams?.get("message") ?? "";
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>(message ?? "");
  const [isShow, setIsShow] = useState<boolean>(false);
  const [isPending, setTransition] = useTransition();

  const redirect = searchParams?.get("redirectPath");
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
    <Card className="max-w-md w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl">Log in</CardTitle>
        <CardDescription>
          {" "}
          <p className="text-neutral-600 max-w-sm mt-2 dark:text-neutral-300">
            {"Don't"} have an account?{" "}
            <Link href="/signup" className="underline text-blue-500">
              sign up
            </Link>
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel htmlFor="password">Password</FormLabel>
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
              <div className="flex items-center justify-end">
                <Link
                  href="/reset-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>

              <FormError message={error} />
              <FormSuccess message={success} />
              <Button
                disabled={isPending}
                type="submit"
                className="w-full mt-6"
              >
                {!isPending ? (
                  "Login"
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
            <span className="text-neutral-800 dark:text-neutral-300 text-lg bg-card z-10  px-2">
              or
            </span>
            <span className="w-full h-px  absolute left-0 top-1/2 translate-y-1/2 bg-slate-200" />
          </div>

          <Social />
        </div>
      </CardContent>{" "}
      <CardFooter className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          By creating an account, you agree to our{" "}
          <span className="underline">Terms of Service</span>,{" "}
          <span className="underline">Privacy Policy</span> and{" "}
          <span className="underline">Acceptable Use Policy</span> .
        </p>
      </CardFooter>
    </Card>
  );
};

const LoginFormWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LoginForm />
  </Suspense>
);

export default LoginFormWrapper;
