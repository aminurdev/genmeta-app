"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import type { PricingPlan } from "@/types/admin";
import { useUpdatePricingPlanMutation } from "@/services/queries/admin-dashboard";

interface EditPricingFormProps {
  plan: PricingPlan;
  onSuccess: () => void;
}

const formSchema = z
  .object({
    name: z.string().trim().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    type: z.enum(["subscription", "credit"], {
      required_error: "You need to select a plan type.",
    }),
    basePrice: z.coerce.number().positive({
      message: "Regular price must be greater than 0.",
    }),
    discountPrice: z.coerce.number().min(0, {
      message: "Final price cannot be negative.",
    }),
    isActive: z.boolean().default(true),
    planDuration: z.coerce.number().int().min(1, {
      message: "Duration must be at least 1 day.",
    }),
    credit: z.coerce.number().optional(),
  })
  .refine((data) => data.discountPrice <= data.basePrice, {
    message: "Final price cannot be higher than regular price.",
    path: ["discountPrice"],
  });

export function EditPricingForm({ plan, onSuccess }: EditPricingFormProps) {
  const updatePricingPlanMutation = useUpdatePricingPlanMutation();

  const initialDiscountPrice =
    plan.discountPrice !== undefined
      ? plan.discountPrice
      : Math.round(
          plan.basePrice * (1 - (plan.discountPercent ?? 0) / 100) * 100,
        ) / 100;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: plan.name,
      type: plan.type,
      basePrice: plan.basePrice,
      discountPrice: initialDiscountPrice,
      isActive: plan.isActive,
      planDuration: plan.planDuration || 30,
      credit: plan.credit ?? undefined,
    },
  });

  const planType = useWatch({ control: form.control, name: "type" });
  const basePrice =
    Number(useWatch({ control: form.control, name: "basePrice" })) || 0;
  const discountPrice =
    Number(useWatch({ control: form.control, name: "discountPrice" })) || 0;

  const savings = Math.max(0, basePrice - discountPrice);
  const discountPercent =
    basePrice > 0 && discountPrice <= basePrice
      ? Math.round(((basePrice - discountPrice) / basePrice) * 10000) / 100
      : 0;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.type === "credit" && (!values.credit || values.credit < 1)) {
      form.setError("credit", {
        message: "Credit amount must be at least 1 for credit plans.",
      });
      return;
    }

    try {
      const res = await updatePricingPlanMutation.mutateAsync({
        id: plan._id,
        data: {
          name: values.name.trim(),
          type: values.type,
          basePrice: values.basePrice,
          discountPrice: values.discountPrice,
          discountPercent,
          isActive: values.isActive,
          planDuration: values.planDuration,
          credit: values.type === "credit" ? values.credit : null,
        },
      });

      if (!res.success) {
        toast.error(res.message || "Failed to update pricing plan");
        return;
      }

      toast.success("Pricing plan updated successfully");
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update pricing plan",
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Premium Monthly" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-2.5">
              <FormLabel>Plan Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-2 gap-3"
                >
                  <FormItem className="flex items-center space-x-2.5 space-y-0 rounded-md border p-3 cursor-pointer">
                    <FormControl>
                      <RadioGroupItem value="credit" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Credit Pack
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2.5 space-y-0 rounded-md border p-3 cursor-pointer">
                    <FormControl>
                      <RadioGroupItem value="subscription" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Subscription
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regular Price (BDT ৳)</FormLabel>
                <FormControl>
                  <Input type="number" step="1" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discountPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Final Price (BDT ৳)</FormLabel>
                <FormControl>
                  <Input type="number" step="1" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Live Price Breakdown */}
        <div className="rounded-lg border bg-muted/40 px-3.5 py-2.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Live Pricing Preview</span>
          <div className="flex items-center gap-2 font-medium tabular-nums">
            {savings > 0 && (
              <span className="line-through text-muted-foreground">
                ৳{basePrice.toLocaleString()}
              </span>
            )}
            <span className="text-sm font-bold text-foreground">
              ৳{discountPrice.toLocaleString()}
            </span>
            <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[11px]">
              {discountPercent.toFixed(1)}% off
            </span>
          </div>
        </div>

        <div
          className={
            planType === "credit"
              ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
              : "grid grid-cols-1 gap-4"
          }
        >
          <FormField
            control={form.control}
            name="planDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (days)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  {planType === "subscription"
                    ? "Validity period per cycle"
                    : "Validity from purchase"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {planType === "credit" && (
            <FormField
              control={form.control}
              name="credit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credits Included</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Credits granted on purchase
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3.5">
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium">
                  Active Status
                </FormLabel>
                <FormDescription className="text-xs">
                  Make this plan visible to customers at checkout
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={updatePricingPlanMutation.isPending}
        >
          {updatePricingPlanMutation.isPending ? "Updating..." : "Update Plan"}
        </Button>
      </form>
    </Form>
  );
}
