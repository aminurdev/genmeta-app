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
    <div className="space-y-8">
      <Tabs
        defaultValue="subscription"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="subscription" className="text-sm font-medium">
            Subscription Plans
          </TabsTrigger>
          <TabsTrigger value="credit" className="text-sm font-medium">
            Credit Plans
          </TabsTrigger>
          <TabsTrigger value="promocodes" className="text-sm font-medium">
            Promo Codes
          </TabsTrigger>
        </TabsList>

        <div className="flex justify-between items-center mt-8 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === "promocodes"
                ? "Manage Promo Codes"
                : activeTab === "subscription"
                ? "Manage Subscription Plans"
                : "Manage Credit Plans"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
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
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
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
                <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg">
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
          <div className="bg-white rounded-lg border shadow-sm">
            <PricingTable
              plans={subscriptionPlans}
              loading={loading}
              onPlanUpdated={handlePlanUpdated}
              onPlanDeleted={handlePlanDeleted}
            />
          </div>
        </TabsContent>
        <TabsContent value="credit" className="mt-6">
          <div className="bg-white rounded-lg border shadow-sm">
            <PricingTable
              plans={creditPlans}
              loading={loading}
              onPlanUpdated={handlePlanUpdated}
              onPlanDeleted={handlePlanDeleted}
            />
          </div>
        </TabsContent>
        <TabsContent value="promocodes" className="mt-6">
          <div className="bg-white rounded-lg border shadow-sm">
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
