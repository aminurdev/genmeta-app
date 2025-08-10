"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Removed getBaseApi import to prevent server component errors

interface VerifyEmailPageProps {
  searchParams: Promise<{ token: string }>;
}

export default function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = use(searchParams);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token not found");
      return;
    }

    const verifyEmail = async () => {
      try {
        const baseApi = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch(`${baseApi}/users/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message);
        }
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-96 shadow-lg border border-border">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-semibold text-foreground">
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center space-y-6 pt-4">
          {status === "loading" && (
            <>
              <Loader2 className="animate-spin h-12 w-12 text-primary" />
              <p className="text-muted-foreground">
                Verifying your email, please wait...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium text-green-600">
                {message || "Your email has been verified!"}
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium text-destructive">{message}</p>
              <Button variant="destructive" asChild className="w-full">
                <Link href="/">Back to Home</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
