"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2, Tag } from "lucide-react";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBaseApi, getAccessToken } from "@/services/image-services";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OrderDetails {
  orderId: string;
  planId: string;
  planName: string;
  planType: "subscription" | "credit";
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  planDiscount: number;
  promoDiscount?: number;
  promoCode?: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export default function PaymentSuccess({ orderId }: { orderId: string }) {
  const router = useRouter();

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("No order information found");
        setIsLoading(false);
        return;
      }

      try {
        const baseApi = await getBaseApi();
        const accessToken = await getAccessToken();

        if (!accessToken) {
          router.push("/login");
          return;
        }

        const response = await fetch(`${baseApi}/payment/order/${orderId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch order details");
        }

        const data = await response.json();
        setOrderDetails(data.data);
      } catch (error) {
        console.error("Error fetching order details:", error);
        setError("Could not load order details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, router]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <MaxWidthWrapper className="py-24">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            Verifying your payment...
          </p>
        </div>
      </MaxWidthWrapper>
    );
  }

  if (error || !orderDetails) {
    return (
      <MaxWidthWrapper className="py-24">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-red-500">
              Payment Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">
              {error ||
                "We couldn't verify your payment. Please contact support."}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/support")}>
              Contact Support
            </Button>
          </CardFooter>
        </Card>
      </MaxWidthWrapper>
    );
  }

  // Format date
  const orderDate = new Date(orderDetails.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <MaxWidthWrapper className="py-24">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl md:text-3xl">
            Payment Successful!
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Your order has been successfully processed
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-medium">Transaction Details</h3>
              <p className="text-sm text-muted-foreground">{orderDate}</p>
            </div>
            <Badge
              variant="outline"
              className="text-green-600 bg-green-50 border-green-200"
            >
              {orderDetails.status.toUpperCase()}
            </Badge>
          </div>

          <div className="bg-muted/40 p-6 rounded-lg space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{orderDetails.planName}</h3>
                <p className="text-sm text-muted-foreground">
                  {orderDetails.planType === "subscription"
                    ? "Subscription Plan"
                    : "Credit Package"}
                </p>
              </div>
              {orderDetails.planType === "subscription" && (
                <Badge variant="outline" className="bg-primary/10">
                  Subscription
                </Badge>
              )}
              {orderDetails.planType === "credit" && (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-500 border-blue-200"
                >
                  Credits
                </Badge>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Price</span>
                <span>
                  $
                  {orderDetails.baseAmount?.toFixed(2) ||
                    orderDetails.finalAmount?.toFixed(2)}
                </span>
              </div>

              {orderDetails.planDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Plan Discount ({orderDetails.planDiscount}%)
                  </span>
                  <span className="text-green-600">
                    -$
                    {(
                      (orderDetails.baseAmount * orderDetails.planDiscount) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
              )}

              {orderDetails.promoCode && orderDetails.promoDiscount && (
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span className="text-muted-foreground">
                      Promo Code ({orderDetails.promoCode})
                    </span>
                  </div>
                  <span className="text-green-600">
                    -$
                    {(
                      (orderDetails.baseAmount *
                        (1 - orderDetails.planDiscount / 100) *
                        orderDetails.promoDiscount) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total Paid</span>
                <span>${orderDetails.finalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <div className="flex">
              <div className="mr-4 flex-shrink-0">
                <img
                  src="/bkash-logo.png"
                  alt="bKash"
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23e91e63' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='20' height='14' x='2' y='5' rx='2'/%3E%3Cline x1='2' x2='22' y1='10' y2='10'/%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Paid with bKash</h3>
                <p className="text-sm text-blue-700">
                  Transaction ID:{" "}
                  <span className="font-mono">
                    {orderDetails.orderId.substring(0, 10)}...
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center p-4 border border-dashed border-primary/20 rounded-md bg-primary/5">
            <p className="text-muted-foreground">
              {orderDetails.planType === "subscription"
                ? "Your subscription has been activated. You now have access to all premium features."
                : "Your credits have been added to your account. You can start using them right away."}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button onClick={() => window.print()} variant="outline">
            Print Receipt
          </Button>
          <Button
            onClick={handleGoToDashboard}
            className="flex items-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </MaxWidthWrapper>
  );
}
