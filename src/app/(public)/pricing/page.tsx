"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { getBaseApi } from "@/services/image-services";
import { PricingFaq } from "@/components/pricing/pricing-faq";
import { useRouter } from "next/navigation";

interface SubscriptionPlan {
  _id: string;
  name: string;
  type: string;
  basePrice: number;
  discountPercent: number;
  isActive: boolean;
  planDuration: number;
  createdAt: string;
  updatedAt: string;
}

interface CreditPlan {
  _id: string;
  name: string;
  type: string;
  basePrice: number;
  discountPercent: number;
  isActive: boolean;
  planDuration?: number;
  credit: number;
  createdAt: string;
  updatedAt: string;
}

interface PlansResponse {
  success: boolean;
  message: string;
  data: {
    subscriptionPlans: SubscriptionPlan[];
    creditPlans: CreditPlan[];
  };
}

const features = [
  "Fast AI image processing",
  "Accurate metadata generation",
  "CSV export functionality",
  "Bulk image processing",
  "Priority customer support",
  "Advanced customization options",
];

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlansResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const baseApi = await getBaseApi();

        if (!baseApi) {
          throw new Error("Could not get API base URL");
        }

        const response = await fetch(`${baseApi}/pricing/plans`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPlans(data);
        setErrorMessage(null);
      } catch (error) {
        console.error("Error fetching pricing plans:", error);
        setErrorMessage(
          "Failed to load pricing plans. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const calculateDiscountedPrice = (
    basePrice: number,
    discountPercent: number
  ) => {
    return ((basePrice * (100 - discountPercent)) / 100).toFixed(2);
  };

  const handleSelectPlan = (plan: SubscriptionPlan | CreditPlan) => {
    router.push(`/cart?planId=${plan._id}&planType=${plan.type}`);
  };

  return (
    <div className="relative pb-20">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6"
          aria-hidden="true"
        >
          <div
            className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>
      </div>

      <MaxWidthWrapper className="py-24">
        <div className="mx-auto  text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Choose the plan that works best for your needs. All plans include
            full access to our core features.
          </p>
        </div>

        <div className="mt-16 flex justify-center">
          <Tabs defaultValue="subscription" className="w-full max-w-4xl">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
              <TabsTrigger value="subscription">Subscription Plans</TabsTrigger>
              <TabsTrigger value="credits">Credit Plans</TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="flex flex-col">
                    <CardHeader className="pb-8">
                      <Skeleton className="h-8 w-36 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-1">
                        <Skeleton className="h-10 w-32 mb-2" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="space-y-2">
                        {Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                          ))}
                      </div>
                    </CardContent>
                    <CardFooter className="mt-auto">
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : errorMessage ? (
              <div className="text-center">
                <p className="text-red-500 mb-4">{errorMessage}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <TabsContent value="subscription" className="w-full">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {plans?.data.subscriptionPlans.map((plan) => (
                      <Card
                        key={plan._id}
                        className={`flex flex-col border ${
                          plan.name.toLowerCase().includes("pro")
                            ? "border-primary shadow-md relative overflow-hidden"
                            : ""
                        }`}
                      >
                        {plan.name.toLowerCase().includes("pro") && (
                          <div className="absolute -right-12 top-6 rotate-45 bg-primary px-10 py-1 text-xs font-semibold text-primary-foreground">
                            Popular
                          </div>
                        )}
                        <CardHeader className="pb-8">
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <CardDescription>
                            {plan.planDuration} days of service
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-2">
                            {plan.discountPercent > 0 ? (
                              <>
                                <div className="flex items-center">
                                  <span className="text-3xl font-bold">
                                    $
                                    {calculateDiscountedPrice(
                                      plan.basePrice,
                                      plan.discountPercent
                                    )}
                                  </span>
                                  <Badge className="ml-2 bg-green-500 hover:bg-green-600">
                                    Save {plan.discountPercent}%
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  <span className="line-through">
                                    ${plan.basePrice.toFixed(2)}
                                  </span>{" "}
                                  for {plan.planDuration} days
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-3xl font-bold">
                                  ${plan.basePrice.toFixed(2)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  for {plan.planDuration} days
                                </p>
                              </>
                            )}
                          </div>
                          <div className="space-y-2">
                            {features.map((feature) => (
                              <div
                                key={feature}
                                className="flex items-center gap-2"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="mt-auto pt-6">
                          <Button
                            className="w-full"
                            variant={
                              plan.name.toLowerCase().includes("pro")
                                ? "default"
                                : "outline"
                            }
                            onClick={() => handleSelectPlan(plan)}
                          >
                            Choose Plan
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="credits" className="w-full">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {plans?.data.creditPlans.map((plan) => (
                      <Card
                        key={plan._id}
                        className={`flex flex-col border ${
                          plan.name.toLowerCase().includes("premium")
                            ? "border-primary shadow-md relative overflow-hidden"
                            : ""
                        }`}
                      >
                        {plan.name.toLowerCase().includes("premium") && (
                          <div className="absolute -right-12 top-6 rotate-45 bg-primary px-10 py-1 text-xs font-semibold text-primary-foreground">
                            Best Value
                          </div>
                        )}
                        <CardHeader className="pb-8">
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <CardDescription>
                            {plan.credit} credits
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-2">
                            {plan.discountPercent > 0 ? (
                              <>
                                <div className="flex items-center">
                                  <span className="text-3xl font-bold">
                                    $
                                    {calculateDiscountedPrice(
                                      plan.basePrice,
                                      plan.discountPercent
                                    )}
                                  </span>
                                  <Badge className="ml-2 bg-green-500 hover:bg-green-600">
                                    Save {plan.discountPercent}%
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  <span className="line-through">
                                    ${plan.basePrice.toFixed(2)}
                                  </span>{" "}
                                  for {plan.credit} credits
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-3xl font-bold">
                                  ${plan.basePrice.toFixed(2)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  for {plan.credit} credits
                                </p>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">
                              ${(plan.basePrice / plan.credit).toFixed(4)} per
                              credit
                            </span>
                          </div>
                          <div className="space-y-2">
                            {features.slice(0, 4).map((feature) => (
                              <div
                                key={feature}
                                className="flex items-center gap-2"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="mt-auto pt-6">
                          <Button
                            className="w-full"
                            variant={
                              plan.name.toLowerCase().includes("premium")
                                ? "default"
                                : "outline"
                            }
                            onClick={() => handleSelectPlan(plan)}
                          >
                            Purchase Credits
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        <div className="mt-24 max-w-2xl mx-auto text-center">
          <PricingFaq />
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
