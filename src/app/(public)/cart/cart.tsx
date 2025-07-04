"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Tag,
  ChevronRight,
  X,
  CheckCircle,
} from "lucide-react";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import {
  fetchPricingPlanById,
  PricingPlan,
  validatePromoCode,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getBaseApi, getAccessToken } from "@/services/image-services";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/services/auth-services";

interface PromoCode {
  code: string;
  discountPercent: number;
  appliesTo: "subscription" | "credit" | "both";
  validUntil: string;
}

export default function Cart({ planId }: { planId: string }) {
  const router = useRouter();

  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Promo code states
  const [promoCode, setPromoCode] = useState<string>("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [validPromo, setValidPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (!planId) {
        setError(
          "No plan selected. Please choose a plan from the pricing page."
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const planData = await fetchPricingPlanById(planId);
        setPlan(planData);
      } catch (error) {
        console.error("Error fetching plan:", error);
        setError("Failed to load plan details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanDetails();
  }, [planId]);

  const handleBackToPricing = () => {
    router.push("/pricing");
  };

  const calculateDiscountedPrice = (
    basePrice: number,
    discountPercent: number
  ) => {
    return ((basePrice * (100 - discountPercent)) / 100).toFixed(2);
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    if (!plan) return;

    setPromoError(null);
    setIsApplyingPromo(true);

    try {
      const promoResult = await validatePromoCode(promoCode.trim());

      // Check if promo code applies to the selected plan type
      if (
        promoResult.appliesTo !== "both" &&
        promoResult.appliesTo !== plan.type
      ) {
        setPromoError(
          `This promo code is only valid for ${promoResult.appliesTo} plans`
        );
        setValidPromo(null);
        return;
      }

      // Check if promo code is expired
      const validUntil = new Date(promoResult.validUntil);
      if (validUntil < new Date()) {
        setPromoError("This promo code has expired");
        setValidPromo(null);
        return;
      }

      setValidPromo(promoResult);
      toast.success(
        `Promo code applied: ${promoResult.discountPercent}% discount`
      );
    } catch (error) {
      console.error("Error validating promo code:", error);
      setPromoError(
        error instanceof Error ? error.message : "Invalid promo code"
      );
      setValidPromo(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleClearPromoCode = () => {
    setPromoCode("");
    setValidPromo(null);
    setPromoError(null);
  };

  const handleCheckout = async (
    id: string,
    type: string,
    promoCode?: string
  ) => {
    console.log(
      "Checkout initiated with ID:",
      id,
      "Type:",
      type,
      "Promo Code:",
      promoCode
    );

    try {
      const user = await getCurrentUser();

      if (user) {
        setIsProcessing(true);
        const baseApi = await getBaseApi();
        const accessToken = await getAccessToken();

        const response = await fetch(`${baseApi}/payment/create-app-payment`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            planId: id,
            type,
            promoCode,
          }),
        });

        const data = await response.json();
        console.log(data);

        if (!data.success) {
          throw new Error(data.message || "Failed to process payment");
        }

        // Redirect to bKash payment page
        if (data.data?.bkashURL) {
          window.location.href = data.data.bkashURL;
        }
      } else {
        router.push("/login?redirectPath=cart?type=" + type);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error(
        error instanceof Error ? error.message : "Payment processing failed"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <MaxWidthWrapper className="py-24">
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading plan details...</p>
        </div>
      </MaxWidthWrapper>
    );
  }

  if (error || !plan) {
    return (
      <MaxWidthWrapper className="py-24">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Could not load plan details"}
          </AlertDescription>
        </Alert>
        <Button
          onClick={handleBackToPricing}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pricing
        </Button>
      </MaxWidthWrapper>
    );
  }

  // Calculate the price with plan discount
  const priceAfterPlanDiscount =
    plan.discountPercent > 0
      ? parseFloat(
          calculateDiscountedPrice(plan.basePrice, plan.discountPercent)
        )
      : plan.basePrice;

  // Apply promo code discount if valid
  const finalPrice = validPromo
    ? parseFloat(
        calculateDiscountedPrice(
          priceAfterPlanDiscount,
          validPromo.discountPercent
        )
      )
    : priceAfterPlanDiscount;

  return (
    <MaxWidthWrapper className="py-24">
      <div className="flex flex-wrap items-center mb-8 gap-4">
        <Button
          variant="ghost"
          onClick={handleBackToPricing}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Complete Your Purchase</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                We currently support bKash as our payment processor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/50">
                <div className="w-12 h-12 flex items-center justify-center bg-rose-100 rounded-md">
                  <img
                    src="/bkash-logo.png"
                    alt="bKash"
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23e91e63' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='20' height='14' x='2' y='5' rx='2'/%3E%3Cline x1='2' x2='22' y1='10' y2='10'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div>
                  <p className="font-medium">bKash</p>
                  <p className="text-sm text-muted-foreground">
                    Secure mobile financial service
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Promo Code
              </CardTitle>
              <CardDescription>
                Enter a promo code to get additional discount
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validPromo ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-green-50 border-green-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{validPromo.code}</p>
                      <p className="text-sm text-green-700">
                        {validPromo.discountPercent}% discount applied
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearPromoCode}
                    className="h-8 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          if (promoError) setPromoError(null);
                        }}
                        className="bg-muted/40"
                      />
                    </div>
                    <Button
                      onClick={handleApplyPromoCode}
                      disabled={isApplyingPromo || !promoCode.trim()}
                      className="shrink-0"
                    >
                      {isApplyingPromo ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Apply
                    </Button>
                  </div>

                  {promoError && (
                    <p className="text-red-500 text-sm">{promoError}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-lg">{plan.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {plan.type === "subscription"
                        ? `${plan.planDuration} days subscription`
                        : `${plan.credit} credits`}
                    </p>
                  </div>
                  {plan.type === "subscription" && (
                    <Badge variant="outline" className="bg-primary/10">
                      Subscription
                    </Badge>
                  )}
                  {plan.type === "credit" && (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-500 border-blue-200"
                    >
                      Credits
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span>Base Price</span>
                <span
                  className={
                    plan.discountPercent > 0
                      ? "line-through text-muted-foreground"
                      : ""
                  }
                >
                  ৳{plan.basePrice.toFixed(2)}
                </span>
              </div>

              {plan.discountPercent > 0 && (
                <div className="flex justify-between items-center">
                  <span>Plan Discount ({plan.discountPercent}%)</span>
                  <span className="text-green-600">
                    -৳{(plan.basePrice - priceAfterPlanDiscount).toFixed(2)}
                  </span>
                </div>
              )}

              {validPromo && (
                <div className="flex justify-between items-center">
                  <span>Promo Discount ({validPromo.discountPercent}%)</span>
                  <span className="text-green-600">
                    -৳{(priceAfterPlanDiscount - finalPrice).toFixed(2)}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-center font-bold">
                <span>Total</span>
                <span>৳{finalPrice.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() =>
                  handleCheckout(plan._id, plan.type, validPromo?.code)
                }
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay with bKash
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
