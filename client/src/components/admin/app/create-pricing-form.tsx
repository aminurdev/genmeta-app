"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { createPricingPlan } from "@/lib/actions";
import { toast } from "sonner";

interface CreatePricingFormProps {
  onSuccess: () => void;
}

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    type: z.enum(["subscription", "credit"], {
      required_error: "You need to select a plan type.",
    }),
    basePrice: z.coerce.number().positive({
      message: "Regular price must be a positive number.",
    }),
    discountPrice: z.coerce.number().min(0, {
      message: "Discount price must be a positive number.",
    }),
    isActive: z.boolean().default(true),
    planDuration: z.coerce.number().optional(),
    credit: z.coerce.number().optional(),
  })
  .refine((data) => data.discountPrice <= data.basePrice, {
    message: "Discount price cannot be higher than regular price.",
    path: ["discountPrice"],
  });

export function CreatePricingForm({ onSuccess }: CreatePricingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "subscription",
      basePrice: 0,
      discountPrice: 0,
      isActive: true,
      planDuration: 30,
      credit: undefined,
    },
  });

  const planType = form.watch("type");
  const basePrice = form.watch("basePrice");
  const discountPrice = form.watch("discountPrice");

  useEffect(() => {
    if (basePrice > 0 && discountPrice >= 0) {
      const calculatedPercent = ((basePrice - discountPrice) / basePrice) * 100;
      setDiscountPercent(Math.round(calculatedPercent * 100) / 100);
    }
  }, [basePrice, discountPrice]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      // Validate based on plan type
      if (values.type === "subscription" && !values.planDuration) {
        form.setError("planDuration", {
          message: "Plan duration is required for subscription plans",
        });
        return;
      }

      if (values.type === "credit" && !values.credit) {
        form.setError("credit", {
          message: "Credit amount is required for credit plans",
        });
        return;
      }

      await createPricingPlan(values);
      onSuccess();
      form.reset();
    } catch {
      toast("Failed to create pricing plan");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan Name</FormLabel>
              <FormControl>
                <Input placeholder="Premium Monthly" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Plan Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="subscription" />
                    </FormControl>
                    <FormLabel className="font-normal">Subscription</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="credit" />
                    </FormControl>
                    <FormLabel className="font-normal">Credit</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="basePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Regular Price ($)</FormLabel>
              <FormControl>
                <Input type="number" step="1" min="0" {...field} />
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
              <FormLabel>Discount Price ($)</FormLabel>
              <FormControl>
                <Input type="number" step="1" min="0" {...field} />
              </FormControl>
              <FormDescription>
                Final price after discount. Discount:{" "}
                {discountPercent.toFixed(2)}%
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {planType === "subscription" && (
          <FormField
            control={form.control}
            name="planDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (days)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormDescription>
                  Number of days the subscription is valid for
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {planType === "credit" && (
          <FormField
            control={form.control}
            name="credit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credits</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormDescription>
                  Number of credits included in this plan
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Make this pricing plan available to customers
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Plan"}
        </Button>
      </form>
    </Form>
  );
}
