"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { sanitizeRedirectPath } from "@/lib/auth-constants";

export default function Social() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const safeRedirectPath = sanitizeRedirectPath(
    searchParams?.get("redirectPath"),
    "/dashboard"
  );

  const referral = searchParams?.get("ref");

  useEffect(() => {
    if (referral) {
      localStorage.setItem("referralCode", referral);
    }
  }, [referral]);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    window.location.href = `/api/v1/users/google-login?redirectPath=${encodeURIComponent(
      safeRedirectPath
    )}`;
  };

  return (
    <Button
      type="button"
      onClick={handleGoogleSignIn}
      variant="outline"
      className="w-full h-11 rounded-full border-border hover:bg-muted/50 font-medium transition-colors flex items-center justify-center gap-2.5 text-sm"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span>Connecting to Google...</span>
        </>
      ) : (
        <>
          <Image
            src="/auth/google.svg"
            className="h-4 w-4 shrink-0"
            width={18}
            height={18}
            alt="Google"
          />
          <span>Continue with Google</span>
        </>
      )}
    </Button>
  );
}
