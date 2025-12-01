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
import { PromoCode, updatePromoCode } from "@/services/admin-dashboard";
import { toast } from "sonner";

interface EditPromoCodeFormProps {
  promoCode: PromoCode;
  onSuccess: () => void;
}

const formSchema = z.object({
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

export function EditPromoCodeForm({
  promoCode,
  onSuccess,
}: EditPromoCodeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date for input fields
  const formatDateForInput = (dateString: string) => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: promoCode.description || "",
      discountPercent: promoCode.discountPercent,
      isActive: promoCode.isActive,
      appliesTo: promoCode.appliesTo,
      usageLimit: promoCode.usageLimit || undefined,
      validFrom: formatDateForInput(promoCode.validFrom),
      validUntil: formatDateForInput(promoCode.validUntil),
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

      await updatePromoCode(promoCode._id, formattedValues);
      onSuccess();
    } catch {
      toast("Failed to update promo code");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
        <div className="bg-muted p-3 rounded-md mb-4">
          <p className="text-sm font-medium">Promo Code: {promoCode.code}</p>
          <p className="text-xs text-muted-foreground">
            Used {promoCode.usedCount} times
          </p>
        </div>

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
          {isSubmitting ? "Updating..." : "Update Promo Code"}
        </Button>
      </form>
    </Form>
  );
}
