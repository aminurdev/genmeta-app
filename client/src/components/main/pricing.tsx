"use client";

import type React from "react";

import { useState, useEffect, Suspense } from "react";
import {
  Check,
  Sparkles,
  Shield,
  Zap,
  Edit,
  FileText,
  Clock,
  X,
  Laptop,
  AlertCircle,
  XCircle,
  ArrowRight,
  Download,
  Star,
  Infinity,
  BarChart3,
  ImageIcon,
  Repeat,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getBaseApi } from "@/services/image-services";

// Define types for better type safety
type BillingCycle = "monthly" | "yearly" | "quarterly";

interface SubscriptionPlan {
  _id: string;
  name: string;
  basePrice: number;
  discountPercent: number;
  isActive: boolean;
  billingCycle: BillingCycle;
  createdAt: string;
  updatedAt: string;
}

interface CreditPlan {
  _id: string;
  name: string;
  basePrice: number;
  discountPercent: number;
  isActive: boolean;
  credit: number;
  createdAt: string;
  updatedAt: string;
}

interface PricingData {
  subscriptionPlans: SubscriptionPlan[];
  creditPlans: CreditPlan[];
}

interface PricingResponse {
  success: boolean;
  message: string;
  data: PricingData;
}

interface ProcessedPricingData {
  monthly: {
    _id?: string;
    originalPrice: number;
    discount: number;
    discountedPrice: number;
    totalPrice: number;
  };
  yearly: {
    _id?: string;
    originalPrice: number;
    discount: number;
    discountedPrice: number;
    billingLabel: string;
    totalPrice: number;
    totalSavings: number;
  };
}

interface Feature {
  name: string;
  free: string;
  premium: string;
  freeIcon: React.ReactNode;
  premiumIcon: React.ReactNode;
  highlight: boolean;
}

interface FaqItem {
  question: string;
  answer: string;
}

// Component that uses useSearchParams, to be wrapped in Suspense
const PricingContent = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // State for pricing data
  const [pricingData, setPricingData] = useState<ProcessedPricingData>({
    monthly: {
      originalPrice: 500,
      discount: 50,
      discountedPrice: 250,
      totalPrice: 250,
    },
    yearly: {
      originalPrice: 6000,
      discount: 55,
      discountedPrice: 225,
      billingLabel: "per month, billed annually",
      totalPrice: 2700,
      totalSavings: 3300,
    },
  });
  const [creditPlans, setCreditPlans] = useState<CreditPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Parse error message from URL if present
  useEffect(() => {
    if (searchParams) {
      const message = searchParams.get("message");
      if (message) {
        setErrorMessage(decodeURIComponent(message));
      }
    }
  }, [searchParams]);

  // Fetch pricing data
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setIsLoading(true);
        const baseApi = await getBaseApi();
        const response = await fetch(`${baseApi}/plans/pricing-data`);
        const result = (await response.json()) as PricingResponse;

        if (result.success && result.data) {
          const { subscriptionPlans, creditPlans } = result.data;

          // Process subscription plans
          const monthlyPlan = subscriptionPlans.find(
            (plan) => plan.billingCycle === "monthly"
          );
          const yearlyPlan = subscriptionPlans.find(
            (plan) => plan.billingCycle === "yearly"
          );

          if (monthlyPlan && yearlyPlan) {
            const newPricingData: ProcessedPricingData = {
              monthly: {
                _id: monthlyPlan._id,
                originalPrice: monthlyPlan.basePrice,
                discount: monthlyPlan.discountPercent,
                discountedPrice: Math.round(
                  monthlyPlan.basePrice *
                    (1 - monthlyPlan.discountPercent / 100)
                ),
                totalPrice: Math.round(
                  monthlyPlan.basePrice *
                    (1 - monthlyPlan.discountPercent / 100)
                ),
              },
              yearly: {
                _id: yearlyPlan._id,
                originalPrice: yearlyPlan.basePrice,
                discount: yearlyPlan.discountPercent,
                discountedPrice: Math.round(
                  (yearlyPlan.basePrice *
                    (1 - yearlyPlan.discountPercent / 100)) /
                    12
                ),
                billingLabel: "per month, billed annually",
                totalPrice: Math.round(
                  yearlyPlan.basePrice * (1 - yearlyPlan.discountPercent / 100)
                ),
                totalSavings: Math.round(
                  yearlyPlan.basePrice -
                    yearlyPlan.basePrice *
                      (1 - yearlyPlan.discountPercent / 100)
                ),
              },
            };

            setPricingData(newPricingData);
          }

          // Store credit plans
          setCreditPlans(creditPlans);
        }
      } catch (error) {
        console.error("Error fetching pricing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricingData();
  }, []);

  // Plan features with improved organization and clarity
  const features: Feature[] = [
    {
      name: "Batch Processing",
      free: "Limited (5 per batch)",
      premium: "Unlimited",
      freeIcon: <X className="h-4 w-4" />,
      premiumIcon: <Infinity className="h-4 w-4" />,
      highlight: true,
    },
    {
      name: "Trial Period",
      free: "3 days",
      premium: "Lifetime access",
      freeIcon: <Clock className="h-4 w-4" />,
      premiumIcon: <Check className="h-4 w-4" />,
      highlight: false,
    },
    {
      name: "Gemini API Integration",
      free: "Own API key required",
      premium: "Own API key required",
      freeIcon: <Zap className="h-4 w-4" />,
      premiumIcon: <Zap className="h-4 w-4" />,
      highlight: false,
    },
    {
      name: "Results Generation",
      free: "Limited",
      premium: "Unlimited",
      freeIcon: <X className="h-4 w-4" />,
      premiumIcon: <Infinity className="h-4 w-4" />,
      highlight: true,
    },
    {
      name: "Supported Formats",
      free: "JPG, PNG",
      premium: "JPG, PNG",
      freeIcon: <ImageIcon className="h-4 w-4" />,
      premiumIcon: <ImageIcon className="h-4 w-4" />,
      highlight: false,
    },
    {
      name: "Metadata Editing",
      free: "Basic",
      premium: "Advanced",
      freeIcon: <Edit className="h-4 w-4" />,
      premiumIcon: <Edit className="h-4 w-4" />,
      highlight: false,
    },
    {
      name: "Custom Keyword Ordering",
      free: "Basic",
      premium: "Advanced",
      freeIcon: <Edit className="h-4 w-4" />,
      premiumIcon: <Edit className="h-4 w-4" />,
      highlight: false,
    },
    {
      name: "CSV Exports",
      free: "Limited",
      premium: "Full-featured",
      freeIcon: <FileText className="h-4 w-4" />,
      premiumIcon: <FileText className="h-4 w-4" />,
      highlight: false,
    },
    {
      name: "Bulk Operations",
      free: "Limited",
      premium: "Full access",
      freeIcon: <X className="h-4 w-4" />,
      premiumIcon: <Repeat className="h-4 w-4" />,
      highlight: true,
    },
    {
      name: "Priority Support",
      free: "Community support",
      premium: "Direct email support",
      freeIcon: <X className="h-4 w-4" />,
      premiumIcon: <Check className="h-4 w-4" />,
      highlight: true,
    },
  ];

  // FAQ data
  const faqItems: FaqItem[] = [
    {
      question: "How does the free trial work?",
      answer:
        "The free trial gives you 3 days of access to GenMeta Desktop with a limit of 5 requests per batch. After the trial period ends, you'll need to upgrade to the Premium plan to continue using the app with unlimited capabilities.",
    },
    {
      question: "Can I use GenMeta Desktop on multiple computers?",
      answer:
        "Your license is tied to a single device. If you need to use GenMeta on a different computer, you'll need to deactivate it on your current device first through your account settings.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are securely processed and your information is never stored on our servers.",
    },
    {
      question: "Can I upgrade from monthly to yearly billing?",
      answer:
        "Yes, you can upgrade from monthly to yearly billing at any time. When you upgrade, we'll prorate your existing subscription and apply any remaining credit to your new plan.",
    },
    {
      question: "Is there a refund policy?",
      answer:
        "We offer a 30-day money-back guarantee for all premium plans. If you're not satisfied with GenMeta Desktop, contact our support team within 30 days of purchase for a full refund.",
    },
    {
      question: "Do I need to provide my own API key?",
      answer:
        "Yes, both free and premium plans require you to use your own Gemini API key. This gives you full control over your API usage and ensures your data privacy.",
    },
  ];

  const handlePurchase = (id: string, type: string) => {
    router.push(`/cart/${id}?type=${type}`);
  };

  // In the PricingContent component, wrap the main content with a loading check:
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Laptop className="h-12 w-12 text-violet-600 dark:text-violet-400 mx-auto animate-pulse" />
          <h2 className="text-2xl font-medium">
            Loading pricing information...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background pt-16 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,80,255,0.15),transparent_70%)] -z-10"></div>
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400">
              <Sparkles className="h-4 w-4" />
              <span>Unlock the full power of GenMeta</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Choose the Perfect Plan <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
                for Your Workflow
              </span>
            </h1>

            <p className="max-w-2xl text-lg text-muted-foreground">
              Transform your image metadata workflow with GenMeta Desktop.
              Select the plan that fits your needs and start enhancing your
              images today.
            </p>

            <Tabs
              defaultValue="monthly"
              value={billingCycle}
              onValueChange={(value) => setBillingCycle(value as BillingCycle)}
              className="w-full max-w-md mt-6"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">
                  Yearly
                  <Badge
                    variant="secondary"
                    className="ml-2 border-green-500/20 bg-green-500/10 text-green-600 hover:bg-green-500/20"
                  >
                    Save 60%
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="container mx-auto px-4 -mt-10 mb-10">
          <div className="mx-auto max-w-md">
            <Alert variant="destructive" className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{errorMessage}</AlertDescription>
              <button
                onClick={() => setErrorMessage(null)}
                className="absolute right-2 top-2 rounded-full p-1 transition-colors hover:bg-destructive/20"
                aria-label="Close"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </Alert>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 -mt-10">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
          {/* Free Plan */}
          <Card className="relative overflow-hidden border-violet-100 dark:border-violet-900 transition-all hover:shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Free Trial
              </CardTitle>
              <CardDescription>Try GenMeta Desktop for 3 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-4xl font-bold">৳0</p>
                <p className="text-sm text-muted-foreground">
                  3-day trial period
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                {features.slice(0, 5).map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 rounded-full bg-muted p-1 text-muted-foreground">
                      {feature.freeIcon}
                    </div>
                    <span className="text-sm">{feature.free}</span>
                    <span className="ml-auto text-sm font-medium">
                      {feature.name}
                    </span>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  asChild
                >
                  <Link href="#feature-comparison">View all features</Link>
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                size="lg"
                asChild
              >
                <Link href="/get-app">
                  <Download className="mr-2 h-4 w-4" />
                  Download Free Trial
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card
            id="premium"
            className="relative overflow-hidden border-violet-200 dark:border-violet-800 shadow-md transition-all hover:shadow-lg"
          >
            <div className="absolute -right-10 top-5 rotate-45 bg-gradient-to-r from-violet-600 to-indigo-600 px-10 py-1 text-xs font-semibold text-white">
              Recommended
            </div>
            <Badge className="absolute left-4 top-4 bg-green-500 hover:bg-green-600">
              {pricingData[billingCycle as "monthly" | "yearly"].discount}% OFF
            </Badge>

            <CardHeader className="mt-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                Premium
              </CardTitle>
              <CardDescription>
                Unlock the full potential of GenMeta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-4xl font-bold text-foreground">
                    ৳
                    {
                      pricingData[billingCycle as "monthly" | "yearly"]
                        .discountedPrice
                    }
                  </p>
                  <p className="text-sm text-muted-foreground line-through">
                    ৳
                    {
                      pricingData[billingCycle as keyof ProcessedPricingData]
                        .originalPrice
                    }
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {billingCycle === "yearly"
                    ? "per month, billed annually"
                    : "per month"}
                </p>
                {billingCycle === "yearly" && (
                  <p className="text-xs font-medium text-green-500">
                    Save ৳{pricingData.yearly.totalSavings} per year
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                {features.slice(0, 5).map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/50 p-1 text-violet-600 dark:text-violet-400">
                      {feature.premiumIcon}
                    </div>
                    <span
                      className={`text-sm ${
                        feature.highlight
                          ? "font-medium text-violet-600 dark:text-violet-400"
                          : ""
                      }`}
                    >
                      {feature.premium}
                    </span>
                    <span className="ml-auto text-sm font-medium">
                      {feature.name}
                    </span>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-violet-600 dark:text-violet-400"
                  asChild
                >
                  <Link href="#feature-comparison">View all features</Link>
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
                size="lg"
                onClick={() =>
                  handlePurchase(
                    pricingData[billingCycle as "monthly" | "yearly"]._id || "",
                    "subscription"
                  )
                }
              >
                <Star className="mr-2 h-4 w-4" />
                {billingCycle === "yearly"
                  ? `Get Premium - ৳${pricingData.yearly.totalPrice}/year`
                  : "Get Premium"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div id="feature-comparison" className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-3xl font-bold">
            Feature Comparison
          </h2>

          <div className="overflow-hidden rounded-xl border border-violet-100 dark:border-violet-900">
            <div className="grid grid-cols-3 bg-violet-50 dark:bg-violet-950/30 p-4 font-medium">
              <div>Feature</div>
              <div className="text-center">Free Trial</div>
              <div className="text-center">Premium</div>
            </div>

            <Separator className="bg-violet-100 dark:bg-violet-900" />

            {features.map((feature, index) => (
              <div key={index}>
                <div
                  className={`grid grid-cols-3 p-4 ${
                    feature.highlight
                      ? "bg-violet-50/50 dark:bg-violet-950/20"
                      : ""
                  }`}
                >
                  <div className="flex items-center font-medium">
                    {feature.name}
                    {feature.highlight && (
                      <Badge
                        variant="outline"
                        className="ml-2 border-violet-200 dark:border-violet-800 bg-violet-100/50 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400"
                      >
                        Popular
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`rounded-full p-1 ${
                          feature.highlight
                            ? "bg-muted text-muted-foreground"
                            : "bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {feature.freeIcon}
                      </div>
                      <span className="text-sm">{feature.free}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`rounded-full p-1 ${
                          feature.highlight
                            ? "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400"
                            : "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                        }`}
                      >
                        {feature.premiumIcon}
                      </div>
                      <span
                        className={`text-sm ${
                          feature.highlight
                            ? "font-medium text-violet-600 dark:text-violet-400"
                            : ""
                        }`}
                      >
                        {feature.premium}
                      </span>
                    </div>
                  </div>
                </div>
                {index < features.length - 1 && (
                  <Separator className="bg-violet-100 dark:bg-violet-900/50" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="px-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
              asChild
            >
              <a href="#premium">Get Premium</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
              asChild
            >
              <Link href="/get-app">Try for Free</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Credit Plans Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-3xl font-bold">
            Credit Packages
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPlans.map((plan) => (
              <Card
                key={plan._id}
                className="border-violet-100 dark:border-violet-900 transition-all hover:shadow-lg"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.credit} credits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-4xl font-bold text-foreground">
                        ৳
                        {Math.round(
                          plan.basePrice * (1 - plan.discountPercent / 100)
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground line-through">
                        ৳{plan.basePrice}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-green-500">
                      {plan.discountPercent}% OFF
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
                    onClick={() => handlePurchase(plan._id, "credit")}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Buy Credits
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* App Screenshot */}
      <div className="bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-3xl font-bold">
              Powerful Desktop Experience
            </h2>

            <div className="overflow-hidden rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-b from-background to-violet-50/50 dark:from-background dark:to-violet-950/20 p-2 shadow-lg">
              <div className="overflow-hidden rounded-lg">
                <Image
                  src="/Assets/app.png"
                  alt="GenMeta Desktop App Preview"
                  width={2000}
                  height={1200}
                  className="w-full rounded-lg shadow-md transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-card p-6 shadow-sm transition-all hover:shadow-md border border-violet-100 dark:border-violet-900">
                <div className="mb-4 rounded-full bg-violet-100 dark:bg-violet-900/50 p-3 w-fit">
                  <Zap className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Powerful AI</h3>
                <p className="text-muted-foreground">
                  Process images with state-of-the-art AI technology for
                  accurate and fast results. Generate metadata that improves
                  discoverability.
                </p>
              </div>

              <div className="rounded-lg bg-card p-6 shadow-sm transition-all hover:shadow-md border border-violet-100 dark:border-violet-900">
                <div className="mb-4 rounded-full bg-violet-100 dark:bg-violet-900/50 p-3 w-fit">
                  <Shield className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">
                  Secure Processing
                </h3>
                <p className="text-muted-foreground">
                  All processing happens locally on your device, ensuring your
                  data never leaves your computer. Your images stay private.
                </p>
              </div>

              <div className="rounded-lg bg-card p-6 shadow-sm transition-all hover:shadow-md border border-violet-100 dark:border-violet-900">
                <div className="mb-4 rounded-full bg-violet-100 dark:bg-violet-900/50 p-3 w-fit">
                  <BarChart3 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">
                  Advanced Workflow
                </h3>
                <p className="text-muted-foreground">
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
          <h2 className="mb-8 text-center text-3xl font-bold">
            Frequently Asked Questions
          </h2>

          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-violet-100 dark:border-violet-900"
              >
                <AccordionTrigger className="text-left hover:text-violet-600 dark:hover:text-violet-400">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-violet-500" />
                    {item.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-2xl bg-card p-8 shadow-lg border border-violet-200 dark:border-violet-800">
            <div className="text-center">
              <Badge className="mb-4 bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-800">
                Limited Time Offer
              </Badge>
              <h2 className="mb-4 text-3xl font-bold">
                Ready to transform your workflow?
              </h2>
              <p className="mb-8 text-muted-foreground">
                Join thousands of professionals who use GenMeta Desktop to
                streamline their image metadata workflow. Get started today with
                our special pricing.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
                  asChild
                >
                  <a href="#premium">
                    Get Premium
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-8 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                  asChild
                >
                  <Link href="/get-app">Try for Free</Link>
                </Button>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                30-day money-back guarantee. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading component to show while the content loads
const PricingLoading = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Laptop className="h-12 w-12 text-violet-600 dark:text-violet-400 mx-auto animate-pulse" />
        <h2 className="text-2xl font-medium">Loading pricing information...</h2>
      </div>
    </div>
  );
};

// Main component that wraps PricingContent in a Suspense boundary
const PricingPage = () => {
  return (
    <Suspense fallback={<PricingLoading />}>
      <PricingContent />
    </Suspense>
  );
};

export default PricingPage;
