"use client";

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import {
  Check,
  Sparkles,
  Shield,
  Zap,
  AlertCircle,
  XCircle,
  ArrowRight,
  Download,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Banner } from "@/components/main/banner";
import { useAllPricing } from "@/services/queries/pricing";
import { creditFeatures, premiumFeatures } from "./features";

interface FaqItem {
  question: string;
  answer: string;
}

const freeFeatures = [
  "50 free credits upon signup",
  "Requires your own Gemini API key",
  "Limited to 25 files per day",
];

const PricingContent = () => {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const { data: pricingData, isLoading } = useAllPricing();

  const subscriptionPlans =
    (pricingData?.success && pricingData?.data?.subscriptionPlans) || [];
  const creditPlans =
    (pricingData?.success && pricingData?.data?.creditPlans) || [];

  useEffect(() => {
    if (searchParams) {
      const message = searchParams.get("message");
      if (message) {
        setErrorMessage(decodeURIComponent(message));
      }
    }
  }, [searchParams]);

  const faqItems: FaqItem[] = [
    {
      question: "How does the free plan work?",
      answer:
        "The free plan gives you access to basic AI image processing with a limit of 25 images per day. You can process images, generate basic metadata, and export results with standard features. Perfect for trying out our platform before committing to a paid plan.",
    },
    {
      question: "Can I upgrade from free to premium anytime?",
      answer:
        "Yes, you can upgrade from the free plan to any premium plan at any time. Your account will be upgraded immediately and you'll have access to all premium features. You can also switch between subscription and credit plans as needed.",
    },
    {
      question: "Do I need my own API key?",
      answer:
        "For subscription plans, you can use your own Gemini API key for unlimited processing. Credit plans include built-in API access, so no external API key is required. This makes credit plans perfect for users who want a hassle-free experience.",
    },
    {
      question: "What file formats are supported?",
      answer:
        "We support JPG, JPEG, PNG, EPS, MP4, and MOV formats. Our AI can process images of various sizes and generate comprehensive metadata including titles, descriptions, keywords, and alt text for better SEO and accessibility.",
    },
  ];

  const handlePurchase = (id: string, type: string) => {
    router.push(`/cart?planId=${id}&planType=${type}`);
  };

  const handleDownloadFree = () => {
    router.push("/signup?plan=free");
  };

  const calculateDiscountedPrice = (
    basePrice: number,
    discountPercent: number,
  ) => {
    return Math.round(basePrice * (1 - discountPercent / 100));
  };

  const activeCreditPlans = creditPlans
    .filter((plan) => plan.isActive)
    .sort((a, b) => a.credit - b.credit);

  const activeSubscriptionPlans = subscriptionPlans
    .filter((plan) => plan.isActive)
    .sort((a, b) => a.planDuration - b.planDuration);

  const FreePlanCard = ({ className }: { className?: string }) => (
    <Card
      className={`flex flex-col border-2 transition-all hover:shadow-lg hover:border-primary/20 bg-card ${className}`}
    >
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-xl font-semibold">Free</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Forever
          </Badge>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold tracking-tight">৳0</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Perfect for getting started
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="space-y-3">
          {freeFeatures.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary/10 p-0.5">
                <Check className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-6">
        <Button
          variant="outline"
          className="w-full h-11 font-medium"
          onClick={handleDownloadFree}
        >
          Get Started
        </Button>
      </CardFooter>
    </Card>
  );

  if (isLoading) {
    return <PricingLoading />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Referral Notice */}
      <div className="container mx-auto px-4 pt-20">
        <div className="mx-auto max-w-4xl">
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-400">
              Please note: Our referral program is temporarily unavailable due
              to technical maintenance. We appreciate your patience and will
              notify you once it's back online.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10" />
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-6 text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Simple, transparent pricing
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Choose the <span className="text-primary">Perfect Plan</span>
              <br className="hidden sm:inline" />
              for Your Workflow
            </h1>

            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Transform your image metadata workflow with our AI-powered
              platform. Start free and scale as your needs grow.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="container mx-auto px-4 mb-8">
          <div className="mx-auto max-w-2xl">
            <Alert variant="destructive" className="relative">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="pr-8">
                {errorMessage}
              </AlertDescription>
              <button
                onClick={() => setErrorMessage(null)}
                className="absolute right-3 top-3 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Close"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </Alert>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-20" id="premium">
        <div className="max-w-7xl mx-auto">
          <div
            className={`grid gap-6 ${
              activeSubscriptionPlans.length + activeCreditPlans.length === 1
                ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
                : activeSubscriptionPlans.length + activeCreditPlans.length ===
                    2
                  ? "grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            <FreePlanCard />
            {activeCreditPlans.map((plan) => {
              const displayPrice = plan.discountPrice
                ? plan.discountPrice
                : calculateDiscountedPrice(
                    plan.basePrice,
                    plan.discountPercent,
                  );

              const durationText =
                plan.planDuration === 30
                  ? "Monthly"
                  : plan.planDuration === 91
                    ? "91 Days"
                    : plan.planDuration === 182
                      ? "Half-Yearly"
                      : plan.planDuration === 365
                        ? "Yearly"
                        : `${plan.planDuration} days`;

              const imageCount = (plan.credit * 5).toLocaleString();
              const videoCount = plan.credit.toLocaleString();

              return (
                <Card
                  key={plan._id}
                  className="flex flex-col relative border-2 transition-all hover:shadow-lg hover:border-primary/20 bg-card"
                >
                  <Badge className="absolute right-4 top-4 bg-primary">
                    No API Key
                  </Badge>

                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-xl font-semibold">
                        {plan.name}
                      </CardTitle>
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold tracking-tight">
                          ৳{displayPrice}
                        </span>
                        {plan.discountPercent > 0 && (
                          <span className="text-xl text-muted-foreground line-through">
                            ৳{plan.basePrice}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {plan.credit.toLocaleString()} credits • {durationText}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pt-0">
                    <div className="bg-primary/5 rounded-lg p-4 mb-6 border border-primary/10">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        Processing capacity:
                      </p>
                      <p className="text-sm font-medium">
                        {imageCount} images or {videoCount} videos
                      </p>
                    </div>

                    <div className="space-y-3">
                      {creditFeatures.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-start gap-3"
                        >
                          <div className="mt-0.5 rounded-full bg-primary/10 p-0.5">
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm leading-relaxed">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-6">
                    <Button
                      className="w-full h-11 font-medium"
                      onClick={() => handlePurchase(plan._id, "credit")}
                    >
                      Purchase Credits
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
            {activeSubscriptionPlans.map((plan) => {
              const displayPrice = plan.discountPrice
                ? plan.discountPrice
                : calculateDiscountedPrice(
                    plan.basePrice,
                    plan.discountPercent,
                  );

              const durationText =
                plan.planDuration === 30
                  ? "per month"
                  : plan.planDuration === 365
                    ? "per year"
                    : plan.planDuration === 7
                      ? "per week"
                      : `per ${plan.planDuration} days`;

              return (
                <Card
                  key={plan._id}
                  className="flex flex-col relative border-2 transition-all hover:shadow-lg hover:border-primary/20 bg-card"
                >
                  {plan.discountPercent > 0 && (
                    <Badge className="absolute right-4 top-4 bg-green-600">
                      Save {plan.discountPercent}%
                    </Badge>
                  )}

                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-xl font-semibold">
                        {plan.name}
                      </CardTitle>
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold tracking-tight">
                          ৳{displayPrice}
                        </span>
                        {plan.discountPercent > 0 && (
                          <span className="text-xl text-muted-foreground line-through">
                            ৳{plan.basePrice}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {durationText}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pt-0">
                    <div className="space-y-3">
                      {premiumFeatures.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-start gap-3"
                        >
                          <div className="mt-0.5 rounded-full bg-primary/10 p-0.5">
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm leading-relaxed">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-6">
                    <Button
                      className="w-full h-11 font-medium"
                      onClick={() => handlePurchase(plan._id, "subscription")}
                    >
                      Choose Plan
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* No Plans Available */}
        {activeCreditPlans.length === 0 &&
          activeSubscriptionPlans.length === 0 && (
            <div className="text-center py-12">
              <FreePlanCard className="max-w-md mx-auto" />
            </div>
          )}
      </div>

      {/* Features Section */}
      <div className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Powerful AI-Driven Experience
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to streamline your image metadata workflow
              </p>
            </div>

            <div className="mb-12">
              <Banner />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="group rounded-xl bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 border">
                <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Powerful AI</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Process images with state-of-the-art AI technology for
                  accurate and fast results. Generate metadata that improves
                  discoverability.
                </p>
              </div>

              <div className="group rounded-xl bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 border">
                <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">
                  Secure Processing
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your data is processed securely with enterprise-grade
                  encryption. We never store your images or personal data.
                </p>
              </div>

              <div className="group rounded-xl bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 border">
                <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">
                  Advanced Workflow
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Streamline your image processing with batch operations, custom
                  metadata editing, and flexible export options for any project.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about our pricing plans
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-lg px-6 bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-medium">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl rounded-2xl bg-primary/5 p-8 md:p-12 border border-primary/10">
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Start Free Today
              </Badge>
              <h2 className="mb-4 text-3xl md:text-4xl font-bold tracking-tight">
                Ready to transform your workflow?
              </h2>
              <p className="mb-8 text-muted-foreground max-w-2xl mx-auto">
                Join thousands of professionals who use our AI-powered platform
                to streamline their image metadata workflow. Start free and
                upgrade when you need more.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 h-11 font-medium"
                  asChild
                >
                  <a href="#premium">
                    Get Premium
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-8 h-11 font-medium"
                  onClick={handleDownloadFree}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Start Free
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton components for loading states
const PricingCardSkeleton = () => (
  <Card className="flex flex-col relative overflow-hidden">
    <CardHeader className="pb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
        <div className="h-5 w-16 bg-muted rounded animate-pulse" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-12 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3 flex-1 pt-0">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
          <div className="h-4 flex-1 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </CardContent>
    <CardFooter className="pt-6">
      <div className="h-11 w-full bg-muted rounded animate-pulse" />
    </CardFooter>
  </Card>
);

const HeroSkeleton = () => (
  <div className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background -z-10" />
    <div className="container mx-auto px-4">
      <div className="flex flex-col items-center justify-center space-y-6 text-center max-w-4xl mx-auto">
        <div className="h-8 w-64 bg-muted rounded-full animate-pulse" />
        <div className="space-y-4">
          <div className="h-14 w-96 bg-muted rounded animate-pulse mx-auto" />
          <div className="h-14 w-80 bg-muted rounded animate-pulse mx-auto" />
        </div>
        <div className="h-6 w-[500px] bg-muted rounded animate-pulse" />
      </div>
    </div>
  </div>
);

const PricingLoading = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSkeleton />
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <PricingCardSkeleton />
          <PricingCardSkeleton />
          <PricingCardSkeleton />
        </div>
      </div>
      <div className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="h-8 w-64 bg-muted rounded animate-pulse mx-auto mb-8" />
            <div className="h-64 w-full bg-muted rounded-lg animate-pulse mb-12" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-card p-6 shadow-sm border"
                >
                  <div className="h-12 w-12 bg-muted rounded-full animate-pulse mb-4" />
                  <div className="h-6 w-32 bg-muted rounded animate-pulse mb-2" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PricingPage = () => {
  return (
    <Suspense fallback={<PricingLoading />}>
      <PricingContent />
    </Suspense>
  );
};

export default PricingPage;
