"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PricingPlan } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { deletePricingPlan } from "@/lib/actions";
import { EditPricingForm } from "./edit-pricing-form";
import { toast } from "sonner";

interface PricingTableProps {
  plans: PricingPlan[];
  loading: boolean;
  onPlanUpdated: () => void;
  onPlanDeleted: () => void;
}

export function PricingTable({
  plans,
  loading,
  onPlanUpdated,
  onPlanDeleted,
}: PricingTableProps) {
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const handleEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setIsEditOpen(true);
  };

  const handleDelete = (planId: string) => {
    setPlanToDelete(planId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;

    try {
      await deletePricingPlan(planToDelete);
      onPlanDeleted();
    } catch {
      toast("Failed to delete pricing plan");
    } finally {
      setIsDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const calculateDiscountedPrice = (
    basePrice: number,
    discountPercent: number
  ) => {
    return basePrice - basePrice * (discountPercent / 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md">
        <p className="text-muted-foreground">No pricing plans found</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Base Price</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Final Price</TableHead>
            <TableHead>
              {plans[0]?.type === "subscription"
                ? "Duration (days)"
                : "Credits"}
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan._id}>
              <TableCell className="font-medium">{plan.name}</TableCell>
              <TableCell>{formatCurrency(plan.basePrice)}</TableCell>
              <TableCell>{plan.discountPercent}%</TableCell>
              <TableCell>
                {formatCurrency(
                  calculateDiscountedPrice(plan.basePrice, plan.discountPercent)
                )}
              </TableCell>
              <TableCell>
                {plan.type === "subscription" ? plan.planDuration : plan.credit}
              </TableCell>
              <TableCell>
                <Badge variant={plan.isActive ? "default" : "secondary"}>
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(plan)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(plan._id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Pricing Plan</SheetTitle>
          </SheetHeader>
          {editingPlan && (
            <EditPricingForm
              plan={editingPlan}
              onSuccess={() => {
                setIsEditOpen(false);
                onPlanUpdated();
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              pricing plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
