"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CreatePricingForm } from "./create-pricing-form";
import { PricingTable } from "./pricing-table";
import { CreatePromoCodeForm } from "./create-promo-code-form";
import { PromoCodeTable } from "./promo-code-table";
import {
  usePricingPlansQuery,
  usePromoCodesQuery,
} from "@/services/queries/admin-dashboard";
import type { PricingPlan, PromoCode } from "@/services/admin-dashboard";

export function PricingDashboard() {
  const [open, setOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("credit");

  // Fetch pricing plans using React Query
  const {
    data: plansResponse,
    isLoading: plansLoading,
    refetch: refetchPlans,
  } = usePricingPlansQuery();

  // Fetch promo codes using React Query
  const {
    data: promoCodesResponse,
    isLoading: promoLoading,
    refetch: refetchPromoCodes,
  } = usePromoCodesQuery();

  // Extract data from responses
  const plans: PricingPlan[] =
    plansResponse?.success && plansResponse.data?.plans
      ? plansResponse.data.plans
      : [];

  const promoCodes: PromoCode[] =
    promoCodesResponse?.success && promoCodesResponse.data?.promoCodes
      ? promoCodesResponse.data.promoCodes.map((promoCode) => ({
        ...promoCode,
        appliesTo: promoCode.appliesTo as "subscription" | "both" | "credit",
      }))
      : [];

  const handlePlanCreated = () => {
    setOpen(false);
    refetchPlans();
    toast.success("Pricing plan created successfully");
  };

  const handlePlanUpdated = () => {
    refetchPlans();
    toast.success("Pricing plan updated successfully");
  };

  const handlePlanDeleted = () => {
    refetchPlans();
    toast.success("Pricing plan deleted successfully");
  };

  const handlePromoCodeCreated = () => {
    setPromoOpen(false);
    refetchPromoCodes();
    toast.success("Promo code created successfully");
  };

  const handlePromoCodeUpdated = () => {
    refetchPromoCodes();
    toast.success("Promo code updated successfully");
  };

  const handlePromoCodeDeleted = () => {
    refetchPromoCodes();
    toast.success("Promo code deleted successfully");
  };

  const subscriptionPlans = plans.filter(
    (plan) => plan.type === "subscription"
  );
  const creditPlans = plans.filter((plan) => plan.type === "credit");

  return (
    <div className="space-y-8">
      <Tabs
        defaultValue="credit"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="credit" className="text-sm font-medium">
            Credit Plans
          </TabsTrigger>
          <TabsTrigger value="subscription" className="text-sm font-medium">
            Subscription Plans
          </TabsTrigger>
          <TabsTrigger value="promocodes" className="text-sm font-medium">
            Promo Codes
          </TabsTrigger>
        </TabsList>

        <div className="flex justify-between items-center mt-8 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {activeTab === "promocodes"
                ? "Manage Promo Codes"
                : activeTab === "subscription"
                  ? "Manage Subscription Plans"
                  : "Manage Credit Plans"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === "promocodes"
                ? "Create and manage promotional discount codes"
                : activeTab === "subscription"
                  ? "Configure subscription-based pricing plans"
                  : "Set up credit-based pricing options"}
            </p>
          </div>

          {activeTab === "promocodes" ? (
            <Dialog open={promoOpen} onOpenChange={setPromoOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-lg">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Promo Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Promo Code</DialogTitle>
                </DialogHeader>
                <CreatePromoCodeForm onSuccess={handlePromoCodeCreated} />
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-lg">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Pricing Plan</DialogTitle>
                </DialogHeader>
                <CreatePricingForm onSuccess={handlePlanCreated} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="subscription" className="mt-6">
          <div className="bg-card rounded-lg border shadow-sm">
            <PricingTable
              plans={subscriptionPlans}
              loading={plansLoading}
              onPlanUpdated={handlePlanUpdated}
              onPlanDeleted={handlePlanDeleted}
            />
          </div>
        </TabsContent>
        <TabsContent value="credit" className="mt-6">
          <div className="bg-card rounded-lg border shadow-sm">
            <PricingTable
              plans={creditPlans}
              loading={plansLoading}
              onPlanUpdated={handlePlanUpdated}
              onPlanDeleted={handlePlanDeleted}
            />
          </div>
        </TabsContent>
        <TabsContent value="promocodes" className="mt-6">
          <div className="bg-card rounded-lg border shadow-sm">
            <PromoCodeTable
              promoCodes={promoCodes}
              loading={promoLoading}
              onPromoCodeUpdated={handlePromoCodeUpdated}
              onPromoCodeDeleted={handlePromoCodeDeleted}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
