import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { platforms } from "./data";
import { Reveal } from "./reveal";

export function Hero({ downloadUrl }: { downloadUrl?: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="lp-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
        <Reveal>
          <p className="font-lpmono text-xs uppercase tracking-[0.14em] text-lp-muted">
            Desktop app for microstock contributors
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mt-6 max-w-4xl font-display text-[2.9rem] leading-[1.02] tracking-tight sm:text-7xl lg:text-[5.5rem]">
            Metadata that sells your work,{" "}
            <em className="text-lp-accent not-italic">written in seconds.</em>
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-lp-muted">
            GenMeta reads your photos, videos and vectors and writes titles,
            descriptions and keywords tuned for how buyers search on Adobe Stock,
            Shutterstock and Freepik.
          </p>
        </Reveal>

        <Reveal delay={240} className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href={downloadUrl ?? "/download"}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-lp-accent px-6 text-sm font-medium text-lp-accent-ink transition-transform hover:-translate-y-0.5"
          >
            <Download className="h-4 w-4" />
            Download free for Windows
          </a>
          <Link
            href="/pricing"
            className="group inline-flex h-12 items-center gap-1.5 rounded-full border border-lp-line px-6 text-sm text-lp-ink transition-colors hover:bg-lp-surface"
          >
            See Pro pricing
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </Reveal>

        <Reveal delay={320}>
          <p className="mt-5 text-sm text-lp-muted">
            Windows 10/11 (64-bit) · Free version available
          </p>
        </Reveal>

        <Reveal delay={200} className="mt-16">
          <div className="overflow-hidden rounded-xl border border-lp-line bg-lp-surface shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]">
            <Image
              src="/Assets/app-light.png"
              alt="GenMeta app showing generated metadata for a batch of images"
              width={2000}
              height={1200}
              priority
              className="h-auto w-full dark:hidden"
            />
            <Image
              src="/Assets/app-dark.png"
              alt="GenMeta app showing generated metadata for a batch of images"
              width={2000}
              height={1200}
              priority
              className="hidden h-auto w-full dark:block"
            />
          </div>
        </Reveal>

        <Reveal className="mt-12 flex flex-col gap-4 border-t border-lp-line pt-8 sm:flex-row sm:items-center sm:gap-10">
          <p className="shrink-0 font-lpmono text-xs uppercase tracking-[0.14em] text-lp-muted">
            Built for
          </p>
          <ul className="flex flex-wrap gap-x-8 gap-y-2 font-display text-xl text-lp-ink">
            {platforms.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
