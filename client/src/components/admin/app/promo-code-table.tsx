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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { deletePromoCode, PromoCode } from "@/lib/actions";
import { toast } from "sonner";
import { EditPromoCodeForm } from "./edit-promo-code-form";

interface PromoCodeTableProps {
  promoCodes: PromoCode[];
  loading: boolean;
  onPromoCodeUpdated: () => void;
  onPromoCodeDeleted: () => void;
}

export function PromoCodeTable({
  promoCodes,
  loading,
  onPromoCodeUpdated,
  onPromoCodeDeleted,
}: PromoCodeTableProps) {
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(
    null
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promoCodeToDelete, setPromoCodeToDelete] = useState<string | null>(
    null
  );

  const handleEdit = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode);
    setIsEditOpen(true);
  };

  const handleDelete = (promoCodeId: string) => {
    setPromoCodeToDelete(promoCodeId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!promoCodeToDelete) return;

    try {
      await deletePromoCode(promoCodeToDelete);
      onPromoCodeDeleted();
    } catch {
      toast("Failed to delete promo code");
    } finally {
      setIsDeleteDialogOpen(false);
      setPromoCodeToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getAppliesToBadge = (appliesTo: string) => {
    switch (appliesTo) {
      case "subscription":
        return (
          <Badge variant="outline" className="bg-blue-50">
            Subscription
          </Badge>
        );
      case "credit":
        return (
          <Badge variant="outline" className="bg-green-50">
            Credit
          </Badge>
        );
      case "both":
        return (
          <Badge variant="outline" className="bg-purple-50">
            Both
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
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

  if (promoCodes.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md">
        <p className="text-muted-foreground">No promo codes found</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="font-semibold text-gray-900">Code</TableHead>
              <TableHead className="font-semibold text-gray-900">Discount</TableHead>
              <TableHead className="font-semibold text-gray-900">Applies To</TableHead>
              <TableHead className="font-semibold text-gray-900">Valid Period</TableHead>
              <TableHead className="font-semibold text-gray-900">Usage</TableHead>
              <TableHead className="font-semibold text-gray-900">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {promoCodes.map((promoCode) => (
            <TableRow key={promoCode._id}>
              <TableCell className="font-medium">{promoCode.code}</TableCell>
              <TableCell>{promoCode.discountPercent}%</TableCell>
              <TableCell>{getAppliesToBadge(promoCode.appliesTo)}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    From: {formatDate(promoCode.validFrom)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Until: {formatDate(promoCode.validUntil)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {promoCode.usedCount} /{" "}
                {promoCode.usageLimit ? promoCode.usageLimit : "∞"}
              </TableCell>
              <TableCell>
                <Badge variant={promoCode.isActive ? "default" : "secondary"}>
                  {promoCode.isActive ? "Active" : "Inactive"}
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
                    <DropdownMenuItem onClick={() => handleEdit(promoCode)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(promoCode._id)}
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
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promo Code</DialogTitle>
          </DialogHeader>
          {editingPromoCode && (
            <EditPromoCodeForm
              promoCode={editingPromoCode}
              onSuccess={() => {
                setIsEditOpen(false);
                onPromoCodeUpdated();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              promo code.
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
