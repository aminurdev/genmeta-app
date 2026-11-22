"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Infinity as InfinityIcon,
  Loader2,
  Package,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  usePricingPlansQuery,
  useUpdateAppUserMutation,
} from "@/services/queries/admin-dashboard";
import type { PricingPlan } from "@/services/admin-dashboard";
import type { UpdateAppUserPayload } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface UpgradePlanTargetUser {
  userId?: string;
  username: string;
  name?: string;
  email?: string;
  key?: string | null;
  status?: string;
  isActive?: boolean;
  maxDevices?: number;
  credit?: number | null;
  expiresAt?: string | null;
  plan?: {
    type: "free" | "credit" | "subscription" | string;
    id?: string | null;
    name?: string;
  } | null;
}

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UpgradePlanTargetUser | null;
  onSuccess?: () => void;
}

function getEffectivePrice(plan: PricingPlan): number {
  if (
    typeof plan.discountPrice === "number" &&
    plan.discountPrice >= 0 &&
    plan.discountPrice < plan.basePrice
  ) {
    return plan.discountPrice;
  }
  return plan.basePrice;
}

function UpgradePlanForm({
  user,
  onClose,
  onSuccess,
}: {
  user: UpgradePlanTargetUser;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const initialPlanType =
    user.plan?.type === "subscription" || user.plan?.type === "credit"
      ? user.plan.type
      : "free";

  const [mode, setMode] = useState<"package" | "custom">("package");
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    user.plan?.id || ""
  );
  const [customPlanType, setCustomPlanType] = useState<
    "free" | "credit" | "subscription"
  >(initialPlanType);
  const [upgradeMode, setUpgradeMode] = useState<"replace" | "extend">(
    "replace"
  );
  const [expiryDays, setExpiryDays] = useState("30");
  const [creditAmount, setCreditAmount] = useState(
    user.credit !== null && user.credit !== undefined
      ? String(user.credit)
      : "100"
  );
  const [maxDevices, setMaxDevices] = useState(String(user.maxDevices || 2));

  const isSuspended =
    user.status === "suspended" || user.isActive === false;
  const [reactivate, setReactivate] = useState(isSuspended);
  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("0");
  const [paymentNote, setPaymentNote] = useState("");
  const [triggerReferralReward, setTriggerReferralReward] = useState(false);
  const [reason, setReason] = useState("");

  const { data: pricingRes, isLoading: isPlansLoading } = usePricingPlansQuery({
    isActive: true,
    limit: 100,
    sortBy: "basePrice",
    sortOrder: "asc",
  });

  const updateMutation = useUpdateAppUserMutation();

  const plans =
    pricingRes?.success && pricingRes.data ? pricingRes.data.plans : [];
  const subscriptionPlans = plans.filter((p) => p.type === "subscription");
  const creditPlans = plans.filter((p) => p.type === "credit");
  const selectedPackage = plans.find((p) => p._id === selectedPlanId) || null;

  const targetPlanType: "free" | "credit" | "subscription" =
    mode === "package"
      ? selectedPackage?.type || initialPlanType
      : customPlanType;

  const handleSelectPackage = (planId: string) => {
    setSelectedPlanId(planId);
    const pkg = plans.find((p) => p._id === planId);
    if (!pkg) return;
    setExpiryDays(String(pkg.planDuration || 30));
    if (pkg.type === "credit") {
      setCreditAmount(String(pkg.credit || 100));
    }
    setPaymentAmount(String(getEffectivePrice(pkg)));
  };

  const handleModeSwitch = (nextMode: "package" | "custom") => {
    setMode(nextMode);
    if (nextMode === "package") {
      const fallbackPkg = selectedPackage || plans[0] || null;
      if (fallbackPkg) {
        handleSelectPackage(fallbackPkg._id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "package" && !selectedPackage) {
      toast.error("Select a pricing package or switch to Custom / Free mode");
      return;
    }

    const payload: UpdateAppUserPayload = {
      username: user.username,
      ...(user.key ? { key: user.key } : {}),
      ...(user.userId ? { userId: user.userId } : {}),
      upgradeMode,
      maxDevices: Math.min(20, Math.max(1, Number.parseInt(maxDevices, 10) || 2)),
      reactivate: isSuspended ? reactivate : false,
    };

    if (mode === "package" && selectedPackage) {
      payload.planId = selectedPackage._id;
      const parsedDays = Number.parseInt(expiryDays, 10);
      if (Number.isFinite(parsedDays) && parsedDays > 0) {
        payload.expiryDays = parsedDays;
      }
      if (selectedPackage.type === "credit") {
        const parsedCredit = Number.parseInt(creditAmount, 10);
        if (Number.isFinite(parsedCredit) && parsedCredit >= 0) {
          payload.credit = parsedCredit;
        }
      }
    } else {
      payload.plan = customPlanType;
      if (customPlanType !== "free") {
        const parsedDays = Number.parseInt(expiryDays, 10);
        if (Number.isFinite(parsedDays) && parsedDays >= 0) {
          payload.expiryDays = parsedDays;
        }
      }
      if (customPlanType === "credit" || customPlanType === "free") {
        const parsedCredit = Number.parseInt(creditAmount, 10);
        if (Number.isFinite(parsedCredit) && parsedCredit >= 0) {
          payload.credit = parsedCredit;
        }
      }
    }

    if (targetPlanType !== "free" && recordPayment) {
      payload.recordPayment = true;
      payload.paymentAmount = Math.max(0, Number.parseFloat(paymentAmount) || 0);
      if (paymentNote.trim()) {
        payload.paymentNote = paymentNote.trim();
      }
      payload.triggerReferralReward = triggerReferralReward;
    }

    if (reason.trim()) {
      payload.reason = reason.trim();
    }

    const res = await updateMutation.mutateAsync(payload);
    if (!res.success) {
      toast.error(res.message || "Failed to update user plan");
      return;
    }

    toast.success(
      res.data?.paymentRecorded
        ? `Plan updated & manual payment recorded (${res.data.paymentRecorded.trxID})`
        : "User plan & quota updated successfully"
    );
    onSuccess?.();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* User Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {user.name || user.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user.email || user.username}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="capitalize text-xs">
            {user.plan?.name || user.plan?.type || "Free Tier"}
          </Badge>
          {user.plan?.type === "subscription" ? (
            <Badge variant="secondary" className="text-xs gap-1">
              <InfinityIcon className="h-3 w-3" />
              Unlimited
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs font-mono">
              {user.credit ?? 0} cr
            </Badge>
          )}
        </div>
      </div>

      {/* Mode Switch */}
      <Tabs
        value={mode}
        onValueChange={(v) => handleModeSwitch(v as "package" | "custom")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="package" className="gap-1.5 text-xs sm:text-sm">
            <Package className="h-3.5 w-3.5" />
            Pricing Package
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-1.5 text-xs sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Custom / Free Tier
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "package" ? (
        <div className="space-y-3 rounded-lg border p-3.5 bg-muted/20">
          <div className="space-y-1.5">
            <Label>Select Plan Package</Label>
            <Select
              value={selectedPlanId}
              onValueChange={handleSelectPackage}
              disabled={isPlansLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isPlansLoading
                      ? "Loading active plans..."
                      : plans.length === 0
                        ? "No active pricing plans available"
                        : "Choose a subscription or credit package"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subscriptionPlans.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Subscription Plans</SelectLabel>
                    {subscriptionPlans.map((pkg) => (
                      <SelectItem key={pkg._id} value={pkg._id}>
                        {pkg.name} — ৳{getEffectivePrice(pkg).toLocaleString()} (
                        {pkg.planDuration}d · Unlimited)
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {creditPlans.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Credit Packs</SelectLabel>
                    {creditPlans.map((pkg) => (
                      <SelectItem key={pkg._id} value={pkg._id}>
                        {pkg.name} — ৳{getEffectivePrice(pkg).toLocaleString()} (
                        {pkg.credit?.toLocaleString() || 0} credits ·{" "}
                        {pkg.planDuration}d)
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedPackage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="upg-pkg-days">Duration (Days)</Label>
                <Input
                  id="upg-pkg-days"
                  type="number"
                  min="1"
                  max="3650"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                />
              </div>
              {selectedPackage.type === "credit" && (
                <div className="space-y-1.5">
                  <Label htmlFor="upg-pkg-credits">
                    {upgradeMode === "extend" ? "Credits to Add" : "Set Credits"}
                  </Label>
                  <Input
                    id="upg-pkg-credits"
                    type="number"
                    min="0"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border p-3.5 bg-muted/20">
          <div className="space-y-1.5">
            <Label>Plan Type</Label>
            <Select
              value={customPlanType}
              onValueChange={(v) => {
                const next = v as "free" | "credit" | "subscription";
                setCustomPlanType(next);
                if (next === "free") {
                  setCreditAmount("5");
                  setRecordPayment(false);
                } else if (next === "credit" && (!creditAmount || creditAmount === "5")) {
                  setCreditAmount("100");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free Tier (Daily Quota)</SelectItem>
                <SelectItem value="credit">Credit Pack</SelectItem>
                <SelectItem value="subscription">
                  Subscription (Unlimited)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customPlanType !== "free" && (
              <div className="space-y-1.5">
                <Label htmlFor="upg-custom-days">Expiry Days</Label>
                <Input
                  id="upg-custom-days"
                  type="number"
                  min={customPlanType === "subscription" ? "1" : "0"}
                  max="3650"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                />
              </div>
            )}

            {customPlanType !== "subscription" && (
              <div className="space-y-1.5">
                <Label htmlFor="upg-custom-credits">
                  {customPlanType === "credit" && upgradeMode === "extend"
                    ? "Credits to Add"
                    : "Credits"}
                </Label>
                <Input
                  id="upg-custom-credits"
                  type="number"
                  min="0"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade behavior + Max Devices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {targetPlanType !== "free" && (
          <div className="space-y-1.5">
            <Label>Assignment Behavior</Label>
            <div className="grid grid-cols-2 gap-1.5 rounded-lg border p-1 bg-muted/40">
              {(["replace", "extend"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setUpgradeMode(val)}
                  className={cn(
                    "rounded-md py-1.5 text-xs font-medium capitalize transition-colors",
                    upgradeMode === val
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {val === "replace" ? "Replace" : "Extend"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="upg-max-devices">Max Desktop Devices</Label>
          <Input
            id="upg-max-devices"
            type="number"
            min="1"
            max="20"
            value={maxDevices}
            onChange={(e) => setMaxDevices(e.target.value)}
          />
        </div>
      </div>

      {/* Reactivate suspended account */}
      {isSuspended && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5">
          <div className="space-y-0.5 pr-3">
            <Label htmlFor="upg-reactivate" className="text-xs font-medium">
              Reactivate Suspended Desktop Account
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Restore active status immediately when applying this plan
            </p>
          </div>
          <Switch
            id="upg-reactivate"
            checked={reactivate}
            onCheckedChange={setReactivate}
          />
        </div>
      )}

      {/* Optional Manual Payment Logging */}
      {targetPlanType !== "free" && (
        <div className="space-y-3 rounded-lg border p-3.5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 pr-3">
              <Label
                htmlFor="upg-record-payment"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                Record Manual Payment
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Log a completed manual transaction in payment history
              </p>
            </div>
            <Switch
              id="upg-record-payment"
              checked={recordPayment}
              onCheckedChange={setRecordPayment}
            />
          </div>

          {recordPayment && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="upg-pay-amount">Amount (BDT)</Label>
                  <Input
                    id="upg-pay-amount"
                    type="number"
                    min="0"
                    step="any"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="upg-pay-note">Payment Note</Label>
                  <Input
                    id="upg-pay-note"
                    placeholder="e.g. Manual bKash / cash"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={triggerReferralReward}
                  onCheckedChange={(checked) =>
                    setTriggerReferralReward(Boolean(checked))
                  }
                />
                <span>
                  Credit referrer ৳50 bonus if this user has an unrewarded referrer
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Audit Note */}
      <div className="space-y-1.5">
        <Label htmlFor="upg-reason">Audit Note (Optional)</Label>
        <Input
          id="upg-reason"
          placeholder="e.g. Promotional upgrade or support ticket #104"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="gap-1.5"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Apply Plan Update
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function UpgradePlanDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UpgradePlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Upgrade or Change Plan
          </DialogTitle>
          <DialogDescription>
            Assign a pricing package, customize expiry and credits, or switch
            plan tiers manually.
          </DialogDescription>
        </DialogHeader>
        {open && user && (
          <UpgradePlanForm
            key={user.key || user.username}
            user={user}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
