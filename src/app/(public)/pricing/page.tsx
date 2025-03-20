"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccessToken, getCurrentUser } from "@/services/auth-services";
import { getBaseApi } from "@/services/image-services";
import { PackageOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Package = {
  _id: string;
  title: string;
  tokens: number;
  price: number;
  popular: boolean;
};

const PricingPage = () => {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const baseApi = await getBaseApi();

      if (!baseApi) {
        throw new Error("Authentication failed. Please log in again.");
      }

      const response = await fetch(`${baseApi}/pricing-plan/get`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pricing data (${response.status})`);
      }

      const responseData = await response.json();

      setPackages(responseData.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const handleOnline = () => {
      if (error) {
        toast.info("Connection restored. Refreshing data...");
        fetchDashboardData();
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [fetchDashboardData, error]);

  const handlePurchase = async (packageId: string) => {
    if (isPurchasing) return;

    try {
      setIsPurchasing(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();
      const user = await getCurrentUser();

      if (!user) {
        router.push("/login?redirectPath=pricing");
      }

      if (!baseApi || !accessToken) {
        throw new Error("Authentication failed. Please log in.");
      }

      const response = await fetch(`${baseApi}/payment/create-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          packageId,
        }),
      });

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.message || "Failed to initiate payment");
      }

      if (responseData.data?.bkashURL) {
        window.location.href = responseData.data.bkashURL;
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment initiation failed";
      toast.error(errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="mb-1">Purchase Tokens</CardTitle>
            <CardDescription>
              Buy more tokens for your account. Pay with bKash.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : !packages || packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                No Token Packages Available
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                We couldn&apos;t find any token packages at the moment. Please
                try again later or contact support.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map(({ title, tokens, price, popular, _id }) => (
                <Card
                  key={_id}
                  className={`${
                    popular ? "border-primary" : ""
                  } relative overflow-hidden transition-all hover:shadow-md`}
                >
                  {popular && (
                    <div className="absolute -right-10 top-4 rotate-45 bg-primary px-10 py-1 text-xs font-semibold text-primary-foreground">
                      Popular
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-3xl font-bold">
                      {tokens.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Tokens</p>
                    <p className="font-medium">৳ {price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      ৳ {(price / tokens).toFixed(2)} per token
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={popular ? "default" : "outline"}
                      className="w-full"
                      disabled={isPurchasing}
                      onClick={() => handlePurchase(_id)}
                    >
                      Purchase
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingPage;
