"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Infinity as InfinityIcon,
  KeyRound,
  Loader2,
  UserPlus,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import {
  useCreateAppUserMutation,
  usePricingPlansQuery,
} from "@/services/queries/admin-dashboard";
import type { PricingPlan } from "@/services/admin-dashboard";
import type { CreateAppUserPayload, CreateAppUserResponse } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface CreateAppUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (created: CreateAppUserResponse) => void;
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

function generateSecurePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function CreateAppUserForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: (created: CreateAppUserResponse) => void;
}) {
  const [accountMode, setAccountMode] = useState<"existing" | "new">("existing");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

  const [planMode, setPlanMode] = useState<"free" | "package" | "custom">("free");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [customPlanType, setCustomPlanType] = useState<"credit" | "subscription">(
    "subscription"
  );
  const [expiryDays, setExpiryDays] = useState("30");
  const [initialCredit, setInitialCredit] = useState("100");
  const [maxDevices, setMaxDevices] = useState("2");

  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("0");
  const [paymentNote, setPaymentNote] = useState("");

  const [createdResult, setCreatedResult] =
    useState<CreateAppUserResponse | null>(null);

  const { data: pricingRes, isPending: isPlansLoading } = usePricingPlansQuery({
    isActive: true,
    limit: 100,
    sortBy: "basePrice",
    sortOrder: "asc",
  });

  const createMutation = useCreateAppUserMutation();

  const plans =
    pricingRes?.success && pricingRes.data ? pricingRes.data.plans : [];
  const subscriptionPlans = plans.filter((p) => p.type === "subscription");
  const creditPlans = plans.filter((p) => p.type === "credit");
  const selectedPackage = plans.find((p) => p._id === selectedPlanId) || null;

  const activePlanType: "free" | "credit" | "subscription" =
    planMode === "free"
      ? "free"
      : planMode === "package" && selectedPackage
        ? selectedPackage.type
        : customPlanType;

  const handlePlanModeChange = (nextMode: "free" | "package" | "custom") => {
    setPlanMode(nextMode);
    if (nextMode === "package") {
      const targetPkg = selectedPackage || plans[0] || null;
      if (targetPkg) {
        setSelectedPlanId(targetPkg._id);
        setExpiryDays(String(targetPkg.planDuration || 30));
        if (targetPkg.type === "credit") {
          setInitialCredit(String(targetPkg.credit || 100));
        }
        setPaymentAmount(String(getEffectivePrice(targetPkg)));
      }
    } else if (nextMode === "custom") {
      setSelectedPlanId("");
      setExpiryDays("30");
      if (customPlanType === "credit") {
        setInitialCredit("100");
      }
    } else {
      setRecordPayment(false);
    }
  };

  const handlePackageSelect = (planId: string) => {
    setSelectedPlanId(planId);
    const pkg = plans.find((p) => p._id === planId);
    if (!pkg) return;
    setExpiryDays(String(pkg.planDuration || 30));
    if (pkg.type === "credit") {
      setInitialCredit(String(pkg.credit || 100));
    }
    setPaymentAmount(String(getEffectivePrice(pkg)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Email address is required");
      return;
    }

    if (accountMode === "new") {
      if (name.trim().length < 2) {
        toast.error("Full name must be at least 2 characters");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
    }

    if (planMode === "package" && !selectedPackage) {
      toast.error("Please select a pricing package");
      return;
    }

    const payload: CreateAppUserPayload = {
      username: cleanEmail,
      createAccountIfMissing: accountMode === "new",
      maxDevices: Math.min(20, Math.max(1, Number.parseInt(maxDevices, 10) || 2)),
    };

    if (accountMode === "new") {
      payload.name = name.trim();
      payload.password = password;
      payload.isVerified = isVerified;
    }

    if (planMode === "free") {
      payload.plan = "free";
    } else if (planMode === "package" && selectedPackage) {
      payload.planId = selectedPackage._id;
      const parsedDays = Number.parseInt(expiryDays, 10);
      if (Number.isFinite(parsedDays) && parsedDays > 0) {
        payload.expiryDays = parsedDays;
      }
      if (selectedPackage.type === "credit") {
        const parsedCredit = Number.parseInt(initialCredit, 10);
        if (Number.isFinite(parsedCredit) && parsedCredit >= 0) {
          payload.initialCredit = parsedCredit;
        }
      }
    } else {
      payload.plan = customPlanType;
      const parsedDays = Number.parseInt(expiryDays, 10);
      if (Number.isFinite(parsedDays) && parsedDays >= 0) {
        payload.expiryDays = parsedDays;
      }
      if (customPlanType === "credit") {
        payload.initialCredit = Math.max(
          0,
          Number.parseInt(initialCredit, 10) || 100
        );
      }
    }

    if (activePlanType !== "free" && recordPayment) {
      payload.recordPayment = true;
      payload.paymentAmount = Math.max(0, Number.parseFloat(paymentAmount) || 0);
      if (paymentNote.trim()) {
        payload.paymentNote = paymentNote.trim();
      }
    }

    const res = await createMutation.mutateAsync(payload);
    if (!res.success || !res.data) {
      toast.error(res.message || "Failed to create app user");
      return;
    }

    toast.success(
      res.data.userCreated
        ? "Platform user and desktop profile provisioned"
        : "Desktop profile provisioned"
    );
    setCreatedResult(res.data);
    onSuccess?.(res.data);
  };

  if (createdResult) {
    const profileSlug = encodeURIComponent(createdResult.userId);
    const isUnlimited =
      createdResult.plan?.type === "subscription" ||
      createdResult.credit === null;

    return (
      <div className="space-y-5 py-2">
        <div className="flex flex-col items-center text-center space-y-2 py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">App User Provisioned</h3>
          <p className="text-sm text-muted-foreground">
            Desktop profile is active and ready for{" "}
            <span className="font-medium text-foreground">
              {createdResult.username}
            </span>
            .
          </p>
        </div>

        <div className="rounded-lg border bg-muted/30 divide-y text-sm">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <span className="text-muted-foreground">Account Email</span>
            <span className="font-medium truncate">{createdResult.username}</span>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <span className="text-muted-foreground">Assigned Plan</span>
            <Badge variant="outline" className="capitalize text-xs">
              {createdResult.plan?.name || createdResult.plan?.type || "Free Tier"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <span className="text-muted-foreground">Credits / Quota</span>
            {isUnlimited ? (
              <span className="inline-flex items-center gap-1 font-medium">
                <InfinityIcon className="h-4 w-4 text-primary" />
                Unlimited
              </span>
            ) : (
              <span className="font-mono font-medium">
                {(createdResult.credit ?? 0).toLocaleString()} credits
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <span className="text-muted-foreground">Max Devices</span>
            <span className="font-mono font-medium">
              {createdResult.maxDevices}
            </span>
          </div>
          {createdResult.expiresAt && (
            <div className="flex items-center justify-between gap-2 px-4 py-2.5">
              <span className="text-muted-foreground">Expires</span>
              <span>
                {format(new Date(createdResult.expiresAt), "MMM d, yyyy")}
              </span>
            </div>
          )}
          {createdResult.paymentRecorded && (
            <div className="px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              Manual payment recorded (TrxID: {createdResult.paymentRecorded.trxID}
              ) — ৳{createdResult.paymentRecorded.amount.toLocaleString()} BDT
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCreatedResult(null);
              setEmail("");
              setName("");
              setPassword("");
            }}
          >
            Create Another
          </Button>
          <Button asChild onClick={onClose} className="gap-1.5">
            <Link href={`/admin/users/${profileSlug}`}>
              Open User Profile
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Account Mode Selector */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Target Account
        </Label>
        <Tabs
          value={accountMode}
          onValueChange={(v) => setAccountMode(v as "existing" | "new")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="text-xs sm:text-sm">
              Existing Platform User
            </TabsTrigger>
            <TabsTrigger value="new" className="text-xs sm:text-sm">
              New Account + App User
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Account Fields */}
      <div className="space-y-3 rounded-lg border p-3.5 bg-muted/20">
        <div className="space-y-1.5">
          <Label htmlFor="create-app-email">Email Address</Label>
          <Input
            id="create-app-email"
            type="email"
            placeholder="creator@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <p className="text-[11px] text-muted-foreground">
            {accountMode === "existing"
              ? "Must match a registered platform user's email address."
              : "Creates both the web platform account and desktop profile."}
          </p>
        </div>

        {accountMode === "new" && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="create-app-name">Full Name</Label>
              <Input
                id="create-app-name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="create-app-password">Password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs gap-1"
                  onClick={() => {
                    setPassword(generateSecurePassword());
                    setShowPassword(true);
                  }}
                >
                  <Wand2 className="h-3 w-3" />
                  Generate
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="create-app-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <Label htmlFor="create-app-verified" className="text-sm">
                  Mark Email as Verified
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Allow immediate sign-in without email OTP verification
                </p>
              </div>
              <Switch
                id="create-app-verified"
                checked={isVerified}
                onCheckedChange={setIsVerified}
              />
            </div>
          </div>
        )}
      </div>

      {/* Plan Provisioning */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Initial Plan &amp; Quota
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "free", label: "Free Tier" },
            { id: "package", label: "Pricing Package" },
            { id: "custom", label: "Custom Plan" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
                handlePlanModeChange(opt.id as "free" | "package" | "custom")
              }
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-center",
                planMode === opt.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted/60 text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {planMode === "package" && (
          <div className="space-y-3 rounded-lg border p-3.5 bg-muted/20">
            <div className="space-y-1.5">
              <Label>Select Pricing Package</Label>
              <Select
                value={selectedPlanId}
                onValueChange={handlePackageSelect}
                disabled={isPlansLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isPlansLoading
                        ? "Loading pricing packages..."
                        : plans.length === 0
                          ? "No active pricing plans found"
                          : "Choose a plan"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="create-pkg-days">Duration (Days)</Label>
                  <Input
                    id="create-pkg-days"
                    type="number"
                    min="1"
                    max="3650"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                  />
                </div>
                {selectedPackage.type === "credit" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="create-pkg-credits">Initial Credits</Label>
                    <Input
                      id="create-pkg-credits"
                      type="number"
                      min="0"
                      value={initialCredit}
                      onChange={(e) => setInitialCredit(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {planMode === "custom" && (
          <div className="space-y-3 rounded-lg border p-3.5 bg-muted/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plan Type</Label>
                <Select
                  value={customPlanType}
                  onValueChange={(v) =>
                    setCustomPlanType(v as "credit" | "subscription")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscription">
                      Subscription (Unlimited)
                    </SelectItem>
                    <SelectItem value="credit">Credit Pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-custom-days">Expiry Days</Label>
                <Input
                  id="create-custom-days"
                  type="number"
                  min={customPlanType === "subscription" ? "1" : "0"}
                  max="3650"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                />
              </div>
            </div>

            {customPlanType === "credit" && (
              <div className="space-y-1.5">
                <Label htmlFor="create-custom-credits">Initial Credits</Label>
                <Input
                  id="create-custom-credits"
                  type="number"
                  min="1"
                  value={initialCredit}
                  onChange={(e) => setInitialCredit(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="create-max-devices">Max Desktop Devices</Label>
            <Input
              id="create-max-devices"
              type="number"
              min="1"
              max="20"
              value={maxDevices}
              onChange={(e) => setMaxDevices(e.target.value)}
            />
          </div>
          {activePlanType !== "free" && (
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="create-record-payment" className="text-xs font-medium">
                  Record Payment
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Log manual BDT payment
                </p>
              </div>
              <Switch
                id="create-record-payment"
                checked={recordPayment}
                onCheckedChange={setRecordPayment}
              />
            </div>
          )}
        </div>

        {activePlanType !== "free" && recordPayment && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border p-3 bg-muted/20">
            <div className="space-y-1.5">
              <Label htmlFor="create-pay-amount" className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                Amount (BDT)
              </Label>
              <Input
                id="create-pay-amount"
                type="number"
                min="0"
                step="any"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-pay-note">Payment Note</Label>
              <Input
                id="create-pay-note"
                placeholder="e.g. Manual bKash payment"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending || !email.trim()}
          className="gap-1.5"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Provisioning...
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              Provision App User
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreateAppUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAppUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Provision App User
          </DialogTitle>
          <DialogDescription>
            Create a desktop app profile for an existing account or register a
            new platform user with an initial plan.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CreateAppUserForm
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
