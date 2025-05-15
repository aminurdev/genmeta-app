"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchPricingPlans,
  fetchPromoCodes,
  PricingPlan,
  PromoCode,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { CreatePricingForm } from "./create-pricing-form";
import { PricingTable } from "./pricing-table";
import { CreatePromoCodeForm } from "./create-promo-code-form";
import { PromoCodeTable } from "./promo-code-table";

export function PricingDashboard() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoLoading, setPromoLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("subscription");

  useEffect(() => {
    loadPlans();
    loadPromoCodes();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await fetchPricingPlans();
      setPlans(data.plans);
    } catch {
      toast("Failed to load pricing plans");
    } finally {
      setLoading(false);
    }
  };

  const loadPromoCodes = async () => {
    try {
      setPromoLoading(true);
      const data = await fetchPromoCodes();
      setPromoCodes(
        data.promoCodes.map((promoCode: PromoCode) => ({
          ...promoCode,
          appliesTo: promoCode.appliesTo as "subscription" | "both" | "credit",
        }))
      );
    } catch {
      toast("Failed to load promo codes");
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePlanCreated = () => {
    setOpen(false);
    loadPlans();
    toast("Pricing plan created successfully");
  };

  const handlePlanUpdated = () => {
    loadPlans();
    toast("Pricing plan updated successfully");
  };

  const handlePlanDeleted = () => {
    loadPlans();
    toast("Pricing plan deleted successfully");
  };

  const handlePromoCodeCreated = () => {
    setPromoOpen(false);
    loadPromoCodes();
    toast("Promo code created successfully");
  };

  const handlePromoCodeUpdated = () => {
    loadPromoCodes();
    toast("Promo code updated successfully");
  };

  const handlePromoCodeDeleted = () => {
    loadPromoCodes();
    toast("Promo code deleted successfully");
  };

  const subscriptionPlans = plans.filter(
    (plan) => plan.type === "subscription"
  );
  const creditPlans = plans.filter((plan) => plan.type === "credit");

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="subscription"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscription">Subscription Plans</TabsTrigger>
          <TabsTrigger value="credit">Credit Plans</TabsTrigger>
          <TabsTrigger value="promocodes">Promo Codes</TabsTrigger>
        </TabsList>

        <div className="flex justify-between items-center mt-6 mb-4">
          <h2 className="text-xl font-semibold">
            {activeTab === "promocodes"
              ? "Manage Promo Codes"
              : activeTab === "subscription"
              ? "Manage Subscription Plans"
              : "Manage Credit Plans"}
          </h2>

          {activeTab === "promocodes" ? (
            <Sheet open={promoOpen} onOpenChange={setPromoOpen}>
              <SheetTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Promo Code
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Create New Promo Code</SheetTitle>
                </SheetHeader>
                <CreatePromoCodeForm onSuccess={handlePromoCodeCreated} />
              </SheetContent>
            </Sheet>
          ) : (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Plan
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Create New Pricing Plan</SheetTitle>
                </SheetHeader>
                <CreatePricingForm onSuccess={handlePlanCreated} />
              </SheetContent>
            </Sheet>
          )}
        </div>

        <TabsContent value="subscription">
          <PricingTable
            plans={subscriptionPlans}
            loading={loading}
            onPlanUpdated={handlePlanUpdated}
            onPlanDeleted={handlePlanDeleted}
          />
        </TabsContent>
        <TabsContent value="credit">
          <PricingTable
            plans={creditPlans}
            loading={loading}
            onPlanUpdated={handlePlanUpdated}
            onPlanDeleted={handlePlanDeleted}
          />
        </TabsContent>
        <TabsContent value="promocodes">
          <PromoCodeTable
            promoCodes={promoCodes}
            loading={promoLoading}
            onPromoCodeUpdated={handlePromoCodeUpdated}
            onPromoCodeDeleted={handlePromoCodeDeleted}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
