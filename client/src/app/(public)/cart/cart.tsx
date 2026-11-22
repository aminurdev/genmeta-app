"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Coins,
  CreditCard,
  Infinity as InfinityIcon,
  Loader2,
  Lock,
  Receipt,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { PricingPlan } from "@/services/admin-dashboard";
import { getCurrentUser } from "@/services/auth-services";
import { createPayment, validPromoCode } from "@/services/pricing";
import { useAllPricing } from "@/services/queries/pricing";
import type { PromoCodeRes } from "@/types/pricing";
import { creditFeatures, premiumFeatures } from "../pricing/features";
import { CartSkeleton } from "./loading";

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  channels: string[];
  logo: string;
  available: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "paystation",
    name: "PayStation",
    description: "Pay securely via mobile banking or card",
    channels: ["bKash", "Nagad", "Rocket", "Cards"],
    logo: "/paystation-logo.png",
    available: true,
  },
];

const roundBdt = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const generateIdempotencyKey = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

function getEffectivePlanPrice(plan: PricingPlan): number {
  if (plan.discountPrice !== undefined && plan.discountPrice > 0) {
    return roundBdt(plan.discountPrice);
  }
  if (plan.discountPercent > 0) {
    return roundBdt(plan.basePrice * (1 - plan.discountPercent / 100));
  }
  return roundBdt(plan.basePrice);
}

function getDurationLabel(days: number): string {
  if (days === 7) return "7 days";
  if (days === 30) return "30 days (Monthly)";
  if (days === 90 || days === 91) return `${days} days (Quarterly)`;
  if (days === 180 || days === 182) return `${days} days (Half-yearly)`;
  if (days === 365) return "365 days (Annual)";
  return `${days} days`;
}

export default function Cart({ planId }: { planId?: string }) {
  const router = useRouter();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("paystation");
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    generateIdempotencyKey(),
  );
  const [logoError, setLogoError] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [validPromo, setValidPromo] = useState<PromoCodeRes | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isPromoOpen, setIsPromoOpen] = useState(false);

  // Submission state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    data: pricingData,
    isLoading: isPricingLoading,
    isError: isPricingError,
    refetch: refetchPricing,
  } = useAllPricing();

  const { creditPlans, subscriptionPlans, activePlan, planNotFound } =
    useMemo(() => {
      const payload = pricingData?.success ? pricingData.data : undefined;
      const credits = (payload?.creditPlans ?? []) as unknown as PricingPlan[];
      const subs = (payload?.subscriptionPlans ?? []) as unknown as PricingPlan[];
      const allPlans = [...credits, ...subs];

      const explicitId = selectedPlanId ?? planId;
      let resolved: PricingPlan | null = null;
      let notFound = false;

      if (explicitId) {
        const match = allPlans.find((p) => p._id === explicitId);
        if (match) {
          resolved = match;
        } else if (allPlans.length > 0 && !selectedPlanId && planId) {
          notFound = true;
        }
      } else {
        resolved = credits[0] ?? subs[0] ?? null;
      }

      return {
        creditPlans: credits,
        subscriptionPlans: subs,
        activePlan: resolved,
        planNotFound: notFound,
      };
    }, [pricingData, planId, selectedPlanId]);

  const handlePlanChange = (nextPlanId: string) => {
    setSelectedPlanId(nextPlanId);
    setValidPromo(null);
    setPromoCode("");
    setPromoError(null);
    setIdempotencyKey(generateIdempotencyKey());
  };

  const handleApplyPromoCode = async () => {
    const cleanedCode = promoCode.trim().toUpperCase();
    if (!cleanedCode) {
      setPromoError("Please enter a promo code");
      return;
    }
    if (!activePlan) return;

    setPromoError(null);
    setIsApplyingPromo(true);

    try {
      const res = await validPromoCode(cleanedCode, activePlan.type);

      if (!res.success || !res.data?.promoCode) {
        setPromoError(
          !res.success ? res.message || "Invalid promo code" : "Invalid promo code",
        );
        setValidPromo(null);
        return;
      }

      const promo = res.data.promoCode;

      if (promo.appliesTo !== "both" && promo.appliesTo !== activePlan.type) {
        setPromoError(
          `This promo code only applies to ${promo.appliesTo} plans`,
        );
        setValidPromo(null);
        return;
      }

      if (promo.validUntil && new Date(promo.validUntil) < new Date()) {
        setPromoError("This promo code has expired");
        setValidPromo(null);
        return;
      }

      setValidPromo(res.data);
      setPromoCode(promo.code);
      setIdempotencyKey(generateIdempotencyKey());
      toast.success(
        `Promo code applied: ${promo.discountPercent}% additional discount`,
      );
    } catch {
      setPromoError("Unable to validate promo code right now");
      setValidPromo(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleClearPromoCode = () => {
    setPromoCode("");
    setValidPromo(null);
    setPromoError(null);
    setIdempotencyKey(generateIdempotencyKey());
  };

  const handleCheckout = async () => {
    if (!activePlan || isProcessing || isRedirecting) return;

    try {
      const user = await getCurrentUser();
      if (!user) {
        const redirectTarget = `/cart?planId=${encodeURIComponent(activePlan._id)}`;
        router.push(
          `/login?redirectPath=${encodeURIComponent(redirectTarget)}`,
        );
        return;
      }

      setIsProcessing(true);

      const res = await createPayment({
        planId: activePlan._id,
        type: activePlan.type,
        promoCode: validPromo?.promoCode.code,
        paymentMethod: selectedPaymentMethod,
        idempotencyKey,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to initiate payment");
      }

      if (res.data?.paymentUrl) {
        setIsRedirecting(true);
        window.location.href = res.data.paymentUrl;
        return;
      }

      throw new Error("Payment URL not received from payment gateway");
    } catch (err) {
      setIdempotencyKey(generateIdempotencyKey());
      toast.error(
        err instanceof Error ? err.message : "Payment processing failed",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isPricingLoading && !pricingData) {
    return <CartSkeleton />;
  }

  const apiFailed =
    isPricingError || (pricingData !== undefined && !pricingData.success);

  if (apiFailed || planNotFound || !activePlan) {
    const fallbackPlan = creditPlans[0] ?? subscriptionPlans[0] ?? null;

    return (
      <div className="min-h-screen bg-background">
        <MaxWidthWrapper className="py-20 sm:py-24">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8 space-y-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {planNotFound
                    ? "Selected plan unavailable"
                    : "Unable to load checkout"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {planNotFound
                    ? "The requested plan could not be found or is no longer active."
                    : "Failed to load pricing plans. Please try again."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-1">
                {planNotFound && fallbackPlan && (
                  <Button
                    type="button"
                    onClick={() => handlePlanChange(fallbackPlan._id)}
                  >
                    Select {fallbackPlan.name}
                  </Button>
                )}
                {apiFailed && (
                  <Button type="button" onClick={() => refetchPricing()}>
                    Try Again
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/pricing")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        </MaxWidthWrapper>
      </div>
    );
  }

  // Price calculation aligned with server payment.service calculateOrderPricing
  const basePrice = roundBdt(activePlan.basePrice);
  const priceAfterPlanDiscount = getEffectivePlanPrice(activePlan);
  const planDiscountAmount = roundBdt(
    Math.max(0, basePrice - priceAfterPlanDiscount),
  );
  const promoDiscountAmount = validPromo
    ? roundBdt(
        (priceAfterPlanDiscount * validPromo.promoCode.discountPercent) / 100,
      )
    : 0;
  const finalPrice = Math.max(
    1,
    roundBdt(priceAfterPlanDiscount - promoDiscountAmount),
  );
  const totalSavings = roundBdt(Math.max(0, basePrice - finalPrice));

  const isCredit = activePlan.type === "credit";
  const featuresList = isCredit ? creditFeatures : premiumFeatures;
  const activePaymentMethod = PAYMENT_METHODS.find(
    (m) => m.id === selectedPaymentMethod,
  );

  return (
    <div className="min-h-screen bg-background">
      <MaxWidthWrapper className="py-8 sm:py-12 space-y-8">
        {/* Top Bar */}
        <div className="space-y-4 border-b pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2.5 text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Link href="/pricing">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Pricing</span>
              </Link>
            </Button>

            <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>256-bit Encrypted Checkout</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Complete your purchase
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review your plan, apply an optional promo code, and pay securely
              via PayStation.
            </p>
          </div>
        </div>

        {/* Main 2-Column Checkout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Plan Configuration & Payment Method */}
          <div className="lg:col-span-7 space-y-6">
            {/* Selected Plan Card */}
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Selected Plan
                    </CardTitle>
                    <CardDescription>
                      Switch plans anytime before proceeding to payment
                    </CardDescription>
                  </div>
                </div>

                {/* Plan Switcher */}
                <Select
                  value={activePlan._id}
                  onValueChange={handlePlanChange}
                  disabled={isProcessing || isRedirecting}
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditPlans.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Credit Packs (No API key needed)</SelectLabel>
                        {creditPlans.map((option) => (
                          <SelectItem key={option._id} value={option._id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.name}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                ৳{getEffectivePlanPrice(option).toLocaleString()}
                                {" · "}
                                {(option.credit ?? 0).toLocaleString()} credits
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}

                    {subscriptionPlans.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>
                          Subscription Plans (Unlimited with your key)
                        </SelectLabel>
                        {subscriptionPlans.map((option) => (
                          <SelectItem key={option._id} value={option._id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.name}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                ৳{getEffectivePlanPrice(option).toLocaleString()}
                                {" / "}
                                {option.planDuration === 30
                                  ? "month"
                                  : option.planDuration === 365
                                    ? "year"
                                    : `${option.planDuration} days`}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Highlighted Plan Box */}
                <div className="rounded-xl border bg-muted/30 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 font-medium",
                          isCredit
                            ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400"
                            : "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400",
                        )}
                      >
                        {isCredit ? (
                          <Coins className="h-3 w-3" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        {isCredit ? "Credit Pack" : "Subscription"}
                      </Badge>

                      <Badge variant="secondary" className="gap-1 font-normal">
                        <Calendar className="h-3 w-3" />
                        {getDurationLabel(activePlan.planDuration)}
                      </Badge>
                    </div>

                    {planDiscountAmount > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                      >
                        Save ৳{planDiscountAmount.toLocaleString()}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                        {activePlan.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {isCredit
                          ? `${((activePlan.credit ?? 0) * 5).toLocaleString()} images or ${(activePlan.credit ?? 0).toLocaleString()} videos across ${activePlan.planDuration} days`
                          : `Unlimited metadata generation for ${activePlan.planDuration} days`}
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0 tabular-nums">
                      <div className="text-2xl font-bold">
                        ৳{priceAfterPlanDiscount.toLocaleString()}
                      </div>
                      {planDiscountAmount > 0 && (
                        <div className="text-xs text-muted-foreground line-through">
                          ৳{basePrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {isCredit ? (
                    <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
                      <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        Includes{" "}
                        <strong className="text-foreground font-semibold">
                          {(activePlan.credit ?? 0).toLocaleString()} credits
                        </strong>{" "}
                        with built-in API access
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
                      <InfinityIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>
                        <strong className="text-foreground font-semibold">
                          Unlimited generation
                        </strong>{" "}
                        using your own Gemini API key
                      </span>
                    </div>
                  )}
                </div>

                {/* Included Features */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    What&apos;s included
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {featuresList.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-foreground/90"
                      >
                        <div className="mt-0.5 h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Select your preferred payment gateway
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                >
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedPaymentMethod === method.id;
                    return (
                      <Label
                        key={method.id}
                        htmlFor={method.id}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border-2 transition-colors cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/40",
                        )}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <div className="w-11 h-11 rounded-lg bg-background border flex items-center justify-center shrink-0 overflow-hidden">
                            {logoError ? (
                              <CreditCard className="h-5 w-5 text-primary" />
                            ) : (
                              <Image
                                src={method.logo}
                                alt={method.name}
                                width={32}
                                height={32}
                                className="w-8 h-8 object-contain"
                                onError={() => setLogoError(true)}
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground">
                              {method.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {method.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end pl-7 sm:pl-0">
                          {method.channels.map((ch) => (
                            <span
                              key={ch}
                              className="px-2 py-0.5 text-[11px] font-medium rounded-md border bg-background text-muted-foreground"
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      </Label>
                    );
                  })}
                </RadioGroup>

                {/* Trust Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <Zap className="h-3.5 w-3.5 text-foreground shrink-0" />
                    <span>Instant plan activation</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-foreground shrink-0" />
                    <span>Verified by PayStation</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <Receipt className="h-3.5 w-3.5 text-foreground shrink-0" />
                    <span>Email invoice receipt</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Sticky Order Summary */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold">
                    Order Summary
                  </CardTitle>
                  <CardDescription>
                    Authoritative pricing in BDT
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Promo Code Section */}
                  <Collapsible
                    open={isPromoOpen || Boolean(validPromo)}
                    onOpenChange={setIsPromoOpen}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
                        >
                          <Tag className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          <span>Have a promo code?</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              (isPromoOpen || Boolean(validPromo)) &&
                                "rotate-180",
                            )}
                          />
                        </button>
                      </CollapsibleTrigger>

                      {validPromo && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 text-[11px]"
                        >
                          Applied
                        </Badge>
                      )}
                    </div>

                    <CollapsibleContent className="space-y-2.5 pt-1">
                      {validPromo ? (
                        <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/40">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-mono font-semibold text-sm truncate">
                                {validPromo.promoCode.code}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {validPromo.promoCode.discountPercent}% promo
                                discount applied
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={handleClearPromoCode}
                            aria-label="Remove promo code"
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
                            disabled={isApplyingPromo || isProcessing || isRedirecting}
                            className="font-mono text-sm uppercase"
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            disabled={
                              isApplyingPromo ||
                              !promoCode.trim() ||
                              isProcessing ||
                              isRedirecting
                            }
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
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span className="flex-1">{promoError}</span>
                          <button
                            type="button"
                            onClick={() => setPromoError(null)}
                            aria-label="Dismiss promo error"
                            className="shrink-0 hover:opacity-80"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator />

                  {/* Price Line Items */}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground truncate">
                        {activePlan.name}
                      </span>
                      <span className="font-medium tabular-nums shrink-0">
                        ৳{basePrice.toFixed(2)}
                      </span>
                    </div>

                    {planDiscountAmount > 0 && (
                      <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400">
                        <span>
                          Plan discount
                          {activePlan.discountPercent > 0
                            ? ` (${activePlan.discountPercent}%)`
                            : ""}
                        </span>
                        <span className="tabular-nums shrink-0">
                          -৳{planDiscountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {validPromo && promoDiscountAmount > 0 && (
                      <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400">
                        <span>
                          Promo {validPromo.promoCode.code} (
                          {validPromo.promoCode.discountPercent}%)
                        </span>
                        <span className="tabular-nums shrink-0">
                          -৳{promoDiscountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Final Total */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-base">
                        Total Due
                      </span>
                      <div className="text-right tabular-nums">
                        <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                          ৳{finalPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          BDT
                        </span>
                      </div>
                    </div>

                    {totalSavings > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
                        You save ৳{totalSavings.toFixed(2)} on this order
                      </p>
                    )}
                  </div>

                  {/* Checkout CTA */}
                  <Button
                    type="button"
                    size="lg"
                    className="w-full h-12 font-semibold gap-2"
                    onClick={handleCheckout}
                    disabled={
                      isProcessing ||
                      isRedirecting ||
                      !activePaymentMethod?.available
                    }
                  >
                    {isRedirecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Redirecting to PayStation...</span>
                      </>
                    ) : isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Preparing Checkout...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>
                          Pay ৳{finalPrice.toLocaleString()} with PayStation
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                    By continuing, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="underline hover:text-foreground"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/refund-policy"
                      className="underline hover:text-foreground"
                    >
                      Refund Policy
                    </Link>
                    .
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
