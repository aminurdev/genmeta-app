"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PricingPlan } from "@/lib/actions";
import { fetchPricingPlans } from "@/lib/actions";
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

export function PricingDashboard() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await fetchPricingPlans();
      setPlans(
        data.plans.map((plan) => ({
          ...plan,
          type: plan.type as "subscription" | "credit",
        }))
      );
    } catch {
      toast("Failed to load pricing plans");
    } finally {
      setLoading(false);
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

  const subscriptionPlans = plans.filter(
    (plan) => plan.type === "subscription"
  );
  const creditPlans = plans.filter((plan) => plan.type === "credit");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Manage Pricing Plans</h2>
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
      </div>

      <Tabs defaultValue="subscription" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscription">Subscription Plans</TabsTrigger>
          <TabsTrigger value="credit">Credit Plans</TabsTrigger>
        </TabsList>
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
      </Tabs>
    </div>
  );
}
