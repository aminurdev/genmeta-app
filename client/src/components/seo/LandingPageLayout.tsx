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
        <div className="flex items-center gap-2 border-b px-6 py-3.5 text-xs text-muted-foreground md:px-12">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate font-medium text-foreground">{breadcrumbName}</span>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden border-b">
          <div aria-hidden className="lp-grid-bg pointer-events-none absolute inset-0" />
          <div className="relative px-6 pb-16 pt-12 md:px-12 md:pb-20 md:pt-16">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background py-1 pl-1 pr-3 text-xs text-muted-foreground mb-6">
              <span className="rounded-full bg-foreground px-2 py-0.5 font-medium text-background">
                {badge}
              </span>
              <span>Windows Desktop App</span>
            </div>

            <h1 className="max-w-4xl text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl lg:text-6xl md:leading-[1.08]">
              {h1}
            </h1>

            <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              {description}
            </p>

            {secondaryCopy && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground/90">
                {secondaryCopy}
              </p>
            )}

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
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>

            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Windows 10/11 · Local file processing · Free plan available
            </p>
          </div>
        </section>

        {/* Guidelines / Platform Specifics (if any) */}
        {guidelines && guidelines.length > 0 && (
          <section className="border-b bg-muted/20 px-6 py-12 md:px-12 md:py-16">
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Stock Contributor Standards
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                {guidelinesTitle}
              </h2>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guidelines.map((item, idx) => (
                <div key={idx} className="rounded-xl border bg-background p-5">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Features Bento */}
        <section className="border-b px-6 py-14 md:px-12 md:py-20">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Core Capabilities
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Engineered for Stock Contributors
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, idx) => {
              const Icon = feat.icon || Sparkles;
              return (
                <div
                  key={idx}
                  className="group relative flex flex-col justify-between rounded-xl border bg-background p-6 transition-colors hover:bg-muted/30"
                >
                  <div>
                    <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                    <h3 className="mt-4 text-base font-semibold tracking-tight">
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

        {/* Workflow Steps */}
        <section className="border-b px-6 py-14 md:px-12 md:py-20">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Step-by-Step Workflow
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              From Raw Assets to Stock Submissions
            </h2>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((st, idx) => (
              <div key={idx} className="rounded-xl border bg-background p-6">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border bg-muted/30 font-mono text-xs font-semibold">
                  0{idx + 1}
                </span>
                <h3 className="mt-4 text-sm font-semibold tracking-tight">
                  {st.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {st.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy Note */}
        <section className="border-b bg-muted/10 px-6 py-12 md:px-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                <span>Your Creative Files Stay on Your Machine</span>
              </div>
              <h3 className="mt-2 text-xl font-semibold">
                Built for Windows. Fast, private local batch execution.
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                GenMeta works directly with your local folders, so you don&apos;t spend hours uploading high-resolution master files to third-party web servers.
              </p>
            </div>
            <Button asChild variant="outline" className="h-10 rounded-full px-5 shrink-0">
              <Link href="/download">Download Free</Link>
            </Button>
          </div>
        </section>

        {/* FAQs */}
        {faqs && faqs.length > 0 && (
          <section className="border-b px-6 py-14 md:px-12 md:py-20">
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Questions & Answers
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="mt-8 max-w-4xl">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${idx}`}
                    className="rounded-xl border bg-background px-6 py-2"
                  >
                    <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}

        {/* Related Pages (Inter-linking for SEO) */}
        {relatedPages && relatedPages.length > 0 && (
          <section className="border-b px-6 py-12 md:px-12 md:py-16">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Explore Other Supported Workflows
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPages
                .filter((p) => p.href !== currentPath)
                .slice(0, 3)
                .map((page, idx) => (
                  <Link
                    key={idx}
                    href={page.href}
                    className="group rounded-xl border bg-background p-5 transition-colors hover:border-foreground/30 hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{page.title}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {page.description}
                    </p>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="relative overflow-hidden px-6 py-16 md:px-12 md:py-20">
          <div aria-hidden className="lp-grid-bg pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div>
              <h2 className="text-balance text-2xl font-semibold tracking-[-0.03em] md:text-4xl">
                Ready to accelerate your stock metadata workflow?
              </h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Download GenMeta for Windows today and start keywording your creative portfolio with AI.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
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
