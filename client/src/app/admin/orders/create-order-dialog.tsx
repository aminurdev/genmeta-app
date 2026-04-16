"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusCircle, Search, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/services/api-client";
import { adminCreateOrder } from "@/services/orders";
import type { PricingPlan } from "@/services/admin-dashboard";

const formSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  planId: z.string().min(1, "Please select a plan"),
  amount: z.coerce.number().positive("Amount must be positive").optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SimpleUser {
  id: string;
  name: string;
  email: string;
}

export function CreateOrderDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(userSearch), 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { userId: "", planId: "", notes: "" },
  });

  const selectedPlanId = form.watch("planId");

  const { data: plansData } = useQuery({
    queryKey: ["admin", "pricing", "plans", "active-for-order"],
    queryFn: async () => {
      const res = await api.get("/pricing?isActive=true&limit=100");
      return res.data?.data?.plans as PricingPlan[] | undefined;
    },
    enabled: open,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users", "search-for-order", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20" });
      if (debouncedSearch) params.append("search", debouncedSearch);
      const res = await api.get(`/admin/users/all?${params.toString()}`);
      return res.data?.data?.users as SimpleUser[] | undefined;
    },
    enabled: open,
  });

  const plans = plansData ?? [];
  const users = usersData ?? [];

  // Auto-fill amount when plan changes
  useEffect(() => {
    if (selectedPlanId) {
      const plan = plans.find((p) => p._id === selectedPlanId);
      if (plan) {
        form.setValue("amount", plan.discountPrice ?? plan.basePrice);
      }
    }
  }, [selectedPlanId, plans, form]);

  const mutation = useMutation({
    mutationFn: adminCreateOrder,
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Order created and plan activated successfully");
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
        setOpen(false);
        form.reset();
        setUserSearch("");
      } else {
        toast.error(res.message || "Failed to create order");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create order");
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      userId: values.userId,
      planId: values.planId,
      amount: values.amount,
      notes: values.notes,
    });
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      form.reset();
      setUserSearch("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Manual Order</DialogTitle>
          <DialogDescription>
            Create an order for a user and immediately activate their plan.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* User search + select */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-9"
                      />
                      {usersLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.length === 0 ? (
                          <div className="py-2 px-3 text-sm text-muted-foreground">
                            No users found
                          </div>
                        ) : (
                          users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <span className="font-medium">{user.name}</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                {user.email}
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan select */}
            <FormField
              control={form.control}
              name="planId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan._id} value={plan._id}>
                          <span className="font-medium">{plan.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            ({plan.type}) ৳
                            {(
                              plan.discountPrice ?? plan.basePrice
                            ).toLocaleString()}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (৳)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Auto-filled from plan"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Paid via bank transfer"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create & Activate
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
