"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Pencil,
  PlusCircle,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import type { PromoCode, PromoCodeLifecycleStatus } from "@/types/admin";
import {
  useDeletePromoCodeMutation,
  useUpdatePromoCodeMutation,
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
import { Progress } from "@/components/ui/progress";
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
import { EditPromoCodeForm } from "./edit-promo-code-form";

interface PromoCodeTableProps {
  promoCodes: PromoCode[];
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
  onPromoCodeUpdated?: () => void;
  onPromoCodeDeleted?: () => void;
  onCreateClick?: () => void;
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getNumericUsedCount(promo: PromoCode): number {
  if (Array.isArray(promo.usedCount)) return promo.usedCount.length;
  return Number(promo.usedCount) || 0;
}

function resolveLifecycleStatus(promo: PromoCode): PromoCodeLifecycleStatus {
  if (promo.lifecycleStatus) return promo.lifecycleStatus;
  if (!promo.isActive) return "inactive";
  const now = new Date();
  if (promo.validUntil && now > new Date(promo.validUntil)) return "expired";
  if (promo.validFrom && now < new Date(promo.validFrom)) return "scheduled";
  const used = getNumericUsedCount(promo);
  if (
    promo.usageLimit !== null &&
    promo.usageLimit !== undefined &&
    used >= promo.usageLimit
  ) {
    return "exhausted";
  }
  return "live";
}

function getLifecycleBadge(status: PromoCodeLifecycleStatus) {
  switch (status) {
    case "live":
      return {
        label: "Live",
        className:
          "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
      };
    case "scheduled":
      return {
        label: "Scheduled",
        className:
          "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400",
      };
    case "expired":
      return {
        label: "Expired",
        className:
          "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400",
      };
    case "exhausted":
      return {
        label: "Exhausted",
        className:
          "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
      };
    default:
      return {
        label: "Inactive",
        className: "bg-muted text-muted-foreground border-border",
      };
  }
}

function getAppliesToBadge(appliesTo: string) {
  switch (appliesTo) {
    case "subscription":
      return <Badge variant="secondary">Subscription</Badge>;
    case "credit":
      return <Badge variant="outline">Credit Packs</Badge>;
    case "both":
      return <Badge variant="outline">All Plans</Badge>;
    default:
      return <Badge variant="outline">{appliesTo}</Badge>;
  }
}

export function PromoCodeTable({
  promoCodes,
  loading,
  isFetching = false,
  skeletonRows = 10,
  pagination,
  onPageChange,
  onLimitChange,
  onPromoCodeUpdated,
  onPromoCodeDeleted,
  onCreateClick,
}: PromoCodeTableProps) {
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(
    null,
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [promoCodeToDelete, setPromoCodeToDelete] = useState<PromoCode | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const deletePromoCodeMutation = useDeletePromoCodeMutation();
  const updatePromoCodeMutation = useUpdatePromoCodeMutation();

  const handleCopyCode = async (promo: PromoCode) => {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopiedId(promo._id);
      toast.success(`Copied ${promo.code}`);
      setTimeout(() => {
        setCopiedId((prev) => (prev === promo._id ? null : prev));
      }, 1800);
    } catch {
      toast.error("Failed to copy promo code");
    }
  };

  const handleEdit = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode);
    setIsEditOpen(true);
  };

  const handleToggleActive = async (promoCode: PromoCode) => {
    setTogglingId(promoCode._id);
    try {
      const res = await updatePromoCodeMutation.mutateAsync({
        id: promoCode._id,
        data: { isActive: !promoCode.isActive },
      });
      if (!res.success) {
        toast.error(res.message || "Failed to update promo code status");
        return;
      }
      toast.success(
        `${promoCode.code} marked as ${!promoCode.isActive ? "Active" : "Inactive"}`,
      );
      onPromoCodeUpdated?.();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update promo code status",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!promoCodeToDelete) return;

    try {
      const res = await deletePromoCodeMutation.mutateAsync(
        promoCodeToDelete._id,
      );
      if (!res.success) {
        toast.error(res.message || "Failed to delete promo code");
        return;
      }
      toast.success(`Promo code "${promoCodeToDelete.code}" deleted`);
      setPromoCodeToDelete(null);
      onPromoCodeDeleted?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete promo code",
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
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Validity Period</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: skeletonRows }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-6 w-24 rounded-md" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-9 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
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
              <div className="flex justify-between">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-2 w-full rounded-full" />
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

  if (promoCodes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 px-4 text-center space-y-3">
        <Tag className="h-9 w-9 text-muted-foreground/50 mx-auto" />
        <div className="space-y-1">
          <p className="font-medium">No promo codes found</p>
          <p className="text-sm text-muted-foreground">
            Adjust your filters or create a new promotional campaign code.
          </p>
        </div>
        {onCreateClick && (
          <Button size="sm" onClick={onCreateClick} className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            <span>Add Promo Code</span>
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
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Validity Period</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((promoCode) => {
                const usedCount = getNumericUsedCount(promoCode);
                const lifecycle = resolveLifecycleStatus(promoCode);
                const statusInfo = getLifecycleBadge(lifecycle);
                const usagePct =
                  promoCode.usageLimit && promoCode.usageLimit > 0
                    ? Math.min(100, (usedCount / promoCode.usageLimit) * 100)
                    : 0;

                return (
                  <TableRow key={promoCode._id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="space-y-1 max-w-[230px]">
                        <div className="flex items-center gap-1.5">
                          <code className="bg-muted px-2 py-0.5 rounded border text-xs font-mono font-semibold">
                            {promoCode.code}
                          </code>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyCode(promoCode)}
                            aria-label="Copy promo code"
                          >
                            {copiedId === promoCode._id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {promoCode.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {promoCode.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 tabular-nums"
                      >
                        {promoCode.discountPercent}% OFF
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {getAppliesToBadge(promoCode.appliesTo)}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(promoCode.validFrom)} &ndash;{" "}
                      {formatDate(promoCode.validUntil)}
                    </TableCell>

                    <TableCell>
                      <div className="w-28 space-y-1">
                        <div className="text-xs font-medium tabular-nums">
                          {usedCount.toLocaleString()} /{" "}
                          {promoCode.usageLimit
                            ? promoCode.usageLimit.toLocaleString()
                            : "∞"}
                        </div>
                        {promoCode.usageLimit ? (
                          <Progress value={usagePct} className="h-1.5" />
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={promoCode.isActive}
                          onCheckedChange={() => handleToggleActive(promoCode)}
                          disabled={togglingId === promoCode._id}
                          aria-label={`Toggle ${promoCode.code} active status`}
                        />
                        <Badge
                          variant="outline"
                          className={cn(statusInfo.className)}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(promoCode)}
                          className="h-8 px-2.5 text-xs gap-1.5"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setPromoCodeToDelete(promoCode)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={`Delete ${promoCode.code}`}
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
          {promoCodes.map((promoCode) => {
            const usedCount = getNumericUsedCount(promoCode);
            const lifecycle = resolveLifecycleStatus(promoCode);
            const statusInfo = getLifecycleBadge(lifecycle);
            const usagePct =
              promoCode.usageLimit && promoCode.usageLimit > 0
                ? Math.min(100, (usedCount / promoCode.usageLimit) * 100)
                : 0;

            return (
              <div key={promoCode._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <code className="bg-muted px-2 py-0.5 rounded border text-sm font-mono font-semibold">
                        {promoCode.code}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(promoCode)}
                        aria-label="Copy promo code"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedId === promoCode._id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    {promoCode.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {promoCode.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(statusInfo.className)}
                    >
                      {statusInfo.label}
                    </Badge>
                    <Switch
                      checked={promoCode.isActive}
                      onCheckedChange={() => handleToggleActive(promoCode)}
                      disabled={togglingId === promoCode._id}
                      aria-label={`Toggle ${promoCode.code} active status`}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 text-xs"
                  >
                    {promoCode.discountPercent}% OFF
                  </Badge>
                  {getAppliesToBadge(promoCode.appliesTo)}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      {formatDate(promoCode.validFrom)} &ndash;{" "}
                      {formatDate(promoCode.validUntil)}
                    </span>
                    <span className="font-medium text-foreground tabular-nums">
                      {usedCount.toLocaleString()} /{" "}
                      {promoCode.usageLimit
                        ? promoCode.usageLimit.toLocaleString()
                        : "∞"}
                    </span>
                  </div>
                  {promoCode.usageLimit ? (
                    <Progress value={usagePct} className="h-1.5" />
                  ) : null}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(promoCode)}
                    className="flex-1 h-8 text-xs gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Promo Code
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPromoCodeToDelete(promoCode)}
                    className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    aria-label="Delete promo code"
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
              {pagination.total.toLocaleString()} promo codes
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
          if (!open) setEditingPromoCode(null);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promo Code</DialogTitle>
          </DialogHeader>
          {isEditOpen && editingPromoCode && (
            <EditPromoCodeForm
              key={editingPromoCode._id}
              promoCode={editingPromoCode}
              onSuccess={() => {
                setIsEditOpen(false);
                setEditingPromoCode(null);
                onPromoCodeUpdated?.();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog
        open={Boolean(promoCodeToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletePromoCodeMutation.isPending) {
            setPromoCodeToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete promo
              code{" "}
              <span className="font-mono font-semibold text-foreground">
                {promoCodeToDelete?.code}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePromoCodeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePromoCodeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePromoCodeMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
