"use client";

import { useState, useEffect } from "react";
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
import Image from "next/image";
import Link from "next/link";
import { getBaseApi } from "@/services/image-services";
import { getAccessToken } from "@/services/auth-services";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<string>("monthly");
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams) {
      const message = searchParams.get("message");
      if (message) {
        setErrorMessage(decodeURIComponent(message));
      }
    }
  }, [searchParams]);

  // Static pricing data
  const pricingData = {
    monthly: {
      originalPrice: 500,
      discount: 50,
      discountedPrice: 250,
      totalPrice: 250,
    },
    yearly: {
      originalPrice: 500,
      discount: 55,
      discountedPrice: 225,
      billingLabel: "per month, billed annually",
      totalPrice: 2700,
      totalSavings: 3300,
    },
  };

  const currentPricing = pricingData[billingCycle as keyof typeof pricingData];

  // Free plan features

  const freeFeatures = [
    {
      name: "3-day Trial Period",

      icon: <Clock className="h-4 w-4" />,

      included: true,
    },

    {
      name: "Limited 5 Requests per Batch",

      icon: <X className="h-4 w-4" />,

      included: true,
    },

    {
      name: "Own Gemini API Key",

      icon: <Zap className="h-4 w-4" />,

      included: true,
    },

    {
      name: "Unlimited Results",

      icon: <X className="h-4 w-4" />,

      included: true,
    },

    {
      name: "Meta Included JPG, PNG",

      icon: <Check className="h-4 w-4" />,

      included: true,
    },

    {
      name: "Metadata Editing",

      icon: <Edit className="h-4 w-4" />,

      included: true,
    },

    {
      name: "Custom Order Keywords",

      icon: <Edit className="h-4 w-4" />,

      included: true,
    },

    {
      name: "CSV Exports",

      icon: <FileText className="h-4 w-4" />,

      included: true,
    },
  ];

  // Premium plan features

  const premiumFeatures = [
    {
      name: "Unlimited Batch Requests",

      icon: <Check className="h-4 w-4" />,

      included: true,
    },

    {
      name: "Own Gemini API Key",

      icon: <Zap className="h-4 w-4" />,

      included: true,
    },

    {
      name: "Unlimited Results",

      icon: <Check className="h-4 w-4" />,

      included: true,
    },

    {
      name: "Meta Included JPG, PNG",

      icon: <Check className="h-4 w-4" />,

      included: true,
    },

    {
      name: "Metadata Editing",

      icon: <Edit className="h-4 w-4" />,

      included: true,
    },

    {
      name: "Custom Order Keywords",

      icon: <Edit className="h-4 w-4" />,

      included: true,
    },

    {
      name: "CSV Exports",

      icon: <FileText className="h-4 w-4" />,

      included: true,
    },
  ];

  const handlePurchase = async (price: number, name: string) => {
    try {
      const plan = {
        price,
        name,
      };
      const baseAPI = await getBaseApi();
      const accessToken = await getAccessToken();
      const response = await fetch(`${baseAPI}/payment/create-app-payment`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plan,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.bkashURL) {
        // Redirect to bKash payment URL
        window.location.href = data.data.bkashURL;
      } else {
        // Handle error case
        console.error(
          "Payment creation failed:",
          data.message || "Unknown error occurred"
        );
        alert("Payment processing failed. Please try again later.");
      }
    } catch (error) {
      console.error("Payment request error:", error);
      alert(
        "An error occurred while processing your payment. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-4 mb-12">
          <div className="flex items-center gap-2 mb-2">
            <Laptop className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">GenMeta Desktop</h1>
          </div>
          <h2 className="text-3xl font-bold text-center">Choose Your Plan</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Unlock the full potential of GenMeta Desktop with our premium plan
            or try it for free.
          </p>

          <Tabs
            defaultValue="monthly"
            value={billingCycle}
            onValueChange={setBillingCycle}
            className="w-full max-w-md mt-6"
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly
                <Badge
                  variant="secondary"
                  className="ml-2 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                >
                  Save 60%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className=" flex justify-center items-center">
          {errorMessage && (
            <div className="w-full max-w-md">
              <Alert variant="destructive" className="mb-4 flex items-center">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="absolute right-2 top-2 p-1 rounded-full hover:bg-destructive/20 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </Alert>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="border-border/50 relative overflow-hidden transition-all hover:shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Free Trial</CardTitle>
              <CardDescription>Try GenMeta Desktop for 3 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-4xl font-bold">$0</p>
                <p className="text-sm text-muted-foreground">
                  3-day trial period
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="rounded-full p-1 bg-primary/10 text-primary flex-shrink-0">
                      {feature.icon}
                    </div>
                    <span className="text-sm">{feature.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" size="lg" asChild>
                <Link href="/get-app"> Download Free Trial</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card
            id="premium"
            className="border-primary shadow-md relative overflow-hidden transition-all hover:shadow-lg"
          >
            <div className="absolute -right-10 top-5 rotate-45 bg-primary px-10 py-1 text-xs font-semibold text-primary-foreground">
              Recommended
            </div>
            <Badge className="absolute top-4 left-4 bg-green-500 hover:bg-green-600">
              {currentPricing.discount}% OFF
            </Badge>

            <CardHeader className="pb-2 mt-6">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
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
                    ${currentPricing.discountedPrice}
                  </p>
                  <p className="text-sm line-through text-muted-foreground">
                    ${currentPricing.originalPrice}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {billingCycle === "yearly"
                    ? "per month, billed annually"
                    : "per month"}
                </p>
                {billingCycle === "yearly" && (
                  <p className="text-xs text-green-500 font-medium">
                    {billingCycle === "yearly" &&
                      "totalSavings" in currentPricing &&
                      `Save $${currentPricing.totalSavings} per year`}
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="rounded-full p-1 bg-primary/10 text-primary flex-shrink-0">
                      {feature.icon}
                    </div>
                    <span className="text-sm">{feature.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() =>
                  handlePurchase(
                    pricingData[billingCycle as keyof typeof pricingData]
                      .totalPrice,
                    billingCycle
                  )
                }
              >
                {billingCycle === "yearly"
                  ? `Get Premium - $${currentPricing.totalPrice}/year`
                  : "Get Premium"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <h3 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h3>

          <div className="space-y-6">
            <div className="bg-muted/50 p-6 rounded-lg">
              <h4 className="font-medium text-lg mb-2">
                How does the free trial work?
              </h4>
              <p className="text-muted-foreground">
                The free trial gives you 3 days of access to GenMeta Desktop
                with a limit of 5 requests. After the trial period ends,
                you&apos;ll need to upgrade to the Premium plan to continue
                using the app.
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h4 className="font-medium text-lg mb-2">
                Can I use GenMeta Desktop on multiple computers?
              </h4>
              <p className="text-muted-foreground">
                Your license is tied to a single device. If you need to use
                GenMeta on a different computer, you&apos;ll need to deactivate
                it on your current device first.
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h4 className="font-medium text-lg mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-muted-foreground">
                We accept all major credit cards, PayPal, and bank transfers for
                annual plans. All payments are securely processed and your
                information is never stored on our servers.
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h4 className="font-medium text-lg mb-2">
                Can I upgrade from monthly to yearly billing?
              </h4>
              <p className="text-muted-foreground">
                Yes, you can upgrade from monthly to yearly billing at any time.
                When you upgrade, we&apos;ll prorate your existing subscription
                and apply any remaining credit to your new plan.
              </p>
            </div>
          </div>
        </div>

        {/* App Screenshot */}
        <div className="mt-20 max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">
            Powerful Desktop Experience
          </h3>

          <div className="bg-gradient-to-b from-muted/50 to-background p-6 rounded-xl border border-border/50 shadow-lg">
            <div>
              <Image
                src="/Assets/app.png"
                alt="App Preview"
                width={2000}
                height={2000}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-muted/30 p-5 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" /> Powerful AI
              </h4>
              <p className="text-sm text-muted-foreground">
                Process images with state-of-the-art AI technology for accurate
                and fast results.
              </p>
            </div>

            <div className="bg-muted/30 p-5 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Secure Processing
              </h4>
              <p className="text-sm text-muted-foreground">
                All processing happens locally on your device, ensuring your
                data never leaves your computer.
              </p>
            </div>

            <div className="bg-muted/30 p-5 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" /> Advanced Editing
              </h4>
              <p className="text-sm text-muted-foreground">
                Edit metadata and export your results in various formats for
                seamless workflow integration.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-primary/10 rounded-xl p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Download GenMeta Desktop today and transform how you work with
              images and metadata.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8" asChild>
                <a href="#premium">Get Premium</a>
              </Button>
              <Button size="lg" variant="outline" className="px-8" asChild>
                <Link href="/get-app">Try for Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
