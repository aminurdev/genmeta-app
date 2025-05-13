"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SubscriptionPlansTab from "@/components/admin/app/subscription-plans-tab";
import CreditPlansTab from "@/components/admin/app/credit-plans-tab";
import PromoCodesTab from "@/components/admin/app/promo-codes-tab";

export default function PricingManagementPage() {
  const [activeTab, setActiveTab] = useState("subscription-plans");
  const [error, setError] = useState<string | null>(null);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto py-6 space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Pricing Management
        </h1>
        <p className="text-muted-foreground">
          Manage subscription plans, credit plans, and promo codes for your
          application.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscription-plans">
            Subscription Plans
          </TabsTrigger>
          <TabsTrigger value="credit-plans">Credit Plans</TabsTrigger>
          <TabsTrigger value="promo-codes">Promo Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription-plans" className="space-y-4">
          <SubscriptionPlansTab setError={setError} />
        </TabsContent>

        <TabsContent value="credit-plans" className="space-y-4">
          <CreditPlansTab setError={setError} />
        </TabsContent>

        <TabsContent value="promo-codes" className="space-y-4">
          <PromoCodesTab setError={setError} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
