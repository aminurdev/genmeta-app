"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loading } from "@/components/Loading";
import { verifyGoogleToken } from "@/services/auth-services";

const VerifyGoogleContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  const token = searchParams.get("token");
  const redirectPath = searchParams.get("redirectPath");

  useEffect(() => {
    const referral = searchParams?.get("ref");
    if (referral) {
      localStorage.setItem("referralCode", referral);
    }
  }, [searchParams]);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Invalid or missing token");
        setIsVerifying(false);
        return;
      }
      const referral = localStorage.getItem("referralCode");

      try {
        const result = await verifyGoogleToken(token, referral);

        if (result.success) {
          router.push(redirectPath || "/");
        } else {
          setError("Token verification failed");
          setIsVerifying(false);
        }
      } catch {
        setError("An error occurred during verification");
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token, redirectPath, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
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
