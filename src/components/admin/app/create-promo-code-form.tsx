"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createPromoCode } from "@/lib/actions";

interface CreatePromoCodeFormProps {
  onSuccess: () => void;
}

const formSchema = z.object({
  code: z
    .string()
    .min(3, {
      message: "Code must be at least 3 characters.",
    })
    .toUpperCase(),
  description: z.string().optional(),
  discountPercent: z.coerce.number().min(1).max(100, {
    message: "Discount must be between 1 and 100.",
  }),
  isActive: z.boolean().default(true),
  appliesTo: z.enum(["subscription", "credit", "both"], {
    required_error: "You need to select what this promo code applies to.",
  }),
  usageLimit: z.coerce.number().optional(),
  validFrom: z.string().min(1, {
    message: "Valid from date is required.",
  }),
  validUntil: z.string().min(1, {
    message: "Valid until date is required.",
  }),
});

export function CreatePromoCodeForm({ onSuccess }: CreatePromoCodeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date to YYYY-MM-DD for input fields
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const today = formatDateForInput(new Date());
  const nextMonth = formatDateForInput(
    new Date(new Date().setMonth(new Date().getMonth() + 1))
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      description: "",
      discountPercent: 10,
      isActive: true,
      appliesTo: "both",
      usageLimit: undefined,
      validFrom: today,
      validUntil: nextMonth,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      // Convert dates to ISO strings
      const formattedValues = {
        ...values,
        validFrom: new Date(values.validFrom).toISOString(),
        validUntil: new Date(values.validUntil).toISOString(),
      };

      await createPromoCode(formattedValues);
      onSuccess();
      form.reset();
    } catch {
      toast("Failed to create promo code");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Promo Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="SUMMER2025"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormDescription>
                Enter a unique code for customers to use
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Summer promotion discount" {...field} />
              </FormControl>
              <FormDescription>
                Optional description of the promo code
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="discountPercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount (%)</FormLabel>
              <FormControl>
                <Input type="number" min="1" max="100" {...field} />
              </FormControl>
              <FormDescription>Percentage discount to apply</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appliesTo"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Applies To</FormLabel>
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
                    <FormLabel className="font-normal">
                      Subscription Plans Only
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="credit" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Credit Plans Only
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="both" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Both Plan Types
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="usageLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usage Limit</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Maximum number of times this code can be used (leave empty for
                unlimited)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="validFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid From</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="validUntil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid Until</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Make this promo code available to customers
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
          {isSubmitting ? "Creating..." : "Create Promo Code"}
        </Button>
      </form>
    </Form>
  );
}
