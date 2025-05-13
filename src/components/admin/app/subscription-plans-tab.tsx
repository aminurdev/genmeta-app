"use client";

import { useState, useEffect } from "react";
import { getBaseApi, getAccessToken } from "@/services/image-services";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Define the subscription plan schema
const subscriptionPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  basePrice: z.coerce.number().min(0, "Price must be a positive number"),
  discountPercent: z.coerce
    .number()
    .min(0, "Discount must be a positive number")
    .max(100, "Discount cannot exceed 100%"),
  isActive: z.boolean().default(true),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]),
});

type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema> & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};

interface SubscriptionPlansTabProps {
  setError: (error: string | null) => void;
}

export default function SubscriptionPlansTab({
  setError,
}: SubscriptionPlansTabProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof subscriptionPlanSchema>>({
    resolver: zodResolver(subscriptionPlanSchema),
    defaultValues: {
      name: "",
      basePrice: 0,
      discountPercent: 0,
      isActive: true,
      billingCycle: "monthly",
    },
  });

  // Fetch subscription plans
  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      const baseApi = await getBaseApi();
      const response = await fetch(`${baseApi}/plans/subscription`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subscription plans");
      }

      const data = await response.json();
      if (data.success) {
        setPlans(data.data.plans);
      } else {
        throw new Error(data.message || "Failed to fetch subscription plans");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast(
        err instanceof Error
          ? err.message
          : "Failed to fetch subscription plans"
      );
    } finally {
      setLoading(false);
    }
  };

  // Create a new subscription plan
  const createSubscriptionPlan = async (
    values: z.infer<typeof subscriptionPlanSchema>
  ) => {
    try {
      setSubmitting(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseApi}/plans/subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription plan");
      }

      const data = await response.json();
      if (data.success) {
        toast("Subscription plan created successfully");
        fetchSubscriptionPlans();
        setOpenDialog(false);
        form.reset();
      } else {
        throw new Error(data.message || "Failed to create subscription plan");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast(
        err instanceof Error
          ? err.message
          : "Failed to create subscription plan"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Update a subscription plan
  const updateSubscriptionPlan = async (
    values: z.infer<typeof subscriptionPlanSchema>
  ) => {
    if (!currentPlan) return;

    try {
      setSubmitting(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${baseApi}/plans/subscription/${currentPlan._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update subscription plan");
      }

      const data = await response.json();
      if (data.success) {
        toast("Subscription plan updated successfully");
        fetchSubscriptionPlans();
        setOpenDialog(false);
        form.reset();
      } else {
        throw new Error(data.message || "Failed to update subscription plan");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast(
        err instanceof Error
          ? err.message
          : "Failed to update subscription plan"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a subscription plan
  const deleteSubscriptionPlan = async () => {
    if (!currentPlan) return;

    try {
      setSubmitting(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${baseApi}/plans/subscription/${currentPlan._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete subscription plan");
      }

      const data = await response.json();
      if (data.success) {
        toast("Subscription plan deleted successfully");
        fetchSubscriptionPlans();
        setDeleteDialogOpen(false);
      } else {
        throw new Error(data.message || "Failed to delete subscription plan");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast(
        err instanceof Error
          ? err.message
          : "Failed to delete subscription plan"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission
  const onSubmit = (values: z.infer<typeof subscriptionPlanSchema>) => {
    if (isCreating) {
      createSubscriptionPlan(values);
    } else if (isEditing) {
      updateSubscriptionPlan(values);
    }
  };

  // Open create dialog
  const handleCreateClick = () => {
    setIsCreating(true);
    setIsEditing(false);
    setCurrentPlan(null);
    form.reset({
      name: "",
      basePrice: 0,
      discountPercent: 0,
      isActive: true,
      billingCycle: "monthly",
    });
    setOpenDialog(true);
  };

  // Open edit dialog
  const handleEditClick = (plan: SubscriptionPlan) => {
    setIsCreating(false);
    setIsEditing(true);
    setCurrentPlan(plan);
    form.reset({
      name: plan.name,
      basePrice: plan.basePrice,
      discountPercent: plan.discountPercent,
      isActive: plan.isActive,
      billingCycle: plan.billingCycle,
    });
    setOpenDialog(true);
  };

  // Open delete dialog
  const handleDeleteClick = (plan: SubscriptionPlan) => {
    setCurrentPlan(plan);
    setDeleteDialogOpen(true);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate discounted price
  const calculateDiscountedPrice = (
    basePrice: number,
    discountPercent: number
  ) => {
    return basePrice - basePrice * (discountPercent / 100);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Load subscription plans on component mount
  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Subscription Plans</h2>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">
              No subscription plans found
            </p>
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan._id} className={!plan.isActive ? "opacity-70" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.billingCycle.charAt(0).toUpperCase() +
                        plan.billingCycle.slice(1)}{" "}
                      billing
                    </CardDescription>
                  </div>
                  <Badge variant={plan.isActive ? "default" : "outline"}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">
                      {formatCurrency(
                        calculateDiscountedPrice(
                          plan.basePrice,
                          plan.discountPercent
                        )
                      )}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      /
                      {plan.billingCycle === "quarterly"
                        ? "quarterly"
                        : plan.billingCycle === "yearly"
                        ? "year"
                        : "month"}
                    </span>
                  </div>

                  {plan.discountPercent > 0 && (
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground line-through mr-2">
                        {formatCurrency(plan.basePrice)}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-700 hover:bg-green-500/10"
                      >
                        {plan.discountPercent}% off
                      </Badge>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Created: {formatDate(plan.createdAt)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {formatDate(plan.updatedAt)}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(plan)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteClick(plan)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isCreating
                ? "Create Subscription Plan"
                : "Edit Subscription Plan"}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? "Add a new subscription plan to your pricing options."
                : "Make changes to the existing subscription plan."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Pro Monthly" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the subscription plan.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="29.99"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The base price of the subscription plan.
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
                    <FormLabel>Discount Percentage</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The discount percentage to apply to the base price.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a billing cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The billing cycle for this subscription plan.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Whether this plan is active and available for purchase.
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isCreating ? "Create Plan" : "Update Plan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              subscription plan
              {currentPlan && (
                <span className="font-medium">
                  {" "}
                  &quot;{currentPlan.name}&quot;
                </span>
              )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSubscriptionPlan}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
