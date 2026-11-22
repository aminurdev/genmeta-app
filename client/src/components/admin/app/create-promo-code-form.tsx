"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreatePromoCodeMutation } from "@/services/queries/admin-dashboard";

interface CreatePromoCodeFormProps {
  onSuccess: () => void;
}

const formSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, {
        message: "Code must be at least 3 characters.",
      })
      .toUpperCase(),
    description: z.string().optional(),
    discountPercent: z.coerce
      .number()
      .min(1, "Discount must be at least 1%.")
      .max(100, "Discount cannot exceed 100%."),
    isActive: z.boolean().default(true),
    appliesTo: z.enum(["subscription", "credit", "both"], {
      required_error: "Please select which plans this promo applies to.",
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

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function CreatePromoCodeForm({ onSuccess }: CreatePromoCodeFormProps) {
  const createPromoCodeMutation = useCreatePromoCodeMutation();

  const today = formatDateForInput(new Date());
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const nextMonth = formatDateForInput(nextMonthDate);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      description: "",
      discountPercent: 10,
      isActive: true,
      appliesTo: "both",
      usageLimit: "",
      validFrom: today,
      validUntil: nextMonth,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const trimmedLimit = (values.usageLimit ?? "").trim();
      const usageLimit = trimmedLimit ? Number.parseInt(trimmedLimit, 10) : null;

      const res = await createPromoCodeMutation.mutateAsync({
        code: values.code.trim().toUpperCase(),
        description: values.description?.trim() || "",
        discountPercent: values.discountPercent,
        isActive: values.isActive,
        appliesTo: values.appliesTo,
        usageLimit,
        validFrom: new Date(`${values.validFrom}T00:00:00.000Z`).toISOString(),
        validUntil: new Date(`${values.validUntil}T23:59:59.999Z`).toISOString(),
      });

      if (!res.success) {
        toast.error(res.message || "Failed to create promo code");
        return;
      }

      toast.success("Promo code created successfully");
      form.reset();
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create promo code",
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Promo Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. LAUNCH25"
                  className="font-mono uppercase"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Automatically uppercased for checkout validation
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
                    placeholder="Unlimited"
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
          disabled={createPromoCodeMutation.isPending}
        >
          {createPromoCodeMutation.isPending
            ? "Creating..."
            : "Create Promo Code"}
        </Button>
      </form>
    </Form>
  );
}
