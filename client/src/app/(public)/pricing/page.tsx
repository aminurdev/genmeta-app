"use client";

import type React from "react";
import { Suspense, memo, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowUpRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAllPricing } from "@/services/queries/pricing";
import { WindowsIcon } from "@/components/Home";
import { creditFeatures, premiumFeatures } from "./features";

/* -------------------------------------------------------------------------- */
/*                                   Content                                  */
/* -------------------------------------------------------------------------- */

const FREE_FEATURES = [
  "50 free credits upon signup",
  "Requires your own Gemini API key",
  "Limited to 25 files per day",
];

const FAQ_ITEMS = [
  {
    question: "How does the free plan work?",
    answer:
      "The free plan gives you access to basic AI image processing with a limit of 25 images per day. You can process images, generate basic metadata, and export results with standard features. Perfect for trying out the platform before committing to a paid plan.",
  },
  {
    question: "Can I upgrade from free to premium anytime?",
    answer:
      "Yes. You can upgrade from the free plan to any paid plan at any time and your account is upgraded immediately. You can also switch between subscription and credit plans as needed.",
  },
  {
    question: "Do I need my own API key?",
    answer:
      "Subscription plans use your own Gemini API key for unlimited processing. Credit plans include built-in API access, so no external key is required — ideal if you want a hassle-free experience.",
  },
  {
    question: "What file formats are supported?",
    answer:
      "JPG, JPEG, PNG, EPS, MP4 and MOV. GenMeta generates titles, descriptions and keywords for each file, ready to export for your agency.",
  },
];

const DURATION_LABELS: Record<number, string> = {
  7: "per week",
  30: "per month",
  365: "per year",
};

const CREDIT_DURATION_LABELS: Record<number, string> = {
  30: "Monthly",
  91: "91 days",
  182: "Half-yearly",
  365: "Yearly",
};

interface PlanLike {
  basePrice: number;
  discountPercent: number;
  discountPrice?: number;
}

const finalPrice = (plan: PlanLike) =>
  plan.discountPrice
    ? plan.discountPrice
    : Math.round(plan.basePrice * (1 - plan.discountPercent / 100));

/* -------------------------------------------------------------------------- */
/*                                 Primitives                                 */
/* -------------------------------------------------------------------------- */

function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative border-t", className)}>
      <span aria-hidden className="lp-cross -left-[7px] -top-[7px] z-10 hidden md:block" />
      <span aria-hidden className="lp-cross -right-[7px] -top-[7px] z-10 hidden md:block" />
      {children}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="grid gap-6 px-6 py-14 md:grid-cols-2 md:items-end md:px-12 md:py-20">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-4 max-w-lg text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
          {title}
        </h2>
      </div>
      {description && (
        <p className="max-w-md text-pretty leading-relaxed text-muted-foreground md:justify-self-end">
          {description}
        </p>
      )}
    </div>
  );
}

interface PlanCardProps {
  name: string;
  tag?: string;
  price: string;
  originalPrice?: string;
  caption: string;
  note?: string;
  features: string[];
  cta: string;
  onSelect: () => void;
  variant?: "default" | "outline";
  highlight?: boolean;
}

const PlanCard = memo(function PlanCard({
  name,
  tag,
  price,
  originalPrice,
  caption,
  note,
  features,
  cta,
  onSelect,
  variant = "outline",
  highlight,
}: PlanCardProps) {
  return (
    <div className="group relative flex flex-col bg-background p-6 transition-colors hover:bg-muted/40 md:p-10">
      {highlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/[0.03] to-transparent"
        />
      )}
      <div className="relative flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-medium tracking-tight">{name}</h3>
        {tag && (
          <span className="rounded-full border bg-background px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {tag}
          </span>
        )}
      </div>

      <div className="relative mt-6 flex items-baseline gap-2">
        <span className="text-5xl font-semibold tracking-[-0.04em]">{price}</span>
        {originalPrice && (
          <span className="text-lg text-muted-foreground line-through">
            {originalPrice}
          </span>
        )}
      </div>
      <p className="relative mt-2 text-sm text-muted-foreground">{caption}</p>

      {note && (
        <p className="relative mt-5 rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
          {note}
        </p>
      )}

      <ul className="relative mt-6 flex-1 space-y-3 border-t pt-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
              strokeWidth={1.75}
            />
            <span className="leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={variant}
        onClick={onSelect}
        className="relative mt-8 h-11 w-full rounded-full font-medium"
      >
        {cta}
      </Button>
    </div>
  );
});

function PlanCardSkeleton() {
  return (
    <div className="bg-background p-6 md:p-10">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-12 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-8 space-y-3 border-t pt-6">
        {[0, 1, 2, 3].map((j) => (
          <div key={j} className="h-4 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
      <div className="mt-8 h-11 w-full animate-pulse rounded-full bg-muted" />
    </div>
  );
}

/** Isolated so useSearchParams suspending never blanks the whole page. */
function ErrorBanner() {
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const errorMessage = useMemo(() => {
    const message = searchParams?.get("message");
    return message ? decodeURIComponent(message) : null;
  }, [searchParams]);

  if (!errorMessage || dismissed) return null;

  return (
    <div className="border-t px-6 py-6 md:px-12">
      <Alert variant="destructive" className="relative">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="pr-8">{errorMessage}</AlertDescription>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

function PricingContent() {
  const router = useRouter();

  const { data: pricingData, isLoading } = useAllPricing();

  const { creditPlans, subscriptionPlans } = useMemo(() => {
    const data = pricingData?.success ? pricingData.data : undefined;
    return {
      creditPlans: (data?.creditPlans ?? [])
        .filter((p) => p.isActive)
        .sort((a, b) => a.credit - b.credit),
      subscriptionPlans: (data?.subscriptionPlans ?? [])
        .filter((p) => p.isActive)
        .sort((a, b) => a.planDuration - b.planDuration),
    };
  }, [pricingData]);

  const goToCart = (id: string, type: "credit" | "subscription") =>
    router.push(`/cart?planId=${id}&planType=${type}`);

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-[1300px] md:border-x">
        {/* ------------------------------ Hero ------------------------------ */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="lp-grid-bg pointer-events-none absolute inset-0"
          />
          <div className="relative px-6 pb-16 pt-16 md:px-12 md:pb-20 md:pt-24">
            <p
              className="lp-rise font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Pricing
            </p>
            <h1
              className="lp-rise mt-4 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl md:text-6xl md:leading-[1.05]"
              style={{ animationDelay: "60ms" }}
            >
              Simple pricing. Start free, scale when you upload more.
            </h1>
            <p
              className="lp-rise mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
              style={{ animationDelay: "120ms" }}
            >
              Bring your own Gemini key on a subscription, or buy credits and
              skip the setup entirely. No hidden fees.
            </p>
          </div>
        </section>

        {/* ------------------------------ Error ----------------------------- */}
        <Suspense fallback={null}>
          <ErrorBanner />
        </Suspense>

        {/* ------------------------------ Plans ----------------------------- */}
        <Section id="premium">
          <div className="grid gap-px border-b bg-border md:grid-cols-2 lg:grid-cols-3">
            <PlanCard
              name="Free"
              tag="Forever"
              price="৳0"
              caption="Perfect for getting started"
              features={FREE_FEATURES}
              cta="Get started"
              onSelect={() => router.push("/signup?plan=free")}
            />

            {isLoading && (
              <>
                <PlanCardSkeleton />
                <PlanCardSkeleton />
              </>
            )}

            {creditPlans.map((plan) => {
              const duration =
                CREDIT_DURATION_LABELS[plan.planDuration] ??
                `${plan.planDuration} days`;
              return (
                <PlanCard
                  key={plan._id}
                  name={plan.name}
                  tag="No API key"
                  price={`৳${finalPrice(plan)}`}
                  originalPrice={
                    plan.discountPercent > 0 ? `৳${plan.basePrice}` : undefined
                  }
                  caption={`${plan.credit.toLocaleString()} credits · ${duration}`}
                  note={`${(plan.credit * 5).toLocaleString()} images or ${plan.credit.toLocaleString()} videos`}
                  features={creditFeatures}
                  cta="Purchase credits"
                  variant="default"
                  onSelect={() => goToCart(plan._id, "credit")}
                />
              );
            })}

            {subscriptionPlans.map((plan) => (
              <PlanCard
                key={plan._id}
                name={plan.name}
                tag={
                  plan.discountPercent > 0
                    ? `Save ${plan.discountPercent}%`
                    : undefined
                }
                price={`৳${finalPrice(plan)}`}
                originalPrice={
                  plan.discountPercent > 0 ? `৳${plan.basePrice}` : undefined
                }
                caption={
                  DURATION_LABELS[plan.planDuration] ??
                  `per ${plan.planDuration} days`
                }
                features={premiumFeatures}
                cta="Choose plan"
                variant="default"
                highlight
                onSelect={() => goToCart(plan._id, "subscription")}
              />
            ))}
          </div>
        </Section>

        {/* ------------------------------- FAQ ------------------------------ */}
        <Section>
          <div className="grid lg:grid-cols-2">
            <div className="border-b px-6 py-14 md:px-12 md:py-20 lg:border-b-0 lg:border-r">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                FAQ
              </p>
              <h2 className="mt-4 max-w-md text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Questions about pricing.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Can&apos;t find what you need?{" "}
                <Link
                  href="/contact"
                  className="text-foreground underline underline-offset-4"
                >
                  Contact us
                </Link>
                .
              </p>
            </div>
            <div className="bg-muted/30 px-6 py-10 md:px-12 md:py-16">
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((item, i) => (
                  <AccordionItem key={item.question} value={`item-${i}`}>
                    <AccordionTrigger className="py-4 text-left text-[15px] font-medium tracking-tight hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </Section>

        {/* ------------------------------- CTA ------------------------------ */}
        <Section className="overflow-hidden">
          <div
            aria-hidden
            className="lp-grid-bg pointer-events-none absolute inset-0 opacity-70"
          />
          <div className="relative flex flex-col items-start justify-between gap-8 px-6 py-16 md:flex-row md:items-end md:px-12 md:py-24">
            <div>
              <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
                Tag your next upload in minutes.
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Start on the free plan. Upgrade when you need unlimited
                processing and every export format.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 gap-2 rounded-full px-6">
                <Link href="/download">
                  <WindowsIcon className="h-4 w-4" />
                  Download free
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 gap-1 rounded-full px-6"
              >
                <a href="#premium">
                  View plans
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return <PricingContent />;
}
