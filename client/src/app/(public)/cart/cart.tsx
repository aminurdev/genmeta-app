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
  ChevronUp,
  Shield,
  CreditCard,
  Percent,
  Clock,
  Star,
  Gift,
  Check,
} from "lucide-react";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { fetchPricingPlanById, type PricingPlan } from "@/lib/actions";
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
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  getAccessToken,
  getCurrentUser,
  getBaseApi,
} from "@/services/auth-services";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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

  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("bkash");

  // Promo code states
  const [promoCode, setPromoCode] = useState<string>("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [validPromo, setValidPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isPromoExpanded, setIsPromoExpanded] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20">
        <MaxWidthWrapper className="py-24">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-800 rounded-full animate-spin border-t-violet-600 dark:border-t-violet-400"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-violet-400"></div>
            </div>
            <p className="mt-6 text-lg text-muted-foreground font-medium">
              Loading your cart...
            </p>
            <p className="text-sm text-muted-foreground">
              Please wait while we prepare your order
            </p>
          </div>
        </MaxWidthWrapper>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20">
        <MaxWidthWrapper className="py-24">
          <div className="max-w-2xl mx-auto">
            <Alert
              variant="destructive"
              className="mb-8 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
            >
              <AlertTitle className="flex items-center gap-2">
                <X className="h-5 w-5" />
                Something went wrong
              </AlertTitle>
              <AlertDescription className="mt-2 text-base">
                {error ||
                  "Could not load plan details. Please try again or contact support."}
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleBackToPricing}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Pricing
            </Button>
          </div>
        </MaxWidthWrapper>
      </div>
    );
  }

  // Calculate the price with plan discount
  const priceAfterPlanDiscount =
    plan.discountPercent > 0
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20">
      <MaxWidthWrapper className="py-12">
        {/* Header */}
        <div className="mb-12">
          <Button
            variant="ghost"
            onClick={handleBackToPricing}
            className="mb-6 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing
          </Button>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-4">
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
          <div className="lg:col-span-7">
            {/* Plan Details */}
            <Card className="shadow-sm border-0 bg-white/80 dark:bg-background/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground mb-2">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {plan.type === "subscription"
                        ? `${plan.planDuration} days of unlimited access`
                        : `${plan.credit} AI-powered metadata generations`}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 font-medium ${
                      plan.type === "subscription"
                        ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/50 dark:text-violet-300"
                        : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300"
                    }`}
                  >
                    {plan.type === "subscription" ? "Subscription" : "Credits"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                      <Star className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Premium Features
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Full access included
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Secure Payment
                      </p>
                      <p className="text-sm text-muted-foreground">
                        256-bit encryption
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Instant Access
                      </p>
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
            <Card className="shadow-sm border-0 bg-white/80 dark:bg-background/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsPromoExpanded(!isPromoExpanded)}
                  className="w-full justify-between p-0 h-auto hover:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center">
                      <Gift className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg">
                        Have a Promo Code?
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {validPromo
                          ? `${validPromo.discountPercent}% discount applied`
                          : "Get additional savings"}
                      </CardDescription>
                    </div>
                  </div>
                  {isPromoExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </CardHeader>
              {isPromoExpanded && (
                <CardContent className="pt-0">
                  {validPromo ? (
                    <div className="flex items-center justify-between p-4 border-2 border-green-200 rounded-xl bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-800 dark:text-green-300">
                            {validPromo.code}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            {validPromo.discountPercent}% discount applied
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearPromoCode}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
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
                        className="flex gap-2"
                      >
                        <div className="flex-1">
                          <Input
                            placeholder="Enter promo code"
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value.toUpperCase());
                              if (promoError) setPromoError(null);
                            }}
                            className="h-12 bg-muted/40 border-muted-foreground/20 focus:border-violet-500 focus:ring-violet-500/20 focus-visible:ring-0"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={isApplyingPromo || !promoCode.trim()}
                          className="h-12 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                        >
                          {isApplyingPromo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </form>
                      {promoError && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                          <X className="h-4 w-4 text-red-500" />
                          <p className="text-red-600 dark:text-red-400 text-sm">
                            {promoError}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Order Summary */}
            <Card className="shadow-sm border-0 bg-white/80 dark:bg-background/80 backdrop-blur-sm sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
                <CardDescription>Review your purchase details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.type === "subscription"
                          ? `${plan.planDuration} days subscription`
                          : `${plan.credit} credits`}
                      </p>
                    </div>
                    <p
                      className={`font-medium ${
                        plan.discountPercent > 0
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      ৳{plan.basePrice.toFixed(2)}
                    </p>
                  </div>

                  {plan.discountPercent > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-green-600" />
                        <span className="text-sm">
                          Plan Discount ({plan.discountPercent}%)
                        </span>
                      </div>
                      <span className="text-green-600 font-medium">
                        -৳{(plan.basePrice - priceAfterPlanDiscount).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {validPromo && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-violet-600" />
                        <span className="text-sm">
                          Promo Discount ({validPromo.discountPercent}%)
                        </span>
                      </div>
                      <span className="text-violet-600 font-medium">
                        -৳{(priceAfterPlanDiscount - finalPrice).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-lg font-semibold flex-1">Total</span>
                    {totalSavings > 0 && (
                      <div className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 px-3 py-1"
                        >
                          You save ৳{totalSavings.toFixed(2)}
                        </Badge>
                      </div>
                    )}{" "}
                    <span className="text-2xl font-bold text-foreground">
                      ৳{finalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>

              {/* Payment Method Selection */}
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-5 w-5 text-violet-600" />
                    <h3 className="font-semibold text-foreground">
                      Payment Method
                    </h3>
                  </div>
                  <RadioGroup
                    value={selectedPaymentMethod}
                    onValueChange={setSelectedPaymentMethod}
                  >
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="relative">
                        <div
                          className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                            selectedPaymentMethod === method.id
                              ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                              : "border-muted-foreground/20 hover:border-muted-foreground/40"
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
                            className="data-[state=checked]:border-violet-500 data-[state=checked]:text-violet-500"
                          />
                          <Label
                            htmlFor={method.id}
                            className={`flex items-center gap-3 flex-1 ${
                              !method.available
                                ? "cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                          >
                            <div className="w-12 h-12 rounded-lg bg-white dark:bg-background shadow-sm flex items-center justify-center">
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
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">
                                  {method.name}
                                </p>
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
                                <Check className="h-5 w-5 text-violet-600" />
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
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-violet-500/20 transition-all duration-200 group"
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
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pay with{" "}
                      {
                        paymentMethods.find(
                          (m) => m.id === selectedPaymentMethod
                        )?.name
                      }
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
