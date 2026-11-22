"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowUpDown,
  Coins,
  Filter,
  Layers,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  usePricingPlansQuery,
  usePromoCodesQuery,
  useRefreshPricingManagementMutation,
} from "@/services/queries/admin-dashboard";
import type {
  GetPricingPlansParams,
  GetPromoCodesParams,
  PricingPlan,
  PromoCode,
  PromoCodeLifecycleStatus,
} from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CreatePricingForm } from "./create-pricing-form";
import { CreatePromoCodeForm } from "./create-promo-code-form";
import { PricingTable } from "./pricing-table";
import { PromoCodeTable } from "./promo-code-table";

type PlanTypeFilter = "all" | "credit" | "subscription";

function formatRelativeTime(value?: string | null): string {
  if (!value) return "Just now";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Just now";
  return formatDistanceToNow(parsed, { addSuffix: true });
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function PricingDashboard() {
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [createPromoOpen, setCreatePromoOpen] = useState(false);

  // Unified Pricing Plans state (shows all plans together by default — zero tab switching needed)
  const [planTypeFilter, setPlanTypeFilter] = useState<PlanTypeFilter>("all");
  const [planSearchInput, setPlanSearchInput] = useState("");
  const [debouncedPlanSearch, setDebouncedPlanSearch] = useState("");
  const [planStatus, setPlanStatus] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [planSortBy, setPlanSortBy] = useState<string>("basePrice");
  const [planSortOrder, setPlanSortOrder] = useState<"asc" | "desc">("asc");
  const [planPage, setPlanPage] = useState(1);
  const [planLimit, setPlanLimit] = useState(10);

  // Promo Codes state (always visible directly below Pricing Plans)
  const [promoSearchInput, setPromoSearchInput] = useState("");
  const [debouncedPromoSearch, setDebouncedPromoSearch] = useState("");
  const [promoStatus, setPromoStatus] = useState<
    "all" | PromoCodeLifecycleStatus
  >("all");
  const [promoAppliesTo, setPromoAppliesTo] = useState<
    "all" | "both" | "credit" | "subscription"
  >("all");
  const [promoSortBy, setPromoSortBy] = useState<string>("createdAt");
  const [promoSortOrder, setPromoSortOrder] = useState<"asc" | "desc">("desc");
  const [promoPage, setPromoPage] = useState(1);
  const [promoLimit, setPromoLimit] = useState(10);

  useEffect(() => {
    const trimmed = planSearchInput.trim();
    if (trimmed === debouncedPlanSearch) return;
    const timer = setTimeout(() => {
      setDebouncedPlanSearch(trimmed);
      setPlanPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [planSearchInput, debouncedPlanSearch]);

  useEffect(() => {
    const trimmed = promoSearchInput.trim();
    if (trimmed === debouncedPromoSearch) return;
    const timer = setTimeout(() => {
      setDebouncedPromoSearch(trimmed);
      setPromoPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [promoSearchInput, debouncedPromoSearch]);

  const plansParams: GetPricingPlansParams = {
    type: planTypeFilter === "all" ? undefined : planTypeFilter,
    search: debouncedPlanSearch || undefined,
    isActive:
      planStatus === "all" ? undefined : planStatus === "active",
    sortBy: planSortBy,
    sortOrder: planSortOrder,
    page: planPage,
    limit: planLimit,
  };

  const promoParams: GetPromoCodesParams = {
    search: debouncedPromoSearch || undefined,
    status: promoStatus === "all" ? undefined : promoStatus,
    appliesTo: promoAppliesTo === "all" ? undefined : promoAppliesTo,
    sortBy: promoSortBy,
    sortOrder: promoSortOrder,
    page: promoPage,
    limit: promoLimit,
  };

  const {
    data: plansResponse,
    isLoading: plansLoading,
    isFetching: plansFetching,
    isError: plansIsError,
    refetch: refetchPlans,
  } = usePricingPlansQuery(plansParams);

  const {
    data: promoCodesResponse,
    isLoading: promoLoading,
    isFetching: promoFetching,
    isError: promoIsError,
    refetch: refetchPromoCodes,
  } = usePromoCodesQuery(promoParams);

  const refreshMutation = useRefreshPricingManagementMutation();

  const plansData = plansResponse?.success ? plansResponse.data : undefined;
  const promoData = promoCodesResponse?.success
    ? promoCodesResponse.data
    : undefined;

  const plans: PricingPlan[] = plansData?.plans ?? [];
  const promoCodes: PromoCode[] = promoData?.promoCodes ?? [];

  const pricingSummary = plansData?.summary ?? {
    totalPlans: 0,
    activePlans: 0,
    inactivePlans: 0,
    subscriptionPlans: 0,
    activeSubscriptionPlans: 0,
    creditPlans: 0,
    activeCreditPlans: 0,
    avgDiscountPercent: 0,
  };

  const promoSummary = promoData?.summary ?? {
    totalPromoCodes: 0,
    livePromoCodes: 0,
    scheduledPromoCodes: 0,
    expiredPromoCodes: 0,
    exhaustedPromoCodes: 0,
    inactivePromoCodes: 0,
    totalRedemptions: 0,
  };

  const planPagination = plansData?.pagination ?? {
    total: plans.length,
    page: planPage,
    limit: planLimit,
    totalPages: Math.max(1, Math.ceil(plans.length / planLimit)),
  };

  const promoPagination = promoData?.pagination ?? {
    total: promoCodes.length,
    page: promoPage,
    limit: promoLimit,
    totalPages: Math.max(1, Math.ceil(promoCodes.length / promoLimit)),
  };

  const generatedAt =
    plansData?.meta?.generatedAt ?? promoData?.meta?.generatedAt ?? null;

  const plansHasError =
    plansIsError || (plansResponse !== undefined && !plansResponse.success);
  const promoHasError =
    promoIsError ||
    (promoCodesResponse !== undefined && !promoCodesResponse.success);

  const handleRefreshAll = async () => {
    try {
      const { plansRes, promoRes } = await refreshMutation.mutateAsync({
        plansParams,
        promoParams,
      });

      if (!plansRes.success || !promoRes.success) {
        toast.error(
          (!plansRes.success ? plansRes.message : null) ||
            (!promoRes.success ? promoRes.message : null) ||
            "Failed to sync pricing data",
        );
        return;
      }

      toast.success("Pricing plans & promo codes synced");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to sync pricing data",
      );
    }
  };

  const handleSelectPlanType = (nextType: PlanTypeFilter) => {
    setPlanTypeFilter(nextType);
    setPlanPage(1);
  };

  const hasPlanFilters =
    planTypeFilter !== "all" ||
    debouncedPlanSearch !== "" ||
    planStatus !== "all" ||
    planSortBy !== "basePrice" ||
    planSortOrder !== "asc";

  const hasPromoFilters =
    debouncedPromoSearch !== "" ||
    promoStatus !== "all" ||
    promoAppliesTo !== "all" ||
    promoSortBy !== "createdAt" ||
    promoSortOrder !== "desc";

  const resetPlanFilters = () => {
    setPlanTypeFilter("all");
    setPlanSearchInput("");
    setDebouncedPlanSearch("");
    setPlanStatus("all");
    setPlanSortBy("basePrice");
    setPlanSortOrder("asc");
    setPlanPage(1);
  };

  const resetPromoFilters = () => {
    setPromoSearchInput("");
    setDebouncedPromoSearch("");
    setPromoStatus("all");
    setPromoAppliesTo("all");
    setPromoSortBy("createdAt");
    setPromoSortOrder("desc");
    setPromoPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Pricing &amp; Promo Codes
            </h1>
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-0.5 rounded-full border bg-muted/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Synced {formatRelativeTime(generatedAt)}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage all credit packs, subscriptions, and promotional campaigns
            from one unified view.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshMutation.isPending}
            className="gap-2"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                refreshMutation.isPending && "animate-spin",
              )}
            />
            <span>{refreshMutation.isPending ? "Syncing..." : "Refresh"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCreatePromoOpen(true)}
            className="gap-1.5"
          >
            <Tag className="h-4 w-4" />
            <span>New Promo Code</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setCreatePlanOpen(true)}
            className="gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Pricing Plan</span>
          </Button>
        </div>
      </div>

      {/* 4 Interactive KPI Summary Cards (click to filter / jump) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => {
            handleSelectPlanType("all");
            scrollToSection("pricing-plans");
          }}
          className="text-left w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card
            className={cn(
              "h-full transition-colors hover:border-foreground/30",
              planTypeFilter === "all" && "border-foreground/25",
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Plans
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {plansLoading && !plansData ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3.5 w-36" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold tabular-nums">
                    {pricingSummary.activePlans}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {pricingSummary.totalPlans}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pricingSummary.inactivePlans} inactive &middot; avg{" "}
                    {pricingSummary.avgDiscountPercent}% off
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => {
            handleSelectPlanType(
              planTypeFilter === "credit" ? "all" : "credit",
            );
            scrollToSection("pricing-plans");
          }}
          className="text-left w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card
            className={cn(
              "h-full transition-colors hover:border-foreground/30",
              planTypeFilter === "credit" &&
                "border-amber-500/50 bg-amber-500/5",
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Credit Packs
              </CardTitle>
              <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              {plansLoading && !plansData ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold tabular-nums">
                    {pricingSummary.creditPlans}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pricingSummary.activeCreditPlans} active packages
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => {
            handleSelectPlanType(
              planTypeFilter === "subscription" ? "all" : "subscription",
            );
            scrollToSection("pricing-plans");
          }}
          className="text-left w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card
            className={cn(
              "h-full transition-colors hover:border-foreground/30",
              planTypeFilter === "subscription" &&
                "border-blue-500/50 bg-blue-500/5",
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Subscriptions
              </CardTitle>
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              {plansLoading && !plansData ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold tabular-nums">
                    {pricingSummary.subscriptionPlans}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pricingSummary.activeSubscriptionPlans} active tiers
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("promo-codes")}
          className="text-left w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Promo Codes
              </CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {promoLoading && !promoData ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3.5 w-36" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold tabular-nums">
                    {promoSummary.livePromoCodes}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {promoSummary.totalPromoCodes}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {promoSummary.totalRedemptions.toLocaleString()} total
                    redemptions
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Section 1: Unified Pricing Plans (Credit + Subscription in one view) */}
      <Card id="pricing-plans" className="scroll-mt-4">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Pricing Plans
              </CardTitle>
              <CardDescription>
                View and manage both credit packs and recurring subscription
                tiers inline without switching tabs.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {plansFetching && !plansLoading && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Updating...
                </span>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => setCreatePlanOpen(true)}
                className="gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Plan</span>
              </Button>
            </div>
          </div>

          {/* Type Quick-Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                {
                  key: "all" as const,
                  label: "All Plans",
                  count: pricingSummary.totalPlans,
                },
                {
                  key: "credit" as const,
                  label: "Credit Packs",
                  count: pricingSummary.creditPlans,
                },
                {
                  key: "subscription" as const,
                  label: "Subscriptions",
                  count: pricingSummary.subscriptionPlans,
                },
              ]
            ).map((pill) => {
              const active = planTypeFilter === pill.key;
              return (
                <Button
                  key={pill.key}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => handleSelectPlanType(pill.key)}
                  className="h-8 gap-2 text-xs"
                >
                  <span>{pill.label}</span>
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className={cn(
                      "h-4 px-1.5 text-[10px] tabular-nums",
                      active && "bg-background/20 text-inherit border-transparent",
                    )}
                  >
                    {pill.count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Plans Search & Filter Toolbar */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pricing plans by name..."
                value={planSearchInput}
                onChange={(e) => setPlanSearchInput(e.target.value)}
                className="pl-9 pr-9"
              />
              {planSearchInput && (
                <button
                  type="button"
                  onClick={() => setPlanSearchInput("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={planStatus}
                onValueChange={(val) => {
                  setPlanStatus(val as "all" | "active" | "inactive");
                  setPlanPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={planSortBy}
                onValueChange={(val) => {
                  setPlanSortBy(val);
                  setPlanPage(1);
                }}
              >
                <SelectTrigger className="w-[145px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basePrice">Base Price</SelectItem>
                  <SelectItem value="discountPrice">Final Price</SelectItem>
                  <SelectItem value="type">Plan Type</SelectItem>
                  <SelectItem value="planDuration">Duration</SelectItem>
                  <SelectItem value="name">Plan Name</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPlanSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                  setPlanPage(1);
                }}
                className="h-9 gap-1.5"
                title={`Sort order: ${planSortOrder}`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="text-xs uppercase">{planSortOrder}</span>
              </Button>

              {hasPlanFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetPlanFilters}
                  className="h-9 text-xs text-muted-foreground"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {plansHasError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm text-muted-foreground">
                {plansResponse && !plansResponse.success
                  ? plansResponse.message
                  : "Failed to load pricing plans"}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetchPlans()}>
                Retry
              </Button>
            </div>
          ) : (
            <PricingTable
              plans={plans}
              planTypeFilter={planTypeFilter}
              loading={plansLoading || (plansFetching && plans.length === 0)}
              isFetching={plansFetching}
              skeletonRows={planLimit}
              pagination={planPagination}
              onPageChange={setPlanPage}
              onLimitChange={(nextLimit) => {
                setPlanLimit(nextLimit);
                setPlanPage(1);
              }}
              onPlanUpdated={() => refetchPlans()}
              onPlanDeleted={() => refetchPlans()}
              onCreateClick={() => setCreatePlanOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      {/* Section 2: Promo Codes (Always Visible Directly Below) */}
      <Card id="promo-codes" className="scroll-mt-4">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Promo Codes
              </CardTitle>
              <CardDescription>
                Toggle availability, edit discount windows, and track
                redemption usage directly.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {promoFetching && !promoLoading && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Updating...
                </span>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCreatePromoOpen(true)}
                className="gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Promo Code</span>
              </Button>
            </div>
          </div>

          {/* Lifecycle Quick-Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                {
                  key: "all" as const,
                  label: "All",
                  count: promoSummary.totalPromoCodes,
                },
                {
                  key: "live" as const,
                  label: "Live",
                  count: promoSummary.livePromoCodes,
                },
                {
                  key: "scheduled" as const,
                  label: "Scheduled",
                  count: promoSummary.scheduledPromoCodes,
                },
                {
                  key: "expired" as const,
                  label: "Expired",
                  count: promoSummary.expiredPromoCodes,
                },
                {
                  key: "exhausted" as const,
                  label: "Exhausted",
                  count: promoSummary.exhaustedPromoCodes,
                },
                {
                  key: "inactive" as const,
                  label: "Inactive",
                  count: promoSummary.inactivePromoCodes,
                },
              ]
            ).map((pill) => {
              const active = promoStatus === pill.key;
              return (
                <Button
                  key={pill.key}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => {
                    setPromoStatus(pill.key);
                    setPromoPage(1);
                  }}
                  className="h-8 gap-1.5 text-xs"
                >
                  <span>{pill.label}</span>
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className={cn(
                      "h-4 px-1.5 text-[10px] tabular-nums",
                      active && "bg-background/20 text-inherit border-transparent",
                    )}
                  >
                    {pill.count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Promo Codes Search & Filter Toolbar */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search promo codes or descriptions..."
                value={promoSearchInput}
                onChange={(e) => setPromoSearchInput(e.target.value)}
                className="pl-9 pr-9"
              />
              {promoSearchInput && (
                <button
                  type="button"
                  onClick={() => setPromoSearchInput("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={promoAppliesTo}
                onValueChange={(val) => {
                  setPromoAppliesTo(
                    val as "all" | "both" | "credit" | "subscription",
                  );
                  setPromoPage(1);
                }}
              >
                <SelectTrigger className="w-[155px] h-9">
                  <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Applies to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plan Types</SelectItem>
                  <SelectItem value="both">Both Types</SelectItem>
                  <SelectItem value="credit">Credit Only</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={promoSortBy}
                onValueChange={(val) => {
                  setPromoSortBy(val);
                  setPromoPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Newest</SelectItem>
                  <SelectItem value="validUntil">Expiry Date</SelectItem>
                  <SelectItem value="discountPercent">Discount %</SelectItem>
                  <SelectItem value="usedCount">Most Used</SelectItem>
                  <SelectItem value="code">Code (A-Z)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPromoSortOrder((prev) =>
                    prev === "desc" ? "asc" : "desc",
                  );
                  setPromoPage(1);
                }}
                className="h-9 gap-1.5"
                title={`Sort order: ${promoSortOrder}`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="text-xs uppercase">{promoSortOrder}</span>
              </Button>

              {hasPromoFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetPromoFilters}
                  className="h-9 text-xs text-muted-foreground"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {promoHasError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm text-muted-foreground">
                {promoCodesResponse && !promoCodesResponse.success
                  ? promoCodesResponse.message
                  : "Failed to load promo codes"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchPromoCodes()}
              >
                Retry
              </Button>
            </div>
          ) : (
            <PromoCodeTable
              promoCodes={promoCodes}
              loading={
                promoLoading || (promoFetching && promoCodes.length === 0)
              }
              isFetching={promoFetching}
              skeletonRows={promoLimit}
              pagination={promoPagination}
              onPageChange={setPromoPage}
              onLimitChange={(nextLimit) => {
                setPromoLimit(nextLimit);
                setPromoPage(1);
              }}
              onPromoCodeUpdated={() => refetchPromoCodes()}
              onPromoCodeDeleted={() => refetchPromoCodes()}
              onCreateClick={() => setCreatePromoOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Plan Dialog */}
      <Dialog open={createPlanOpen} onOpenChange={setCreatePlanOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Pricing Plan</DialogTitle>
          </DialogHeader>
          {createPlanOpen && (
            <CreatePricingForm
              defaultType={
                planTypeFilter === "subscription" ? "subscription" : "credit"
              }
              onSuccess={() => {
                setCreatePlanOpen(false);
                refetchPlans();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Promo Code Dialog */}
      <Dialog open={createPromoOpen} onOpenChange={setCreatePromoOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
          </DialogHeader>
          {createPromoOpen && (
            <CreatePromoCodeForm
              onSuccess={() => {
                setCreatePromoOpen(false);
                refetchPromoCodes();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
