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
  ChevronDown,
  Shield,
  CreditCard,
  Percent,
  Clock,
  Star,
  Gift,
  Check,
  Zap,
  Sparkles,
} from "lucide-react";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import type { PricingPlan } from "@/lib/actions";
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
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  getAccessToken,
  getCurrentUser,
  getBaseApi,
} from "@/services/auth-services";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PromoCode {
  code: string;
  discountPercent: number;
  appliesTo: "subscription" | "credit" | "both";
  validUntil: string;
}

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
    description: "Bangladesh's leading mobile financial service",
    logo: "/bkash-logo.png",
    available: true,
  },
  // {
  //   id: "nagad",
  //   name: "Nagad",
  //   description: "Digital financial service",
  //   logo: "/nagad-logo.png",
  //   available: false,
  //   comingSoon: true,
  // },
  // {
  //   id: "rocket",
  //   name: "Rocket",
  //   description: "Mobile financial service",
  //   logo: "/rocket-logo.png",
  //   available: false,
  //   comingSoon: true,
  // },
];

export default function Cart({ planId }: { planId: string }) {
  const router = useRouter();
  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Plan customization states
  const [allPlans, setAllPlans] = useState<{
    subscriptionPlans: PricingPlan[];
    creditPlans: PricingPlan[];
  }>({ subscriptionPlans: [], creditPlans: [] });
  const [selectedPlanType, setSelectedPlanType] = useState<
    "subscription" | "credit"
  >("subscription");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("bkash");

  // Promo code states
  const [promoCode, setPromoCode] = useState<string>("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [validPromo, setValidPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isPromoExpanded, setIsPromoExpanded] = useState(false);

  useEffect(() => {
    const fetchAllPlans = async () => {
      try {
        setIsLoading(true);
        const baseApi = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await fetch(`${baseApi}/pricing/plans`);
        const result = await response.json();

        if (result.success && result.data) {
          const { subscriptionPlans, creditPlans } = result.data;
          setAllPlans({ subscriptionPlans, creditPlans });

          // Set initial plan if planId is provided
          if (planId) {
            const foundPlan = [...subscriptionPlans, ...creditPlans].find(
              (p) => p._id === planId
            );
            if (foundPlan) {
              setPlan(foundPlan);
              setSelectedPlanType(foundPlan.type as "subscription" | "credit");
              setSelectedPlanId(foundPlan._id);
            }
          } else {
            // Default to first subscription plan
            if (subscriptionPlans.length > 0) {
              setPlan(subscriptionPlans[0]);
              setSelectedPlanId(subscriptionPlans[0]._id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
        setError("Failed to load plan details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllPlans();
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
      // Use direct fetch instead of server action to avoid server component errors
      const baseApi = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(
        `${baseApi}/promo-codes/validate/${promoCode.trim()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid promo code");
      }

      const responseData = await response.json();
      const promoResult = responseData.data.promoCode;

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

  const handlePlanChange = (planId: string) => {
    const allPlansList = [
      ...allPlans.subscriptionPlans,
      ...allPlans.creditPlans,
    ];
    const selectedPlan = allPlansList.find((p) => p._id === planId);
    if (selectedPlan) {
      setPlan(selectedPlan);
      setSelectedPlanId(planId);
      // Clear promo code when changing plans
      setValidPromo(null);
      setPromoCode("");
      setPromoError(null);
    }
  };

  const handlePlanTypeChange = (value: string) => {
    const type = value as "subscription" | "credit";
    setSelectedPlanType(type);
    const plans =
      type === "subscription"
        ? allPlans.subscriptionPlans
        : allPlans.creditPlans;
    if (plans.length > 0) {
      setPlan(plans[0]);
      setSelectedPlanId(plans[0]._id);
      // Clear promo code when changing plan type
      setValidPromo(null);
      setPromoCode("");
      setPromoError(null);
    }
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
            paymentMethod: selectedPaymentMethod,
          }),
        });
        const data = await response.json();
        console.log(data);
        if (!data.success) {
          throw new Error(data.message || "Failed to process payment");
        }
        // Redirect to payment page based on selected method
        if (selectedPaymentMethod === "bkash" && data.data?.bkashURL) {
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

  // Calculate the price with plan discount
  const priceAfterPlanDiscount = plan.discountPrice
    ? plan.discountPrice
    : plan.discountPercent > 0
    ? Number.parseFloat(
        calculateDiscountedPrice(plan.basePrice, plan.discountPercent)
      )
    : plan.basePrice;

  // Apply promo code discount if valid
  const finalPrice = validPromo
    ? Number.parseFloat(
        calculateDiscountedPrice(
          priceAfterPlanDiscount,
          validPromo.discountPercent
        )
      )
    : priceAfterPlanDiscount;

  const totalSavings = plan.basePrice - finalPrice;

  return (
    <div className="min-h-screen bg-background">
      <MaxWidthWrapper className="py-8 lg:py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Complete Your Purchase
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              You&apos;re just one step away from unlocking the full power of
              GenMeta
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-7 space-y-8">
            {/* Plan Customization */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      Customize Your Plan
                    </CardTitle>
                    <CardDescription>
                      Choose the perfect plan for your needs
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Type Tabs */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Plan Type
                  </Label>
                  <Tabs
                    value={selectedPlanType}
                    onValueChange={handlePlanTypeChange}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="subscription"
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Subscription
                      </TabsTrigger>
                      <TabsTrigger
                        value="credit"
                        className="flex items-center gap-2"
                      >
                        <Zap className="h-4 w-4" />
                        Credits
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Plan Selection */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Select Plan
                  </Label>
                  <Select
                    value={selectedPlanId}
                    onValueChange={handlePlanChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedPlanType === "subscription"
                        ? allPlans.subscriptionPlans
                        : allPlans.creditPlans
                      ).map((planOption) => (
                        <SelectItem key={planOption._id} value={planOption._id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">
                              {planOption.name}
                            </span>
                            <span className="text-sm text-muted-foreground ml-4 font-medium">
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
                              {selectedPlanType === "subscription" &&
                                planOption.planDuration === 365 &&
                                "/yearly"}{" "}
                              {selectedPlanType === "subscription" &&
                                planOption.planDuration === 182 &&
                                "/half-yearly"}
                              {selectedPlanType === "subscription" &&
                                planOption.planDuration === 91 &&
                                "/quarterly"}
                              {selectedPlanType === "subscription" &&
                                planOption.planDuration === 30 &&
                                "/monthly"}
                              {selectedPlanType === "credit" &&
                                ` (${planOption.credit} credits)`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Plan Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-base">
                      {plan.type === "subscription"
                        ? `${plan.planDuration} days of unlimited access to all premium features`
                        : `${plan.credit} AI-powered metadata generations with priority processing`}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {plan.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Plan Features */}
                <div className="space-y-6 mb-8">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    What&apos;s included:
                  </h3>
                  <div className="grid gap-3">
                    {(plan.type === "subscription"
                      ? [
                          "Unlimited — Batch Processing",
                          "Use Own API key — Gemini API Integration",
                          "Powerful Metadata Editor — Bulk Edits",
                          "JPG, JPEG, PNG, EPS — Supported Formats",
                          "Priority customer support",
                          "Unlimited Results",
                        ]
                      : [
                          "Faster processing — Batch Processing",
                          "Powerful Metadata Editor — Bulk Edits",
                          "No API required — Built-in API Access",
                          "JPG, JPEG, PNG, EPS — Supported Formats",
                          "1 credit token per image — Results Generation",
                          "Priority customer support",
                          "No monthly commitment",
                        ]
                    ).map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Additional Features */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Premium Features</p>
                      <p className="text-sm text-muted-foreground">
                        Full access included
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Secure Payment</p>
                      <p className="text-sm text-muted-foreground">
                        256-bit encryption
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Instant Access</p>
                      <p className="text-sm text-muted-foreground">
                        Available immediately
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-5 space-y-6">
            {/* Promo Code Section */}
            <Card>
              <CardHeader className="pb-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsPromoExpanded(!isPromoExpanded)}
                  className="w-full justify-between p-0 h-auto hover:bg-transparent"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg">
                        Have a Promo Code?
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {validPromo
                          ? `${validPromo.discountPercent}% discount applied`
                          : "Get additional savings on your purchase"}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      isPromoExpanded ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CardHeader>
              {isPromoExpanded && (
                <CardContent className="pt-0">
                  {validPromo ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">{validPromo.code}</p>
                          <p className="text-sm text-muted-foreground">
                            {validPromo.discountPercent}% discount applied
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearPromoCode}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleApplyPromoCode();
                        }}
                        className="flex gap-3"
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
                      {promoError && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                          <X className="h-4 w-4 flex-shrink-0" />
                          <p className="text-sm">{promoError}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Order Summary */}
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Order Summary</CardTitle>
                    <CardDescription>
                      Review your purchase details
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-lg">{plan.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.type === "subscription"
                          ? `${plan.planDuration} days subscription`
                          : `${plan.credit} credits`}
                      </p>
                    </div>
                    <p
                      className={`font-medium text-lg ${
                        plan.discountPercent > 0
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      ৳{plan.basePrice.toFixed(2)}
                    </p>
                  </div>

                  {plan.discountPercent > 0 && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          Plan Discount ({plan.discountPercent}%)
                        </span>
                      </div>
                      <span className="text-primary font-medium">
                        -৳{(plan.basePrice - priceAfterPlanDiscount).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {validPromo && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          Promo Discount ({validPromo.discountPercent}%)
                        </span>
                      </div>
                      <span className="text-primary font-medium">
                        -৳{(priceAfterPlanDiscount - finalPrice).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Total</span>
                    <div className="text-right">
                      {totalSavings > 0 && (
                        <Badge variant="secondary" className="mb-2 block">
                          You save ৳{totalSavings.toFixed(2)}
                        </Badge>
                      )}
                      <span className="text-3xl font-bold">
                        ৳{finalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Payment Method Selection */}
              <CardContent className="pt-0">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-medium text-lg">Payment Method</h3>
                  </div>
                  <RadioGroup
                    value={selectedPaymentMethod}
                    onValueChange={setSelectedPaymentMethod}
                  >
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="relative">
                        <div
                          className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-colors ${
                            selectedPaymentMethod === method.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/40"
                          } ${
                            !method.available
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
                            className={`flex items-center gap-4 flex-1 ${
                              !method.available
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
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{method.name}</p>
                                {method.comingSoon && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Coming Soon
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {method.description}
                              </p>
                            </div>
                            {selectedPaymentMethod === method.id &&
                              method.available && (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>

              <CardFooter className="pt-6">
                <Button
                  className="w-full h-12 font-medium"
                  onClick={() =>
                    handleCheckout(plan._id, plan.type, validPromo?.code)
                  }
                  disabled={
                    isProcessing ||
                    !paymentMethods.find((m) => m.id === selectedPaymentMethod)
                      ?.available
                  }
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay with{" "}
                      {
                        paymentMethods.find(
                          (m) => m.id === selectedPaymentMethod
                        )?.name
                      }
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
