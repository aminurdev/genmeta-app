"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import type { PromoCode } from "@/types/admin";
import { useUpdatePromoCodeMutation } from "@/services/queries/admin-dashboard";

interface EditPromoCodeFormProps {
  promoCode: PromoCode;
  onSuccess: () => void;
}

const formSchema = z
  .object({
    description: z.string().optional(),
    discountPercent: z.coerce
      .number()
      .min(1, "Discount must be at least 1%.")
      .max(100, "Discount cannot exceed 100%."),
    isActive: z.boolean().default(true),
    appliesTo: z.enum(["subscription", "credit", "both"], {
      required_error: "Please select what this promo code applies to.",
    }),
    usageLimit: z
      .string()
      .optional()
      .refine(
        (val) => {
          const trimmed = (val ?? "").trim();
          if (!trimmed) return true;
          const n = Number(trimmed);
          return Number.isInteger(n) && n >= 1;
        },
        { message: "Usage limit must be a whole number of at least 1." },
      ),
    validFrom: z.string().min(1, {
      message: "Start date is required.",
    }),
    validUntil: z.string().min(1, {
      message: "End date is required.",
    }),
  })
  .refine((data) => new Date(data.validUntil) > new Date(data.validFrom), {
    message: "End date must be after start date.",
    path: ["validUntil"],
  });

function formatDateForInput(dateString: string): string {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return d.toISOString().split("T")[0];
}

export function EditPromoCodeForm({
  promoCode,
  onSuccess,
}: EditPromoCodeFormProps) {
  const updatePromoCodeMutation = useUpdatePromoCodeMutation();

  const numericUsedCount = Array.isArray(promoCode.usedCount)
    ? promoCode.usedCount.length
    : Number(promoCode.usedCount) || 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: promoCode.description || "",
      discountPercent: promoCode.discountPercent,
      isActive: promoCode.isActive,
      appliesTo: promoCode.appliesTo,
      usageLimit:
        promoCode.usageLimit !== null && promoCode.usageLimit !== undefined
          ? String(promoCode.usageLimit)
          : "",
      validFrom: formatDateForInput(promoCode.validFrom),
      validUntil: formatDateForInput(promoCode.validUntil),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const trimmedLimit = (values.usageLimit ?? "").trim();
      const usageLimit = trimmedLimit ? Number.parseInt(trimmedLimit, 10) : null;

      const res = await updatePromoCodeMutation.mutateAsync({
        id: promoCode._id,
        data: {
          description: values.description?.trim() || "",
          discountPercent: values.discountPercent,
          isActive: values.isActive,
          appliesTo: values.appliesTo,
          usageLimit,
          validFrom: new Date(`${values.validFrom}T00:00:00.000Z`).toISOString(),
          validUntil: new Date(`${values.validUntil}T23:59:59.999Z`).toISOString(),
        },
      });

      if (!res.success) {
        toast.error(res.message || "Failed to update promo code");
        return;
      }

      toast.success("Promo code updated successfully");
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update promo code",
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
        <div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold font-mono">{promoCode.code}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              Redeemed {numericUsedCount} time
              {numericUsedCount === 1 ? "" : "s"}
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            {promoCode.lifecycleStatus ||
              (promoCode.isActive ? "live" : "inactive")}
          </Badge>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Seasonal campaign discount"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="discountPercent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount (%)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="100" {...field} />
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
                    placeholder="Unlimited (clear to remove)"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="appliesTo"
          render={({ field }) => (
            <FormItem className="space-y-2.5">
              <FormLabel>Applies To</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border p-2.5">
                    <FormControl>
                      <RadioGroupItem value="both" />
                    </FormControl>
                    <FormLabel className="font-normal text-xs cursor-pointer">
                      Both Types
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border p-2.5">
                    <FormControl>
                      <RadioGroupItem value="credit" />
                    </FormControl>
                    <FormLabel className="font-normal text-xs cursor-pointer">
                      Credit Only
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border p-2.5">
                    <FormControl>
                      <RadioGroupItem value="subscription" />
                    </FormControl>
                    <FormLabel className="font-normal text-xs cursor-pointer">
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3.5">
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium">
                  Active Status
                </FormLabel>
                <FormDescription className="text-xs">
                  Enable this promo code for customer checkout
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
          disabled={updatePromoCodeMutation.isPending}
        >
          {updatePromoCodeMutation.isPending
            ? "Updating..."
            : "Update Promo Code"}
        </Button>
      </form>
    </Form>
  );
}
