"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  CreditCard,
  ShoppingCart,
  Tag,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  Clock,
  Info,
} from "lucide-react";
import Link from "next/link";
// Removed getBaseApi import to prevent server component errors
import { getAccessToken, getCurrentUser } from "@/services/auth-services";
import { useRouter } from "next/navigation";

// Define types for better type safety
type BillingCycle = "monthly" | "yearly" | "quarterly";
type PlanType = "subscription" | "credit";

interface Plan {
  _id: string;
  name: string;
  basePrice: number;
  discountPercent: number;
  isActive: boolean;
  billingCycle?: BillingCycle;
  credit?: number;
}

interface CartItem {
  _id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  type: PlanType;
  details?: string;
}

interface PromoCode {
  code: string;
  discountPercent: number;
  appliesTo: "subscription" | "credit" | "both";
  validUntil: string;
}

interface PromoCodeResponse {
  success: boolean;
  message: string;
  data: {
    promoCode: PromoCode;
  };
}

export function Cart({ id, type }: { id: string; type: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cartItem, setCartItem] = useState<CartItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeDetails, setPromoCodeDetails] = useState<PromoCode | null>(
    null
  );
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setIsLoading(true);
        const baseApi = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await fetch(`${baseApi}/plans/pricing-data`);
        const result = await response.json();

        if (result.success) {
          let item = null;

          if (type === "subscription") {
            item = result.data.subscriptionPlans.find(
              (plan: Plan) => plan._id === id
            );
            if (item) {
              const itemData = {
                _id: item._id,
                name: item.name,
                price: Math.round(
                  item.basePrice * (1 - item.discountPercent / 100)
                ),
                originalPrice: item.basePrice,
                discount: item.discountPercent,
                type: "subscription" as PlanType,
                details: `${
                  item.billingCycle.charAt(0).toUpperCase() +
                  item.billingCycle.slice(1)
                } billing`,
              };
              setCartItem(itemData);
              setFinalPrice(itemData.price);
            }
          } else if (type === "credit") {
            item = result.data.creditPlans.find(
              (plan: Plan) => plan._id === id
            );
            if (item) {
              const itemData = {
                _id: item._id,
                name: item.name,
                price: Math.round(
                  item.basePrice * (1 - item.discountPercent / 100)
                ),
                originalPrice: item.basePrice,
                discount: item.discountPercent,
                type: "credit" as PlanType,
                details: `${item.credit} credits`,
              };
              setCartItem(itemData);
              setFinalPrice(itemData.price);
            }
          }

          if (!item) {
            setError("Item not found");
          }
        } else {
          setError("Failed to load item details");
        }
      } catch (error) {
        console.error("Error fetching item details:", error);
        setError("An error occurred while loading item details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemDetails();
  }, [id, type]);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeError("Please enter a promo code");
      return;
    }

    try {
      setIsApplyingPromo(true);
      setPromoCodeError(null);

      const baseApi = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(
        `${baseApi}/promo-codes/validate/${promoCode}`
      );

      const result: PromoCodeResponse = await response.json();
      if (result.success) {
        const { promoCode: promoDetails } = result.data;

        // Check if promo code applies to the current item type
        if (
          promoDetails.appliesTo === "both" ||
          promoDetails.appliesTo === cartItem?.type
        ) {
          setPromoCodeDetails(promoDetails);

          // Calculate new price with promo code discount
          if (cartItem) {
            const promoDiscountAmount = Math.round(
              (cartItem.price * promoDetails.discountPercent) / 100
            );
            setPromoDiscount(promoDiscountAmount);
            setFinalPrice(cartItem.price - promoDiscountAmount);
          }
        } else {
          setPromoCodeError(
            `This promo code only applies to ${promoDetails.appliesTo} plans`
          );
        }
      } else {
        setPromoCodeError(result.message || "Invalid promo code");
      }
    } catch (error) {
      console.error("Error validating promo code:", error);
      setPromoCodeError("Failed to validate promo code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode("");
    setPromoCodeDetails(null);
    setPromoDiscount(0);
    if (cartItem) {
      setFinalPrice(cartItem.price);
    }
  };

  const handleCheckout = async (id: string) => {
    try {
      const user = await getCurrentUser();

      if (user) {
        const baseAPI = process.env.NEXT_PUBLIC_API_BASE_URL;
        const accessToken = await getAccessToken();
        const response = await fetch(`${baseAPI}/payment/create-app-payment`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            _id: id,
            type,
            promoCode,
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
      } else {
        router.push("/login?redirectPath=cart/" + id + "?type=" + type);
      }
    } catch (error) {
      console.error("Payment request error:", error);
      alert(
        "An error occurred while processing your payment. Please try again."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-violet-600 dark:text-violet-400 animate-pulse" />
          <h1 className="text-2xl font-bold mb-2">Loading cart...</h1>
          <p className="text-muted-foreground">
            Please wait while we prepare your order.
          </p>
        </div>
      </div>
    );
  }

  if (error || !cartItem) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground mb-6">
            {error || "Item not found"}
          </p>
          <Button asChild>
            <Link href="/pricing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Pricing
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/pricing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing
          </Link>
        </Button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Order Summary Column */}
          <div className="order-2 lg:order-1">
            <h2 className="text-2xl font-bold mb-4">Order Summary</h2>

            <Card className="border-violet-100 dark:border-violet-900 mb-6">
              <CardContent className="pt-6 space-y-4">
                <div className="rounded-lg bg-violet-50 dark:bg-violet-950/20 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{cartItem.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {cartItem.details}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">৳{cartItem.price}</div>
                      <div className="text-sm text-muted-foreground line-through">
                        ৳{cartItem.originalPrice}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    {cartItem.discount}% OFF
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>৳{cartItem.price}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan Discount</span>
                    <span className="text-green-600">
                      -৳{cartItem.originalPrice - cartItem.price}
                    </span>
                  </div>

                  {promoCodeDetails && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center">
                        Promo Discount
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300">
                          {promoCodeDetails.code}
                        </span>
                      </span>
                      <span className="text-green-600">-৳{promoDiscount}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-medium text-lg pt-2">
                    <span>Total</span>
                    <span>৳{finalPrice}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span>Secure payment processing</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-violet-500" />
                <span>Instant access after payment</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 text-blue-500" />
                <span>30-day money-back guarantee</span>
              </div>
            </div>
          </div>

          {/* Payment Details Column */}
          <div className="order-1 lg:order-2">
            <h2 className="text-2xl font-bold mb-4">Payment Details</h2>

            <Card className="border-violet-100 dark:border-violet-900 mb-6">
              <CardHeader>
                <CardTitle className="text-xl">Promo Code</CardTitle>
                <CardDescription>
                  Enter a promo code if you have one
                </CardDescription>
              </CardHeader>
              <CardContent>
                {promoCodeDetails ? (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>{promoCodeDetails.code} applied!</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {promoCodeDetails.discountPercent}% discount applied to
                        your order
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removePromoCode}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="promo-code" className="sr-only">
                        Promo Code
                      </Label>
                      <Input
                        id="promo-code"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoCodeError(null);
                        }}
                        className="border-violet-200 dark:border-violet-800 focus:ring-violet-500"
                      />
                    </div>
                    <Button
                      onClick={validatePromoCode}
                      disabled={isApplyingPromo || !promoCode.trim()}
                      variant="outline"
                      className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                    >
                      {isApplyingPromo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span>Apply</span>
                      )}
                    </Button>
                  </div>
                )}

                {promoCodeError && (
                  <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                    <XCircle className="h-4 w-4" />
                    <span>{promoCodeError}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-violet-100 dark:border-violet-900">
              <CardHeader>
                <CardTitle className="text-xl">Checkout</CardTitle>
                <CardDescription>
                  Complete your purchase securely
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-violet-50 dark:bg-violet-950/20 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Tag className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    <span className="font-medium">Order Summary</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    You&apos;re purchasing {cartItem.name} ({cartItem.details})
                  </p>
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span className="text-lg">৳{finalPrice}</span>
                  </div>
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 text-blue-800 dark:text-blue-300">
                  <AlertDescription className="text-sm">
                    By proceeding, you agree to our Terms of Service and Privacy
                    Policy.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20"
                  size="lg"
                  onClick={() => handleCheckout(cartItem._id)}
                  disabled={isApplyingPromo}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Complete Purchase
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
