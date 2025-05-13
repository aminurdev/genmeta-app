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
import { Loader2, Plus, Pencil, Trash2, Calendar, Tag } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Define the promo code schema
const promoCodeSchema = z
  .object({
    code: z.string().min(1, "Code is required").toUpperCase(),
    description: z.string().min(1, "Description is required"),
    discountPercent: z.coerce
      .number()
      .min(1, "Discount must be at least 1%")
      .max(100, "Discount cannot exceed 100%"),
    isActive: z.boolean().default(true),
    appliesTo: z.enum(["subscription", "credit", "both"]),
    usageLimit: z.coerce
      .number()
      .nullable()
      .transform((val) => (val === 0 ? null : val)),
    validFrom: z.date(),
    validUntil: z.date(),
  })
  .refine((data) => data.validFrom < data.validUntil, {
    message: "End date must be after start date",
    path: ["validUntil"],
  });

type PromoCode = z.infer<typeof promoCodeSchema> & {
  _id: string;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
};

interface PromoCodesTabProps {
  setError: (error: string | null) => void;
}

export default function PromoCodesTab({ setError }: PromoCodesTabProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPromoCode, setCurrentPromoCode] = useState<PromoCode | null>(
    null
  );
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterActive, setFilterActive] = useState<string | null>(null);
  const [filterAppliesTo, setFilterAppliesTo] = useState<string | null>(null);

  const form = useForm<z.infer<typeof promoCodeSchema>>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: "",
      description: "",
      discountPercent: 10,
      isActive: true,
      appliesTo: "both",
      usageLimit: null,
      validFrom: new Date(),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    },
  });

  // Fetch promo codes
  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      let url = `${baseApi}/promo-codes`;
      const params = new URLSearchParams();

      if (filterActive !== null) {
        params.append("active", filterActive);
      }

      if (filterAppliesTo !== null) {
        params.append("appliesTo", filterAppliesTo);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch promo codes");
      }

      const data = await response.json();
      if (data.success) {
        setPromoCodes(data.data.promoCodes);
      } else {
        throw new Error(data.message || "Failed to fetch promo codes");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast(err instanceof Error ? err.message : "Failed to fetch promo codes");
    } finally {
      setLoading(false);
    }
  };

  // Create a new promo code
  const createPromoCode = async (values: z.infer<typeof promoCodeSchema>) => {
    try {
      setSubmitting(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const payload = {
        ...values,
        validFrom: values.validFrom.toISOString(),
        validUntil: values.validUntil.toISOString(),
      };

      const response = await fetch(`${baseApi}/promo-codes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create promo code");
      }

      const data = await response.json();
      if (data.success) {
        toast("Promo code created successfully");
        fetchPromoCodes();
        setOpenDialog(false);
        form.reset();
      } else {
        throw new Error(data.message || "Failed to create promo code");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast(err instanceof Error ? err.message : "Failed to create promo code");
    } finally {
      setSubmitting(false);
    }
  };

  // Update a promo code
  const updatePromoCode = async (values: z.infer<typeof promoCodeSchema>) => {
    if (!currentPromoCode) return;

    try {
      setSubmitting(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const payload = {
        ...values,
        validFrom: values.validFrom.toISOString(),
        validUntil: values.validUntil.toISOString(),
      };

      const response = await fetch(
        `${baseApi}/promo-codes/${currentPromoCode._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update promo code");
      }

      const data = await response.json();
      if (data.success) {
        toast("Promo code updated successfully");
        fetchPromoCodes();
        setOpenDialog(false);
        form.reset();
      } else {
        throw new Error(data.message || "Failed to update promo code");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast(err instanceof Error ? err.message : "Failed to update promo code");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a promo code
  const deletePromoCode = async () => {
    if (!currentPromoCode) return;

    try {
      setSubmitting(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${baseApi}/promo-codes/${currentPromoCode._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete promo code");
      }

      const data = await response.json();
      if (data.success) {
        toast("Promo code deleted successfully");
        fetchPromoCodes();
        setDeleteDialogOpen(false);
      } else {
        throw new Error(data.message || "Failed to delete promo code");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast(err instanceof Error ? err.message : "Failed to delete promo code");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission
  const onSubmit = (values: z.infer<typeof promoCodeSchema>) => {
    if (isCreating) {
      createPromoCode(values);
    } else if (isEditing) {
      updatePromoCode(values);
    }
  };

  // Open create dialog
  const handleCreateClick = () => {
    setIsCreating(true);
    setIsEditing(false);
    setCurrentPromoCode(null);
    form.reset({
      code: "",
      description: "",
      discountPercent: 10,
      isActive: true,
      appliesTo: "both",
      usageLimit: null,
      validFrom: new Date(),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    });
    setOpenDialog(true);
  };

  // Open edit dialog
  const handleEditClick = (promoCode: PromoCode) => {
    setIsCreating(false);
    setIsEditing(true);
    setCurrentPromoCode(promoCode);
    form.reset({
      code: promoCode.code,
      description: promoCode.description,
      discountPercent: promoCode.discountPercent,
      isActive: promoCode.isActive,
      appliesTo: promoCode.appliesTo,
      usageLimit: promoCode.usageLimit,
      validFrom: new Date(promoCode.validFrom),
      validUntil: new Date(promoCode.validUntil),
    });
    setOpenDialog(true);
  };

  // Open delete dialog
  const handleDeleteClick = (promoCode: PromoCode) => {
    setCurrentPromoCode(promoCode);
    setDeleteDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString: Date | string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if promo code is expired
  const isExpired = (validUntil: Date | string) => {
    return new Date(validUntil) < new Date();
  };

  // Check if promo code is not yet valid
  const isNotYetValid = (validFrom: Date | string) => {
    return new Date(validFrom) > new Date();
  };

  // Get status of promo code
  const getPromoCodeStatus = (promoCode: PromoCode) => {
    if (!promoCode.isActive) return "inactive";
    if (isExpired(promoCode.validUntil)) return "expired";
    if (isNotYetValid(promoCode.validFrom)) return "upcoming";
    if (
      promoCode.usageLimit !== null &&
      promoCode.usedCount >= promoCode.usageLimit
    )
      return "depleted";
    return "active";
  };

  // Get badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "outline";
      case "expired":
        return "destructive";
      case "upcoming":
        return "secondary";
      case "depleted":
        return "outline";
      default:
        return "outline";
    }
  };

  // Get badge text based on status
  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "expired":
        return "Expired";
      case "upcoming":
        return "Upcoming";
      case "depleted":
        return "Depleted";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Get badge for applies to
  const getAppliesToBadge = (appliesTo: string) => {
    switch (appliesTo) {
      case "subscription":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/10"
          >
            Subscription
          </Badge>
        );
      case "credit":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/10"
          >
            Credit
          </Badge>
        );
      case "both":
        return (
          <Badge
            variant="outline"
            className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/10"
          >
            All Plans
          </Badge>
        );
      default:
        return null;
    }
  };

  // Handle filter change
  const handleFilterChange = () => {
    fetchPromoCodes();
  };

  // Reset filters
  const resetFilters = () => {
    setFilterActive(null);
    setFilterAppliesTo(null);
    fetchPromoCodes();
  };

  // Load promo codes on component mount
  useEffect(() => {
    fetchPromoCodes();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Promo Codes</h2>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Promo Code
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/3">
              <Select
                value={filterActive === null ? "" : filterActive}
                onValueChange={(value) => {
                  setFilterActive(value === "" ? null : value);
                  setTimeout(handleFilterChange, 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-1/3">
              <Select
                value={filterAppliesTo === null ? "" : filterAppliesTo}
                onValueChange={(value) => {
                  setFilterAppliesTo(value === "" ? null : value);
                  setTimeout(handleFilterChange, 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="both">All Plans</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-1/3 flex justify-end">
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : promoCodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">No promo codes found</p>
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Promo Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promoCodes.map((promoCode) => {
            const status = getPromoCodeStatus(promoCode);

            return (
              <Card
                key={promoCode._id}
                className={
                  status === "inactive" || status === "expired"
                    ? "opacity-70"
                    : ""
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        {promoCode.code}
                      </CardTitle>
                      <CardDescription>{promoCode.description}</CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(status)}>
                      {getStatusBadgeText(status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="font-medium text-lg">
                        {promoCode.discountPercent}% OFF
                      </span>
                    </div>

                    <div className="flex items-center">
                      {getAppliesToBadge(promoCode.appliesTo)}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        {formatDate(promoCode.validFrom)} -{" "}
                        {formatDate(promoCode.validUntil)}
                      </span>
                    </div>

                    {promoCode.usageLimit !== null && (
                      <div className="text-sm text-muted-foreground">
                        Usage: {promoCode.usedCount} / {promoCode.usageLimit}
                        {promoCode.usageLimit > 0 && (
                          <div className="w-full bg-secondary h-1.5 mt-1 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (promoCode.usedCount / promoCode.usageLimit) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      Created: {formatDate(promoCode.createdAt)}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(promoCode)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(promoCode)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Create Promo Code" : "Edit Promo Code"}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? "Add a new promo code for your customers."
                : "Make changes to the existing promo code."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SUMMER25"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormDescription>
                      The promo code that customers will enter at checkout.
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
                      <Textarea placeholder="Summer sale 25% off" {...field} />
                    </FormControl>
                    <FormDescription>
                      A brief description of the promo code.
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
                        min="1"
                        max="100"
                        placeholder="25"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The percentage discount to apply.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appliesTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applies To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select what this code applies to" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="subscription">
                          Subscription Plans Only
                        </SelectItem>
                        <SelectItem value="credit">
                          Credit Plans Only
                        </SelectItem>
                        <SelectItem value="both">All Plans</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Which type of plans this promo code can be used with.
                    </FormDescription>
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
                        step="1"
                        min="0"
                        placeholder="100"
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? null
                              : Number.parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of times this code can be used. Leave empty
                      for unlimited uses.
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
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid From</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid Until</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const validFrom = form.getValues("validFrom");
                              return date < validFrom;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Whether this promo code is active and can be used.
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
                  {isCreating ? "Create Promo Code" : "Update Promo Code"}
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
              promo code
              {currentPromoCode && (
                <span className="font-medium">
                  {" "}
                  &quot;{currentPromoCode.code}&quot;
                </span>
              )}
              <span className="font-medium">
                {" "}
                &quot;{currentPromoCode?.code}&quot;
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePromoCode}
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
