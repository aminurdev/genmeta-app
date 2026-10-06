import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WindowsIcon } from "@/components/Home";
import { getBreadcrumbSchema, getFaqSchema } from "@/lib/seo";

export interface LandingPageFeature {
  title: string;
  description: string;
  icon?: React.ElementType;
}

export interface LandingPageStep {
  title: string;
  description: string;
}

export interface LandingPageFaq {
  question: string;
  answer: string;
}

export interface LandingPageProps {
  badge: string;
  h1: string;
  description: string;
  secondaryCopy?: string;
  breadcrumbName: string;
  currentPath: string;
  downloadUrl?: string;
  guidelinesTitle?: string;
  guidelines?: { title: string; detail: string }[];
  features: LandingPageFeature[];
  steps?: LandingPageStep[];
  faqs: LandingPageFaq[];
  relatedPages?: { title: string; href: string; description: string }[];
}

export function LandingPageLayout({
  badge,
  h1,
  description,
  secondaryCopy,
  breadcrumbName,
  currentPath,
  downloadUrl = "/download",
  guidelinesTitle = "Key Platform & Format Requirements",
  guidelines = [],
  features,
  steps = [
    { title: "Drop your files into GenMeta", description: "Import individual files or entire folders of photos, vectors, or videos." },
    { title: "Generate AI metadata in seconds", description: "Vision AI inspects each asset and generates accurate titles, descriptions, and keywords." },
    { title: "Review & refine with full control", description: "Inspect keywords, adjust ordering, or add your custom instructions." },
    { title: "Export CSV or embed directly", description: "Get agency-formatted spreadsheets or write IPTC/XMP tags directly into your files." },
  ],
  faqs,
  relatedPages = [
    { title: "Adobe Stock Metadata Generator", href: "/for-adobe-stock", description: "Ordered keywords and titles formatted for Adobe Stock guidelines." },
    { title: "Shutterstock Metadata Generator", href: "/for-shutterstock", description: "Keyword sets and descriptive titles for Shutterstock contributors." },
    { title: "Freepik Metadata Generator", href: "/for-freepik", description: "Optimized tagging for vector illustrations, EPS, SVG, and photos." },
    { title: "Stock Vector Metadata", href: "/for-vectors", description: "Automated titles and tags for vector art without manual layer inspection." },
    { title: "Stock Video Metadata", href: "/for-stock-video", description: "Tag footage, frame rates, motion, and 4K clips in seconds." },
  ],
}: LandingPageProps) {
  const isExternal = downloadUrl.startsWith("http");

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: breadcrumbName, path: currentPath },
  ];

  return (
    <div className="bg-background text-foreground">
      {/* Schema.org Breadcrumbs & FAQs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getBreadcrumbSchema(breadcrumbs)),
        }}
      />
      {faqs && faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getFaqSchema(faqs)),
          }}
        />
      )}

      <div className="mx-auto max-w-[1300px] md:border-x">
        {/* Breadcrumb nav */}
        <div className="flex items-center justify-center gap-2 border-b px-6 py-3 text-xs text-muted-foreground md:px-12">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate font-medium text-foreground">{breadcrumbName}</span>
        </div>

        {/* Hero Section - Centered & Minimal */}
        <section className="relative overflow-hidden border-b">
          <div aria-hidden className="lp-grid-bg pointer-events-none absolute inset-0" />
          <div className="relative flex flex-col items-center justify-center px-6 py-16 text-center md:px-12 md:py-24">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background py-1 pl-1 pr-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-foreground px-2 py-0.5 font-medium text-background">
                {badge}
              </span>
              <span>Free Plan Available</span>
            </div>

            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl md:text-6xl md:leading-[1.05]">
              {h1}
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              {description}
            </p>

            {secondaryCopy && (
              <p className="mt-3 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground/80">
                {secondaryCopy}
              </p>
            )}

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 gap-2 rounded-full px-6">
                <a
                  href={downloadUrl}
                  {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <WindowsIcon className="h-4 w-4" />
                  Download Free for Windows
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-6">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>

            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Windows 10/11 · 50 Free Credits Included · No Credit Card Required
            </p>
          </div>
        </section>

        {/* Guidelines / Platform Specifics */}
        {guidelines && guidelines.length > 0 && (
          <section className="border-b px-6 py-14 md:px-12 md:py-16">
            <div className="mx-auto max-w-xl text-center">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Stock Contributor Standards
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
                {guidelinesTitle}
              </h2>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guidelines.map((item, idx) => (
                <div key={idx} className="rounded-xl border bg-background p-6 transition-colors hover:border-foreground/20">
                  <div className="flex items-center gap-2.5 font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Features Grid - Minimal */}
        <section className="border-b px-6 py-14 md:px-12 md:py-20">
          <div className="mx-auto max-w-xl text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Core Capabilities
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
              Engineered for Stock Contributors
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, idx) => {
              const Icon = feat.icon || Sparkles;
              return (
                <div
                  key={idx}
                  className="group relative flex flex-col justify-between rounded-xl border bg-background p-6 transition-colors hover:border-foreground/20 hover:bg-muted/20"
                >
                  <div>
                    <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                    <h3 className="mt-4 text-[15px] font-medium tracking-tight">
                      {feat.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Workflow Steps - Minimal */}
        <section className="border-b px-6 py-14 md:px-12 md:py-20">
          <div className="mx-auto max-w-xl text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Step-by-Step Workflow
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
              From Raw Assets to Stock Submissions
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((st, idx) => (
              <div key={idx} className="rounded-xl border bg-background p-6">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border bg-muted/30 font-mono text-xs font-semibold">
                  0{idx + 1}
                </span>
                <h3 className="mt-4 text-sm font-medium tracking-tight">
                  {st.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {st.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy Note - Minimal Banner */}
        <section className="border-b bg-muted/20 px-6 py-10 md:px-12">
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                <span>Your Creative Files Stay on Your Machine</span>
              </div>
              <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
                Built for Windows. Fast, private local batch execution.
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                GenMeta processes your folders locally without slow cloud upload queues.
              </p>
            </div>
            <Button asChild variant="outline" className="h-10 rounded-full px-5 shrink-0">
              <Link href="/download">Download Free</Link>
            </Button>
          </div>
        </section>

        {/* FAQs - Centered & Minimal */}
        {faqs && faqs.length > 0 && (
          <section className="border-b px-6 py-14 md:px-12 md:py-20">
            <div className="mx-auto max-w-xl text-center">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Questions & Answers
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="mx-auto mt-10 max-w-3xl">
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${idx}`}
                    className="rounded-xl border bg-background px-6 py-1.5"
                  >
                    <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}

        {/* Related Pages */}
        {relatedPages && relatedPages.length > 0 && (
          <section className="border-b px-6 py-12 md:px-12 md:py-16">
            <div className="mx-auto max-w-xl text-center mb-8">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Marketplaces & Workflows
              </p>
              <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
                Explore Other Supported Formats
              </h3>
            </div>
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPages
                .filter((p) => p.href !== currentPath)
                .slice(0, 3)
                .map((page, idx) => (
                  <Link
                    key={idx}
                    href={page.href}
                    className="group rounded-xl border bg-background p-5 transition-colors hover:border-foreground/30 hover:bg-muted/20"
                  >
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{page.title}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {page.description}
                    </p>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* CTA - Centered & Minimal */}
        <section className="relative overflow-hidden px-6 py-16 text-center md:px-12 md:py-24">
          <div aria-hidden className="lp-grid-bg pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
              Ready to accelerate your stock metadata workflow?
            </h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Download GenMeta for Windows today and start keywording your creative portfolio with AI.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 gap-2 rounded-full px-6">
                <a
                  href={downloadUrl}
                  {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <WindowsIcon className="h-4 w-4" />
                  Download for Windows Free
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-6">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
