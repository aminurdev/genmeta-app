"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { getBaseApi } from "@/services/image-services";

const Social = () => {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const redirectPath = searchParams?.get("redirectPath") || "/";

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const baseApi = await getBaseApi();
      const state = JSON.stringify({
        redirectPath,
        path: pathname,
      });

      window.location.href = `${baseApi}/users/google-login?state=${encodeURIComponent(
        state
      )}&type=web`;
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-4 mb-2">
      <Button
        onClick={handleGoogleSignIn}
        variant="outline"
        type="submit"
        className="w-full cursor-pointer"
        disabled={isLoading}
        asChild
      >
        <span>
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-neutral-800 dark:text-neutral-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </div>
          ) : (
            <>
              <Image
                src="/auth/google.svg"
                className="h-4 w-4 text-neutral-800 dark:text-neutral-300 mr-2"
                width={20}
                height={20}
                alt="google"
              />
              Continue with Google
            </>
          )}
        </span>
      </Button>
    </div>
  );
};

export default Social;
