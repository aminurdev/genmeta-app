import type React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared primitives for text-heavy pages (legal, about, contact).
 * Single readable column, no grids or cards.
 */

export function LegalLayout({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto max-w-[1300px] px-6 py-16 md:py-24">
        <header className="mb-12 border-b pb-10">
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
            {title}
          </h1>
          {updated && (
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Last updated: {updated}
            </p>
          )}
          {intro && (
            <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
              {intro}
            </p>
          )}
        </header>

        <div className="space-y-12">{children}</div>

        <footer className="mt-16 border-t pt-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to home
          </Link>
        </footer>
      </div>
    </main>
  );
}

export function Sec({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      {title && (
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
      )}
      {children}
    </section>
  );
}

export function Sub({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="pt-2 text-[15px] font-medium tracking-tight">{children}</h3>
  );
}

export function P({
  children,
  strong,
  className,
}: {
  children: React.ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "leading-relaxed",
        strong ? "font-medium text-foreground" : "text-foreground/80",
        className
      )}
    >
      {children}
    </p>
  );
}

export function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 leading-relaxed text-foreground/80 marker:text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function OL({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 leading-relaxed text-foreground/80 marker:text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

export function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-foreground">{children}</strong>;
}

export function A({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const cls =
    "font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground";
  return external || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:") ? (
    <a
      href={href}
      className={cls}
      {...(href.startsWith("http")
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** Label / value rows, e.g. contact details. */
export function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y border-y">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6"
        >
          <dt className="w-44 shrink-0 text-sm text-muted-foreground">
            {label}
          </dt>
          <dd className="text-sm">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export const SUPPORT_CONTACT: [string, React.ReactNode][] = [
  ["Email", <A key="e" href="mailto:support@genmeta.app">support@genmeta.app</A>],
  ["Phone", <A key="p" href="tel:+8801817710493">+880 1817-710493</A>],
  [
    "WhatsApp",
    <A key="w" href="https://wa.me/8801817710493">
      +880 1817-710493
    </A>,
  ],
];

export const LEGAL_INFO: [string, React.ReactNode][] = [
  ["Trade License Number", "8875151896"],
  ["TIN", "892080214766"],
  ["Business Registration", "Registered under the laws of Bangladesh"],
];
