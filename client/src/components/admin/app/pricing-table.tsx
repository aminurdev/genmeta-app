"use client";

import { useState } from "react";
import {
  Calendar,
  Coins,
  Infinity as InfinityIcon,
  Pencil,
  PlusCircle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import type { PricingPlan } from "@/types/admin";
import {
  useDeletePricingPlanMutation,
  useUpdatePricingPlanMutation,
} from "@/services/queries/admin-dashboard";
import PaginationView from "@/components/pagination-view";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EditPricingForm } from "./edit-pricing-form";

interface PricingTableProps {
  plans: PricingPlan[];
  planTypeFilter: "all" | "credit" | "subscription";
  loading: boolean;
  isFetching?: boolean;
  skeletonRows?: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onPlanUpdated?: () => void;
  onPlanDeleted?: () => void;
  onCreateClick?: () => void;
}

function formatBDT(amount: number): string {
  return `৳${Number(amount || 0).toLocaleString()}`;
}

function getFinalPrice(plan: PricingPlan): number {
  if (plan.discountPrice !== undefined && plan.discountPrice !== null) {
    return plan.discountPrice;
  }
  return Math.max(
    0,
    plan.basePrice - plan.basePrice * ((plan.discountPercent ?? 0) / 100),
  );
}

export function PricingTable({
  plans,
  planTypeFilter,
  loading,
  isFetching = false,
  skeletonRows = 10,
  pagination,
  onPageChange,
  onLimitChange,
  onPlanUpdated,
  onPlanDeleted,
  onCreateClick,
}: PricingTableProps) {
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PricingPlan | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const deletePricingPlanMutation = useDeletePricingPlanMutation();
  const updatePricingPlanMutation = useUpdatePricingPlanMutation();

  const handleEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setIsEditOpen(true);
  };

  const handleToggleActive = async (plan: PricingPlan) => {
    setTogglingId(plan._id);
    try {
      const res = await updatePricingPlanMutation.mutateAsync({
        id: plan._id,
        data: { isActive: !plan.isActive },
      });
      if (!res.success) {
        toast.error(res.message || "Failed to update plan status");
        return;
      }
      toast.success(
        `${plan.name} marked as ${!plan.isActive ? "Active" : "Inactive"}`,
      );
      onPlanUpdated?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update plan status",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;

    try {
      const res = await deletePricingPlanMutation.mutateAsync(planToDelete._id);
      if (!res.success) {
        toast.error(res.message || "Failed to delete pricing plan");
        return;
      }
      toast.success(`"${planToDelete.name}" deleted successfully`);
      setPlanToDelete(null);
      onPlanDeleted?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete pricing plan",
      );
    }
  };

  const startItem =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="hidden md:block rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Plan</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Quota &amp; Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: skeletonRows }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Skeleton className="h-5 w-24 rounded-md" />
                      <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-9 rounded-full" />
                      <Skeleton className="h-4 w-14" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden divide-y rounded-lg border">
          {Array.from({ length: skeletonRows }).map((_, idx) => (
            <div key={idx} className="p-4 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    const emptyLabel =
      planTypeFilter === "all"
        ? "pricing plans"
        : `${planTypeFilter} plans`;
    return (
      <div className="rounded-lg border border-dashed py-12 px-4 text-center space-y-3">
        <Coins className="h-9 w-9 text-muted-foreground/50 mx-auto" />
        <div className="space-y-1">
          <p className="font-medium">No {emptyLabel} found</p>
          <p className="text-sm text-muted-foreground">
            Adjust your filters or create a new pricing package.
          </p>
        </div>
        {onCreateClick && (
          <Button size="sm" onClick={onCreateClick} className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            <span>
              Add{" "}
              {planTypeFilter === "all"
                ? "Pricing"
                : planTypeFilter === "credit"
                  ? "Credit"
                  : "Subscription"}{" "}
              Plan
            </span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Desktop Table */}
        <div className="hidden md:block rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Plan</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Quota &amp; Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => {
                const finalPrice = getFinalPrice(plan);
                const hasDiscount =
                  (plan.discountPercent ?? 0) > 0 && finalPrice < plan.basePrice;
                const isCredit = plan.type === "credit";

                return (
                  <TableRow key={plan._id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="space-y-1.5">
                        <p className="font-medium text-foreground leading-none">
                          {plan.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 text-[11px] font-medium h-5 px-2",
                            isCredit
                              ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400"
                              : "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400",
                          )}
                        >
                          {isCredit ? (
                            <Coins className="h-3 w-3" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          {isCredit ? "Credit Pack" : "Subscription"}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1 tabular-nums">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {formatBDT(finalPrice)}
                          </span>
                          {hasDiscount && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 text-[10px] h-4 px-1.5"
                            >
                              -{plan.discountPercent}%
                            </Badge>
                          )}
                        </div>
                        {hasDiscount && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatBDT(plan.basePrice)}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isCredit ? (
                          <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-medium tabular-nums">
                            <Coins className="h-3 w-3 text-muted-foreground" />
                            {(plan.credit ?? 0).toLocaleString()} credits
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-medium">
                            <InfinityIcon className="h-3 w-3 text-muted-foreground" />
                            Unlimited
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
                          <Calendar className="h-3 w-3" />
                          {plan.planDuration}d
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={plan.isActive}
                          onCheckedChange={() => handleToggleActive(plan)}
                          disabled={togglingId === plan._id}
                          aria-label={`Toggle ${plan.name} active status`}
                        />
                        <span
                          className={cn(
                            "text-xs font-medium",
                            plan.isActive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                          className="h-8 px-2.5 text-xs gap-1.5"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setPlanToDelete(plan)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={`Delete ${plan.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y rounded-lg border">
          {plans.map((plan) => {
            const finalPrice = getFinalPrice(plan);
            const hasDiscount =
              (plan.discountPercent ?? 0) > 0 && finalPrice < plan.basePrice;
            const isCredit = plan.type === "credit";

            return (
              <div key={plan._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold text-base leading-tight">
                      {plan.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 text-[11px] font-medium h-5 px-2",
                        isCredit
                          ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400"
                          : "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400",
                      )}
                    >
                      {isCredit ? (
                        <Coins className="h-3 w-3" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {isCredit ? "Credit Pack" : "Subscription"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {plan.isActive ? "Active" : "Off"}
                    </span>
                    <Switch
                      checked={plan.isActive}
                      onCheckedChange={() => handleToggleActive(plan)}
                      disabled={togglingId === plan._id}
                      aria-label={`Toggle ${plan.name} active status`}
                    />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-lg font-bold">
                    {formatBDT(finalPrice)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-xs line-through text-muted-foreground">
                        {formatBDT(plan.basePrice)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                      >
                        -{plan.discountPercent}%
                      </Badge>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {isCredit ? (
                    <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2.5 py-1 font-medium tabular-nums">
                      <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                      {(plan.credit ?? 0).toLocaleString()} credits
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2.5 py-1 font-medium">
                      <InfinityIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      Unlimited
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2.5 py-1 text-muted-foreground tabular-nums">
                    <Calendar className="h-3.5 w-3.5" />
                    {plan.planDuration} days
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                    className="flex-1 h-8 text-xs gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Plan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPlanToDelete(plan)}
                    className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    aria-label="Delete plan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Rows</span>
              <Select
                value={String(pagination.limit)}
                onValueChange={(val) => {
                  const next = Number.parseInt(val, 10);
                  if (Number.isFinite(next) && next > 0) onLimitChange(next);
                }}
              >
                <SelectTrigger className="h-8 w-[68px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="tabular-nums">
              Showing {startItem}–{endItem} of{" "}
              {pagination.total.toLocaleString()} plans
            </span>
          </div>

          <PaginationView
            currentPage={pagination.page}
            totalPages={Math.max(1, pagination.totalPages)}
            handlePageChange={onPageChange}
            isLoading={isFetching}
          />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingPlan(null);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pricing Plan</DialogTitle>
          </DialogHeader>
          {isEditOpen && editingPlan && (
            <EditPricingForm
              key={editingPlan._id}
              plan={editingPlan}
              onSuccess={() => {
                setIsEditOpen(false);
                setEditingPlan(null);
                onPlanUpdated?.();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog
        open={Boolean(planToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletePricingPlanMutation.isPending) {
            setPlanToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {planToDelete?.name}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePricingPlanMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePricingPlanMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePricingPlanMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
