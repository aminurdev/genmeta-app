"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { verifyGoogleToken } from "@/services/auth-services";
import { useAuth } from "@/components/providers/auth-provider";
import { sanitizeRedirectPath } from "@/lib/auth-constants";

const VerifyGoogleContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser, refreshUser } = useAuth();
  const hasAttemptedRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  const code = searchParams.get("code");
  const redirectPath = searchParams.get("redirectPath");

  useEffect(() => {
    const referral = searchParams?.get("ref");
    if (referral) {
      localStorage.setItem("referralCode", referral);
    }
  }, [searchParams]);

  useEffect(() => {
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;

    const exchangeCode = async () => {
      if (!code) {
        setError("Invalid or missing Google authorization code.");
        setIsVerifying(false);
        return;
      }

      const referral = localStorage.getItem("referralCode");

      try {
        const result = await verifyGoogleToken(code, referral);

        if (result.success) {
          if (referral) {
            localStorage.removeItem("referralCode");
          }
          if (result.data?.user) {
            setUser(result.data.user);
          } else {
            await refreshUser();
          }

          const targetPath = sanitizeRedirectPath(
            result.data?.redirectPath || redirectPath,
            "/dashboard"
          );
          router.replace(targetPath);
          router.refresh();
        } else {
          setError(
            result.message || "Google sign-in could not be verified. Please try again."
          );
          setIsVerifying(false);
        }
      } catch {
        setError("An error occurred during Google verification.");
        setIsVerifying(false);
      }
    };

    exchangeCode();
  }, [code, redirectPath, refreshUser, router, setUser]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <p className="text-sm font-medium text-destructive">{error}</p>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/login">Back to Login</Link>
        </Button>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return null;
};

const VerifyGoogle = () => {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loading />
        </div>
      }
    >
      <VerifyGoogleContent />
    </Suspense>
  );
};

export default VerifyGoogle;
