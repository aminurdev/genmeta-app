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
import { Loader2, Plus, Pencil, Trash2, Zap } from "lucide-react";
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

// Define the credit plan schema
const creditPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  basePrice: z.coerce.number().min(0, "Price must be a positive number"),
  discountPercent: z.coerce
    .number()
    .min(0, "Discount must be a positive number")
    .max(100, "Discount cannot exceed 100%"),
  isActive: z.boolean().default(true),
  credit: z.coerce.number().min(1, "Credit amount must be at least 1"),
});

type CreditPlan = z.infer<typeof creditPlanSchema> & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};

interface CreditPlansTabProps {
  setError: (error: string | null) => void;
}

export default function CreditPlansTab({ setError }: CreditPlansTabProps) {
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<CreditPlan | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof creditPlanSchema>>({
    resolver: zodResolver(creditPlanSchema),
    defaultValues: {
      name: "",
      basePrice: 0,
      discountPercent: 0,
      isActive: true,
      credit: 0,
    },
  });

  // Fetch credit plans
  const fetchCreditPlans = async () => {
    try {
      setLoading(true);
      const baseApi = await getBaseApi();
      const response = await fetch(`${baseApi}/plans/credit`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch credit plans");
      }

      const data = await response.json();
      if (data.success) {
        setPlans(data.data.plans);
      } else {
        throw new Error(data.message || "Failed to fetch credit plans");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast(
        err instanceof Error ? err.message : "Failed to fetch credit plans"
      );
    } finally {
      setLoading(false);
    }
  };

  // Create a new credit plan
  const createCreditPlan = async (values: z.infer<typeof creditPlanSchema>) => {
    try {
      setSubmitting(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseApi}/plans/credit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to create credit plan");
      }

      const data = await response.json();
      if (data.success) {
        toast("Credit plan created successfully");
        fetchCreditPlans();
        setOpenDialog(false);
        form.reset();
      } else {
        throw new Error(data.message || "Failed to create credit plan");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast(
        err instanceof Error ? err.message : "Failed to create credit plan"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Update a credit plan
  const updateCreditPlan = async (values: z.infer<typeof creditPlanSchema>) => {
    if (!currentPlan) return;

    try {
      setSubmitting(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${baseApi}/plans/credit/${currentPlan._id}`,
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
        throw new Error("Failed to update credit plan");
      }

      const data = await response.json();
      if (data.success) {
        toast("Credit plan updated successfully");
        fetchCreditPlans();
        setOpenDialog(false);
        form.reset();
      } else {
        throw new Error(data.message || "Failed to update credit plan");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast(
        err instanceof Error ? err.message : "Failed to update credit plan"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a credit plan
  const deleteCreditPlan = async () => {
    if (!currentPlan) return;

    try {
      setSubmitting(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${baseApi}/plans/credit/${currentPlan._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete credit plan");
      }

      const data = await response.json();
      if (data.success) {
        toast("Credit plan deleted successfully");
        fetchCreditPlans();
        setDeleteDialogOpen(false);
      } else {
        throw new Error(data.message || "Failed to delete credit plan");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast(
        err instanceof Error ? err.message : "Failed to delete credit plan"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission
  const onSubmit = (values: z.infer<typeof creditPlanSchema>) => {
    if (isCreating) {
      createCreditPlan(values);
    } else if (isEditing) {
      updateCreditPlan(values);
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
      credit: 0,
    });
    setOpenDialog(true);
  };

  // Open edit dialog
  const handleEditClick = (plan: CreditPlan) => {
    setIsCreating(false);
    setIsEditing(true);
    setCurrentPlan(plan);
    form.reset({
      name: plan.name,
      basePrice: plan.basePrice,
      discountPercent: plan.discountPercent,
      isActive: plan.isActive,
      credit: plan.credit,
    });
    setOpenDialog(true);
  };

  // Open delete dialog
  const handleDeleteClick = (plan: CreditPlan) => {
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

  // Calculate price per credit
  const calculatePricePerCredit = (price: number, credits: number) => {
    if (credits === 0) return 0;
    return price / credits;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Load credit plans on component mount
  useEffect(() => {
    fetchCreditPlans();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Credit Plans</h2>
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
            <p className="text-muted-foreground mb-4">No credit plans found</p>
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
                    <CardDescription>One-time purchase</CardDescription>
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

                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-1 text-amber-500" />
                    <span className="font-medium">{plan.credit} credits</span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(
                      calculatePricePerCredit(
                        calculateDiscountedPrice(
                          plan.basePrice,
                          plan.discountPercent
                        ),
                        plan.credit
                      )
                    )}{" "}
                    per credit
                  </div>

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
              {isCreating ? "Create Credit Plan" : "Edit Credit Plan"}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? "Add a new credit plan to your pricing options."
                : "Make changes to the existing credit plan."}
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
                      <Input placeholder="Basic Credits" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the credit plan.
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
                        placeholder="19.99"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The base price of the credit plan.
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
                name="credit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="100"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The number of credits included in this plan.
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
              credit plan
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
              onClick={deleteCreditPlan}
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
