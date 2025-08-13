"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  PackageOpen,
  Sparkles,
  Shield,
  Zap,
  Edit,
  FileText,
  Archive,
} from "lucide-react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { getAccessToken, getCurrentUser } from "@/services/auth-services";
// Removed getBaseApi import to prevent server component errors

type Package = {
  _id: string;
  title: string;
  tokens: number;
  price: number;
  popular: boolean;
  discount?: number;
  discountedPrice?: string;
  updatedAt?: string;
};

const features = {
  Starter: [
    "Fast ai assistance",
    "Fast images processing",
    "Accurate result",
    "Metadata editing",
    "CSV Download",
    "Zip Download",
  ],
  Basic: [
    "Advanced AI assistance",
    "Fast images processing",
    "Accurate result",
    "Metadata editing",
    "CSV Download",
    "Zip Download",
  ],
  Pro: [
    "Premium AI assistance",
    "Fast images processing",
    "Accurate result",
    "Metadata editing",
    "CSV Download",
    "Zip Download",
  ],
};
const getFeatureIcon = (feature: string) => {
  if (feature.includes("AI assistance")) return <Zap className="h-4 w-4" />;
  if (feature.includes("images processing"))
    return <Shield className="h-4 w-4" />;
  if (feature.includes("Accurate result")) return <Check className="h-4 w-4" />;
  if (feature.includes("Metadata editing")) return <Edit className="h-4 w-4" />;
  if (feature.includes("CSV Download")) return <FileText className="h-4 w-4" />;
  if (feature.includes("Zip Download")) return <Archive className="h-4 w-4" />;
  return <Check className="h-4 w-4" />; // Default icon
};

const PricingTabs = () => {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const baseApi = process.env.NEXT_PUBLIC_API_BASE_URL;

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
    if (purchasingId) return;

    try {
      setPurchasingId(packageId);
      const baseApi = process.env.NEXT_PUBLIC_API_BASE_URL;
      const accessToken = await getAccessToken();
      const user = await getCurrentUser();

      if (!user) {
        router.push("/login?redirectPath=pricing");
        return;
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
      setPurchasingId(null);
    }
  };
  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border border-border/50">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-24" />
                <div className="space-y-2 pt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : !packages || packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen className="h-16 w-16 text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold">No Token Packages Available</h3>
          <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md">
            We couldn&apos;t find any token packages at the moment. Please try
            again later or contact support.
          </p>
          <Button onClick={fetchDashboardData}>Refresh</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map(
            ({
              title,
              tokens,
              price,
              popular,
              _id,
              discount,
              discountedPrice,
            }) => (
              <Card
                key={_id}
                className={`${
                  popular ? "border-primary shadow-md" : "border-border/50"
                } relative overflow-hidden transition-all hover:shadow-lg`}
              >
                {popular && (
                  <div className="absolute -right-10 top-5 rotate-45 bg-primary px-10 py-1 text-xs font-semibold text-primary-foreground">
                    Popular
                  </div>
                )}
                {discount && discount > 0 && (
                  <Badge className="absolute top-4 left-4 bg-green-500 hover:bg-green-600">
                    {discount}% OFF
                  </Badge>
                )}
                <CardHeader className="pb-2 mt-6">
                  <CardTitle className="text-xl flex items-center gap-2">
                    {popular && <Sparkles className="h-5 w-5 text-primary" />}
                    {title}
                  </CardTitle>
                  <CardDescription>
                    Perfect for{" "}
                    {title === "Starter"
                      ? "beginners"
                      : title === "Basic"
                      ? "regular users"
                      : "power users"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-4xl font-bold">
                      {tokens.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Tokens</p>
                  </div>

                  <div className="space-y-1">
                    {discount && discount > 0 ? (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-foreground">
                            ৳{" "}
                            {Number.parseFloat(
                              discountedPrice || "0"
                            ).toLocaleString()}
                          </p>
                          <p className="text-sm line-through text-muted-foreground">
                            ৳ {price.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-green-500 font-medium">
                          Save ৳{" "}
                          {(
                            price - Number.parseFloat(discountedPrice || "0")
                          ).toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-bold">
                        ৳ {price.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      ৳{" "}
                      {(
                        (discount && discountedPrice
                          ? Number.parseFloat(discountedPrice)
                          : price) / tokens
                      ).toFixed(2)}{" "}
                      per token
                    </p>
                  </div>

                  <div className="pt-4 space-y-2">
                    {features[title as keyof typeof features]?.map(
                      (feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="rounded-full p-1 bg-primary/10 text-primary mt-0.5">
                            {getFeatureIcon(feature)}
                          </div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={popular ? "default" : "outline"}
                    className="w-full"
                    disabled={purchasingId !== null}
                    onClick={() => handlePurchase(_id)}
                    size="lg"
                  >
                    {purchasingId === _id ? "Processing..." : "Purchase Now"}
                  </Button>
                </CardFooter>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PricingTabs;
