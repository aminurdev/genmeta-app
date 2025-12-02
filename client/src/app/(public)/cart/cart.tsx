/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ChevronRight,
  X,
  CheckCircle,
  CreditCard,
  Check,
} from "lucide-react";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import type { PricingPlan } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getCurrentUser } from "@/services/auth-services";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllPricing } from "@/services/queries/pricing";
import { createPayment, validPromoCode } from "@/services/pricing";
import { PromoCodeRes } from "@/types/pricing";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  logo: string;
  available: boolean;
  comingSoon?: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "bkash",
    name: "bKash",
    description: "Local payment method",
    logo: "/bkash-logo.png",
    available: true,
  },
];

export default function Cart({ planId }: { planId: string }) {
  const router = useRouter();
  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Plan selection states
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedPlanType, setSelectedPlanType] = useState<
    "subscription" | "credit"
  >("subscription");

  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("bkash");

  // Promo code states
  const [promoCode, setPromoCode] = useState<string>("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [validPromo, setValidPromo] = useState<PromoCodeRes | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Use React Query hook instead of manual fetching
  const { data: pricingData, isLoading: isPricingLoading } = useAllPricing();

  // Derive plans from React Query data
  const subscriptionPlans =
    (pricingData?.success && pricingData?.data?.subscriptionPlans) || [];
  const creditPlans =
    (pricingData?.success && pricingData?.data?.creditPlans) || [];

  useEffect(() => {
    // Set initial plan when pricing data is loaded
    if (pricingData?.success && pricingData?.data) {
      const { subscriptionPlans: subs, creditPlans: credits } =
        pricingData.data;
      const allPlans = [...subs, ...credits];

      if (planId) {
        const foundPlan = allPlans.find((p) => p._id === planId);
        if (foundPlan) {
          setPlan(foundPlan as PricingPlan);
          setSelectedPlanId(foundPlan._id);
          setSelectedPlanType(foundPlan.type as "subscription" | "credit");
        } else {
          setError("Plan not found. Please select a valid plan.");
        }
      } else {
        // Default to first subscription plan
        if (subs.length > 0) {
          setPlan(subs[0] as PricingPlan);
          setSelectedPlanId(subs[0]._id);
          setSelectedPlanType("subscription");
        }
      }
      setIsLoading(false);
    } else if (pricingData && !pricingData.success) {
      setError("Failed to load plan details. Please try again.");
      setIsLoading(false);
    } else if (isPricingLoading) {
      setIsLoading(true);
    }
  }, [pricingData, planId, isPricingLoading]);

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

    const res = await validPromoCode(promoCode.trim());

    if (!res.success) {
      setPromoError(res.message || "Invalid promo code");
      setValidPromo(null);
      setIsApplyingPromo(false);
      return;
    }

    const promoResult = res.data;

    if (
      promoResult?.promoCode?.appliesTo !== "both" &&
      promoResult?.promoCode?.appliesTo !== plan.type
    ) {
      setPromoError("This promo code is not valid for your plan");
      setValidPromo(null);
      setIsApplyingPromo(false);
      return;
    }

    // Check if promo code is expired
    const validUntil = new Date(promoResult.promoCode.validUntil);
    if (validUntil < new Date()) {
      setPromoError("This promo code has expired");
      setValidPromo(null);
      setIsApplyingPromo(false);
      return;
    }

    setValidPromo(res.data);
    toast.success(
      `Promo code applied: ${promoResult.promoCode.discountPercent}% discount`
    );
    setIsApplyingPromo(false);
  };

  const handleClearPromoCode = () => {
    setPromoCode("");
    setValidPromo(null);
    setPromoError(null);
  };

  const handlePlanChange = (planId: string) => {
    const allPlans = [...subscriptionPlans, ...creditPlans];
    const selectedPlan = allPlans.find((p) => p._id === planId);
    if (selectedPlan) {
      setPlan(selectedPlan as PricingPlan);
      setSelectedPlanId(planId);
      setValidPromo(null);
      setPromoCode("");
      setPromoError(null);
    }
  };

  // const handlePlanTypeChange = (type: "subscription" | "credit") => {
  //   setSelectedPlanType(type);
  //   const plans = type === "subscription" ? subscriptionPlans : creditPlans;
  //   if (plans.length > 0) {
  //     setPlan(plans[0]);
  //     setSelectedPlanId(plans[0]._id);
  //     setValidPromo(null);
  //     setPromoCode("");
  //     setPromoError(null);
  //   }
  // };

  const handleCheckout = async (
    id: string,
    type: string,
    promoCode?: string
  ) => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setIsProcessing(true);

        const data = await createPayment({
          planId: id,
          type,
          promoCode,
          paymentMethod: selectedPaymentMethod,
        });

        if (!data.success) {
          throw new Error(data.message || "Failed to process payment");
        }
        if (selectedPaymentMethod === "bkash" && data.data?.bkashURL) {
          window.location.href = data.data.bkashURL;
        }
      } else {
        router.push("/login?redirectPath=cart?type=subscription");
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
      <div className="min-h-screen bg-background">
        <MaxWidthWrapper className="py-24">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-muted rounded-full animate-spin border-t-primary mb-8"></div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Loading your cart
              </h2>
              <p className="text-muted-foreground">
                Please wait while we prepare your order
              </p>
            </div>
          </div>
        </MaxWidthWrapper>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-background">
        <MaxWidthWrapper className="py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-8">
              {error || "We couldn't load your plan details. Please try again."}
            </p>
            <Button onClick={handleBackToPricing} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pricing
            </Button>
          </div>
        </MaxWidthWrapper>
      </div>
    );
  }

  // Calculate the price with discounts
  const priceAfterPlanDiscount = plan.discountPrice
    ? plan.discountPrice
    : plan.discountPercent > 0
      ? Number.parseFloat(
        calculateDiscountedPrice(plan.basePrice, plan.discountPercent)
      )
      : plan.basePrice;

  const finalPrice = validPromo
    ? Number.parseFloat(
      calculateDiscountedPrice(
        priceAfterPlanDiscount,
        validPromo.promoCode.discountPercent
      )
    )
    : priceAfterPlanDiscount;

  const currentPlans =
    selectedPlanType === "subscription" ? subscriptionPlans : creditPlans;

  return (
    <div className="min-h-screen bg-background">
      <MaxWidthWrapper className="py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-muted-foreground">Secure checkout with GenMeta</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Type Selection - Tabs */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Choose Plan Type</CardTitle>
                <CardDescription>
                  Select between subscription or credit-based plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={selectedPlanType}
                  onValueChange={(value) =>
                    handlePlanTypeChange(value as "subscription" | "credit")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="subscription" className="flex gap-2">
                      <Check className="h-4 w-4" />
                      Subscription
                    </TabsTrigger>
                    <TabsTrigger value="credit" className="flex gap-2">
                      <Zap className="h-4 w-4" />
                      Credits
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card> */}

            {/* Plan Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Your Plan</CardTitle>
                <CardDescription>
                  Choose the{" "}
                  {selectedPlanType === "subscription"
                    ? "subscription"
                    : "credit"}{" "}
                  plan that works best for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedPlanId} onValueChange={handlePlanChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentPlans.map((planOption) => (
                      <SelectItem key={planOption._id} value={planOption._id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{planOption.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ৳
                            {planOption.discountPrice
                              ? planOption.discountPrice
                              : planOption.discountPercent > 0
                                ? (
                                  (planOption.basePrice *
                                    (100 - planOption.discountPercent)) /
                                  100
                                ).toFixed(0)
                                : planOption.basePrice.toFixed(0)}
                            {selectedPlanType === "subscription"
                              ? "/month"
                              : ""}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Plan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  {selectedPlanType === "subscription"
                    ? `${plan.planDuration} days of unlimited access to all premium features`
                    : `${plan.credit} AI-powered metadata generations`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="font-semibold">What&apos;s included:</h3>
                  <div className="grid gap-2">
                    {(selectedPlanType === "subscription"
                      ? [
                        "Unlimited Batch Processing",
                        "Use Your Own API Key",
                        "Metadata Editor with Bulk Edits",
                        "Support for JPG, PNG, EPS, MP4, MOV",
                        "Priority Customer Support",
                        "Unlimited Results",
                      ]
                      : [
                        "Faster Processing — Batch Support",
                        "No API Required — Built-in Access",
                        "Metadata Editor with Bulk Edits",
                        "Support for JPG, PNG, EPS, MP4, MOV",
                        "1 Credit Token per Image",
                        "Priority Customer Support",
                        "No Monthly Commitment",
                      ]
                    ).map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card>
                <CardContent className="space-y-5 pt-6">
                  {/* Promo Code */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Have a Promo Code?</h3>
                    {validPromo ? (
                      <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">
                              {validPromo.promoCode.code}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {validPromo.promoCode.discountPercent}% discount
                              applied
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearPromoCode}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleApplyPromoCode();
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          placeholder="Enter promo code"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value.toUpperCase());
                            if (promoError) setPromoError(null);
                          }}
                          className="font-mono"
                        />
                        <Button
                          type="submit"
                          disabled={isApplyingPromo || !promoCode.trim()}
                        >
                          {isApplyingPromo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </form>
                    )}
                    {promoError && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        <X className="h-4 w-4 flex-shrink-0" />
                        <p>{promoError}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Order Summary */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Order Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>{plan.name}</span>
                        <span className="font-medium">
                          ৳{plan.basePrice.toFixed(2)}
                        </span>
                      </div>
                      {plan.discountPercent > 0 && (
                        <div className="flex justify-between text-sm text-green-500">
                          <span>Discount ({plan.discountPercent}%)</span>
                          <span>
                            -৳
                            {(plan.basePrice - priceAfterPlanDiscount).toFixed(
                              2
                            )}
                          </span>
                        </div>
                      )}
                      {validPromo && (
                        <div className="flex justify-between text-sm text-green-500">
                          <span>
                            Promo ({validPromo.promoCode.discountPercent}%)
                          </span>
                          <span>
                            -৳{(priceAfterPlanDiscount - finalPrice).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <Separator />
                    <div className="flex justify-between items-end">
                      <span className="font-semibold">Total</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold">
                          ৳{finalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Method */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Payment Method</h3>
                    <RadioGroup
                      value={selectedPaymentMethod}
                      onValueChange={setSelectedPaymentMethod}
                    >
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-colors ${selectedPaymentMethod === method.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/40"
                            } ${!method.available
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                            }`}
                        >
                          <RadioGroupItem
                            value={method.id}
                            id={method.id}
                            disabled={!method.available}
                          />
                          <Label
                            htmlFor={method.id}
                            className={`flex items-center gap-4 flex-1 ${!method.available
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                              }`}
                          >
                            <div className="w-12 h-12 rounded-lg bg-background border flex items-center justify-center">
                              <img
                                src={method.logo || "/placeholder.svg"}
                                alt={method.name}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23e91e63' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Crect width='20' height='14' x='2' y='5' rx='2'/%3E%3Cline x1='2' x2='22' y1='10' y2='10'/%3E%3C/svg%3E";
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {method.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {method.description}
                              </p>
                            </div>
                            {selectedPaymentMethod === method.id &&
                              method.available && (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Checkout Button */}
                  <Button
                    className="w-full h-12 font-medium"
                    onClick={() =>
                      handleCheckout(
                        plan._id,
                        plan.type,
                        validPromo?.promoCode.code
                      )
                    }
                    disabled={
                      isProcessing ||
                      !paymentMethods.find(
                        (m) => m.id === selectedPaymentMethod
                      )?.available
                    }
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Continue to Payment
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
