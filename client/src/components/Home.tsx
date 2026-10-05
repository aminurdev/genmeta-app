"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Layers,
  ListOrdered,
  PenTool,
  SlidersHorizontal,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  releaseInfo: {
    version: string;
    downloadUrl: string;
  } | null;
}

/* -------------------------------------------------------------------------- */
/*                                   Content                                  */
/* -------------------------------------------------------------------------- */

const FEATURES = [

  {
    icon: FolderOpen,
    title: "Unlimited batch processing",
    description:
      "Point GenMeta at a folder and process hundreds or thousands of files in one run. No per-image limits.",
    wide: true,
  },
  {
    icon: Layers,
    title: "Photos, video and vectors",
    description:
      "One workflow for stills, 4K footage and illustrations. No separate tools for each asset type.",
    wide: false,
  },
  {
    icon: ListOrdered,
    title: "Relevance-ranked keywords",
    description:
      "Keywords are ordered by relevance, so the terms agencies weight most heavily come first.",
    wide: false,
  },
  {
    icon: SlidersHorizontal,
    title: "Custom instructions",
    description:
      "Set length limits, banned words or a house style once and apply them to every generation.",
    wide: false,
  },
  {
    icon: FileSpreadsheet,
    title: "CSV and XMP export",
    description:
      "Export agency-ready CSV files or write metadata straight into XMP sidecars and embedded fields.",
    wide: false,
  },
];

const STEPS = [
  {
    title: "Install the desktop app",
    description: "A lightweight installer for Windows 10 and 11.",
  },
  {
    title: "Add your files",
    description: "Drag in a folder of images, videos or vectors.",
  },
  {
    title: "Generate metadata",
    description: "Titles, descriptions and keywords are written for every file.",
  },
  {
    title: "Review and export",
    description: "Edit anything inline, then export for your agency of choice.",
  },
];

const CREATORS = [
  {
    icon: Camera,
    title: "Photographers",
    description: "Tag full shoots in one pass instead of file by file.",
  },
  {
    icon: PenTool,
    title: "Illustrators",
    description: "Precise, searchable descriptions for vectors and icons.",
  },
  {
    icon: Video,
    title: "Videographers",
    description: "Descriptive metadata for footage and motion assets.",
  },
  {
    icon: FileText,
    title: "Studios",
    description: "Consistent metadata across large, multi-author catalogs.",
  },
];

const SAMPLE = {
  file: "watercolor-splash-0142.png",
  title:
    "Watercolor Splash Texture Background with Vibrant Blue and Purple Hues for Artistic Designs",
  description:
    "A vibrant watercolor splash texture blending blue and purple hues. Ideal for adding an artistic touch to digital art, graphic design and creative backgrounds.",
  keywords: [
    "watercolor",
    "splash",
    "texture",
    "background",
    "blue",
    "purple",
    "artistic",
    "abstract",
    "paint",
    "stain",
    "wash",
    "creative",
    "illustration",
    "backdrop",
  ],
  totalKeywords: 45,
};

const PLATFORMS = [
  "Adobe Stock",
  "Shutterstock",
  "Freepik",
  "Getty Images",
  "iStock",
  "Alamy",
  "Pond5",
  "Depositphotos",
];

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function HomePage({ releaseInfo }: Props) {
  const downloadUrl = releaseInfo?.downloadUrl ?? "/download";
  const version = releaseInfo?.version;
  const isExternal = downloadUrl.startsWith("http");

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-[1200px] md:border-x">
        {/* ------------------------------ Hero ------------------------------ */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="lp-grid-bg pointer-events-none absolute inset-0"
          />

          <div className="relative px-6 pb-16 pt-16 md:px-12 md:pb-20 md:pt-24">
            {version && (
              <Link
                href="/download"
                className="lp-rise group mb-8 inline-flex items-center gap-2 rounded-full border bg-background py-1 pl-1 pr-3 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                <span className="rounded-full bg-foreground px-2 py-0.5 font-medium text-background">
                  New
                </span>
                <span>
                  GenMeta <span className="font-mono">v{version}</span> is
                  available
                </span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}

            <h1
              className="lp-rise max-w-3xl text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl md:text-6xl md:leading-[1.05]"
              style={{ animationDelay: "60ms" }}
            >
             Boost Your Microstock Sales with AI Powered Metadata.
            </h1>

            <p
              className="lp-rise mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
              style={{ animationDelay: "120ms" }}
            >
              GenMeta looks at your photos, videos and vectors and writes the
              titles, descriptions and keywords buyers search for — formatted
              for Adobe Stock, Shutterstock, Freepik and more.
            </p>

            <div
              className="lp-rise mt-10 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "180ms" }}
            >
              <Button
                asChild
                size="lg"
                className="h-11 gap-2 rounded-full px-6"
              >
                <a
                  href={downloadUrl}
                  {...(isExternal
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <WindowsIcon className="h-4 w-4" />
                  Download for Windows
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 rounded-full px-6"
              >
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>

            <p
              className="lp-rise mt-6 font-mono text-xs text-muted-foreground"
              style={{ animationDelay: "240ms" }}
            >
              Windows 10/11 · 64-bit · Free plan available
            </p>
          </div>

          {/* Product shot */}
          <div className="relative px-4 pb-4 md:px-12 md:pb-12">
            <div className="rounded-xl border bg-muted/50 p-1.5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] md:p-2 dark:shadow-none">
              <div className="overflow-hidden rounded-lg border bg-background">
                <Image
                  src="/Assets/app-light.png"
                  alt="GenMeta desktop app showing generated titles, descriptions and keywords"
                  width={2000}
                  height={1200}
                  priority
                  className="h-auto w-full dark:hidden"
                />
                <Image
                  src="/Assets/app-dark.png"
                  alt="GenMeta desktop app showing generated titles, descriptions and keywords"
                  width={2000}
                  height={1200}
                  priority
                  className="hidden h-auto w-full dark:block"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------- Platforms ---------------------------- */}
        <Section>
          <div className="overflow-hidden">
            <div className="border-b px-6 py-4 text-sm text-muted-foreground md:px-12">
              Formatted for
            </div>
            <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="flex animate-[ticker_28s_linear_infinite] shrink-0">
                {[...PLATFORMS, ...PLATFORMS].map((name, i) => (
                  <div
                    key={`a-${i}`}
                    className="flex shrink-0 items-center justify-center border-r px-8 py-6 text-base font-semibold tracking-tight text-foreground/60 hover:text-foreground transition-colors whitespace-nowrap md:px-12 md:text-lg"
                  >
                    {name}
                  </div>
                ))}
              </div>
              <div
                aria-hidden
                className="flex animate-[ticker_28s_linear_infinite] shrink-0"
              >
                {[...PLATFORMS, ...PLATFORMS].map((name, i) => (
                  <div
                    key={`b-${i}`}
                    className="flex shrink-0 items-center justify-center border-r px-8 py-6 text-base font-semibold tracking-tight text-foreground/60 hover:text-foreground transition-colors whitespace-nowrap md:px-12 md:text-lg"
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ---------------------------- Features (Bento) -------------------- */}
        <Section id="features">
          <SectionHeader
            eyebrow="Features"
            title="Everything between export and upload."
            description="GenMeta replaces the spreadsheet, the keyword tool and the manual copy-paste with a single desktop app."
          />

          {/* Bento grid — original 6 features */}
          <div className="grid gap-px border-t bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon, title, description, wide }) => (
              <BentoCell
                key={title}
                icon={icon}
                title={title}
                description={description}
                className={wide ? "lg:col-span-2" : undefined}
                highlight={wide}
              />
            ))}
          </div>
        </Section>

        {/* ---------------------------- Workflow ---------------------------- */}
        <Section id="how-it-works">
          <div className="grid lg:grid-cols-2">
            <div className="border-b px-6 py-14 md:px-12 md:py-20 lg:border-b-0 lg:border-r">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                How it works
              </p>
              <h2 className="mt-4 max-w-md text-balance text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                From folder to CSV in four steps.
              </h2>

              <ol className="mt-10 space-y-0">
                {STEPS.map((step, i) => (
                  <li
                    key={step.title}
                    className="relative flex gap-5 pb-8 last:pb-0"
                  >
                    {i < STEPS.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-[13px] top-8 h-[calc(100%-2rem)] w-px bg-border"
                      />
                    )}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background font-mono text-[11px] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="pt-0.5">
                      <h3 className="text-[15px] font-medium tracking-tight">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center bg-muted/30 px-4 py-14 md:px-12 md:py-20">
              <OutputPanel />
            </div>
          </div>
        </Section>

        {/* ---------------------------- Creators ---------------------------- */}
        <Section>
          <SectionHeader
            eyebrow="Who it's for"
            title="Built for people who upload every week."
          />
          <div className="grid gap-px border-t bg-border sm:grid-cols-2 lg:grid-cols-4">
            {CREATORS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-background p-6 md:p-10">
                <Icon
                  className="h-5 w-5 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <h3 className="mt-5 text-[15px] font-medium tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
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
              <Button
                asChild
                size="lg"
                className="h-11 gap-2 rounded-full px-6"
              >
                <a
                  href={downloadUrl}
                  {...(isExternal
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <WindowsIcon className="h-4 w-4" />
                  Download free
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 gap-1 rounded-full px-6"
              >
                <Link href="/pricing">
                  Compare plans
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

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

function OutputPanel() {
  const remaining = SAMPLE.totalKeywords - SAMPLE.keywords.length;

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-background text-sm shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] dark:shadow-none">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <span className="truncate font-mono text-xs text-muted-foreground">
            {SAMPLE.file}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Generated
        </span>
      </div>

      <dl className="divide-y">
        <Field label="Title" meta={`${SAMPLE.title.length} chars`}>
          <p className="font-medium leading-snug">{SAMPLE.title}</p>
        </Field>
        <Field label="Description" meta={`${SAMPLE.description.length} chars`}>
          <p className="leading-relaxed text-muted-foreground">
            {SAMPLE.description}
          </p>
        </Field>
        <Field label="Keywords" meta={`${SAMPLE.totalKeywords} keywords`}>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE.keywords.map((k) => (
              <span
                key={k}
                className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
              >
                {k}
              </span>
            ))}
            <span className="px-1 py-0.5 font-mono text-xs text-muted-foreground">
              +{remaining}
            </span>
          </div>
        </Field>
      </dl>

      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3">
        <span className="font-mono text-xs text-muted-foreground">
          adobe-stock.csv
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Export
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  meta,
  children,
}: {
  label: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-4">
      <div className="mb-2 flex items-center justify-between">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <span className="font-mono text-[11px] text-muted-foreground/80">
          {meta}
        </span>
      </div>
      <dd>{children}</dd>
    </div>
  );
}

/** Individual bento grid cell */
function BentoCell({
  icon: Icon,
  title,
  description,
  className,
  highlight,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 bg-background p-6 transition-colors hover:bg-muted/40 md:p-10",
        className
      )}
    >
      {highlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/[0.03] to-transparent"
        />
      )}
      <Icon
        className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground"
        strokeWidth={1.5}
      />
      <div>
        <h3 className="text-[15px] font-medium tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M3 5.1 10.4 4v7.2H3V5.1Zm0 13.8 7.4 1.1v-7.1H3v6Zm8.2 1.2L21 21.5V12.9h-9.8v7.2Zm0-16.2v7.3H21V2.5l-9.8 1.4Z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Footer                                   */
/* -------------------------------------------------------------------------- */

const FOOTER_LINKS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { href: "/download", label: "Download" },
      { href: "/pricing", label: "Pricing" },
      { href: "/docs", label: "Documentation" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/refund-policy", label: "Refund Policy" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:border-x md:px-12">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80">
              <svg viewBox="0 0 106.37 106.37" className="h-8 w-8 shrink-0" aria-hidden>
                <defs>
                  <linearGradient id="ft-lg" x1="9.2" y1="8.82" x2="35.33" y2="35.93" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#2563ec" />
                    <stop offset="1" stopColor="#2563ec" />
                  </linearGradient>
                  <linearGradient id="ft-lg2" x1="25.35" y1="-6.74" x2="51.48" y2="20.36" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#2563ec" />
                    <stop offset="1" stopColor="#2563ec" />
                  </linearGradient>
                  <linearGradient id="ft-lg3" x1="-6.35" y1="23.82" x2="19.78" y2="50.92" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#2563ec" />
                    <stop offset="1" stopColor="#2563ec" />
                  </linearGradient>
                </defs>
                <path fill="#a3b4d2" d="M68.41,27.77c3.3.66,7.01,2.53,9.71,5.17,2.7,2.64,4.4,6.06,3.69,9.8-.37,1.48-1.43,2.83-2.68,4.11-1.25,1.28-2.69,2.49-3.83,3.68-.73.8-2,1.88-3,2.99-1,1.11-1.74,2.26-1.4,3.2.19.56.6,1.06,1.1,1.42s1.11.6,1.71.65c1.58.12,3.31-1.47,5.01-3.28s3.35-3.84,4.77-4.59c2.15-1.26,3.78-.39,5.05,1.19,1.27,1.57,2.19,3.84,2.92,5.37.62,1.35,1.22,2.72,1.82,4.1.59,1.37,1.17,2.75,1.75,4.13,1.08,2.62,2.21,5.2,3.36,7.76,1.15,2.56,2.33,5.11,3.51,7.7,1.12,2.63,2.5,5.43,3.43,8.3.93,2.87,1.41,5.82.71,8.74-.82,3.58-3.29,6.03-6.35,7.26-3.07,1.23-6.73,1.23-9.93-.07-1.28-.57-3.6-1.62-6.28-2.82-2.68-1.2-5.72-2.57-8.41-3.78-1.35-.61-2.6-1.17-3.69-1.66-1.08-.49-1.99-.9-2.64-1.19-.52-.2-.98-.5-1.32-.9s-.57-.89-.62-1.47c-.11-.66.05-1.37.36-2.03s.78-1.28,1.28-1.76c1.13-1.17,2.64-2.49,3.84-3.82,1.21-1.33,2.12-2.67,2.07-3.89,0-.68-.32-1.28-.8-1.72s-1.12-.7-1.79-.69c-1.28.07-2.34.8-3.32,1.73s-1.86,2.07-2.78,2.95c-.9.94-1.79,1.91-2.74,2.8-.95.9-1.95,1.72-3.08,2.35-1.22.69-2.51.78-3.82.56s-2.66-.75-4-1.31c-1.67-.7-3.36-1.5-5.05-2.32s-3.36-1.67-5.01-2.49c-1.87-.86-3.14-2.09-3.6-3.53-.46-1.44-.12-3.09,1.24-4.78,1.11-1.4,2.53-2.71,3.97-4.02,1.44-1.31,2.9-2.61,4.09-3.98.84-.85,1.38-2.03,1.38-3.08,0-1.05-.53-1.98-1.87-2.33-.74-.19-1.53-.02-2.29.35-.75.37-1.47.93-2.04,1.5-1.14,1.1-2.3,2.41-3.46,3.67s-2.33,2.48-3.49,3.42c-1.6,1.34-3.16,1.78-4.49,1.39-1.33-.39-2.43-1.62-3.1-3.64-2.54-7.01-.59-12.64,3.09-17.67,3.69-5.02,9.12-9.43,13.55-13.96,3.18-4.07,6.45-6.98,10.21-8.61,3.76-1.63,8.02-1.97,13.15-.9h.04Z" />
                <path fill="url(#ft-lg)" d="M28.9,11.18c-.68-1.06-1.47-2.08-2.39-2.95-.92-.87-1.97-1.58-3.2-2.03-2.51-1.13-5.34-1.33-7.98-.74-2.65.59-5.11,1.97-6.9,4.01l-.03.03-.03.03c-1.82,2.16-2.9,4.95-3.1,7.78s.47,5.7,2.15,8.02c.78,1.15,1.71,2.02,2.74,2.77s2.17,1.4,3.35,2.08c2.13,1.22,4.73,2.59,7.23,3.84s4.9,2.37,6.65,3.09c.73.3,1.46.55,2.22.73s1.52.28,2.34.28c1.8.06,3.36-.54,4.48-1.61,1.11-1.07,1.78-2.61,1.77-4.42.01-1.05-.15-2.08-.43-3.08-.27-1.01-.65-1.99-1.06-2.94-1.08-2.38-2.27-5.03-3.57-7.62-1.3-2.59-2.72-5.12-4.24-7.28Z" />
                <path fill="url(#ft-lg2)" d="M51.64,7.73c-.35-2.58-1.74-4.7-3.67-6.07-1.93-1.36-4.39-1.97-6.87-1.5-2.38.31-4.55,1.66-5.94,3.53-1.39,1.87-2.02,4.25-1.31,6.63.4,1.42.94,2.85,1.53,4.27s1.24,2.83,1.87,4.18c.53,1.05,1.02,2.13,1.57,3.13s1.17,1.92,1.96,2.65c1.18,1.17,2.66,1.43,4.02,1.06,1.36-.37,2.6-1.38,3.31-2.73.66-1.32,1.25-3.06,1.73-4.82.49-1.76.87-3.55,1.12-4.95v-.04Z" />
                <path fill="url(#ft-lg3)" d="M20.51,37.75c-1.22-.6-2.59-1.25-3.96-1.87s-2.74-1.18-3.98-1.62c-2.42-.96-4.98-.95-7.16-.06-2.18.89-3.98,2.65-4.88,5.17-1.06,2.7-.45,5.76,1.15,8.12,1.61,2.35,4.21,4,7.15,3.85h.04c1.16-.1,2.24-.26,3.33-.46,1.1-.2,2.21-.42,3.42-.65,1.64-.43,3.48-.76,5.17-1.32,1.69-.56,3.24-1.35,4.31-2.7.46-.63.71-1.42.75-2.23.04-.81-.12-1.65-.47-2.39-.47-1-1.23-1.72-2.11-2.32s-1.87-1.06-2.8-1.54Z" />
              </svg>
              <span className="text-base font-semibold tracking-[-0.03em]">GenMeta</span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI metadata generation for microstock contributors. Built for
              Windows.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <a
                href="mailto:support@genmeta.app"
                className="block text-muted-foreground transition-colors hover:text-foreground"
              >
                support@genmeta.app
              </a>
              <a
                href="https://wa.me/8801817710493"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                WhatsApp support
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h4 className="text-sm font-medium">{group.heading}</h4>
              <ul className="mt-4 space-y-3 text-sm">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col-reverse items-start justify-between gap-6 border-t pt-8 md:flex-row md:items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} GenMeta Technologies. All rights
            reserved.
          </p>
          <div className="w-full max-w-[260px] opacity-80">
            <Image
              src="/Assets/Payment Gateway Dark.png"
              alt="Supported payment methods"
              width={300}
              height={60}
              className="h-auto w-full dark:hidden"
            />
            <Image
              src="/Assets/Payment Gateway Light.png"
              alt="Supported payment methods"
              width={300}
              height={60}
              className="hidden h-auto w-full dark:block"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
