import Link from "next/link";
import { Download } from "lucide-react";
import { Reveal } from "./reveal";

export function FinalCta({ downloadUrl }: { downloadUrl?: string }) {
  return (
    <section className="py-24 sm:py-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-4xl font-display text-5xl leading-[1.04] tracking-tight sm:text-7xl">
            Stop typing keywords.{" "}
            <span className="text-lp-accent">Start uploading.</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-lp-muted">
            Try GenMeta free and see how much of your next batch it can finish
            for you.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={downloadUrl ?? "/download"}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-lp-accent px-6 text-sm font-medium text-lp-accent-ink transition-transform hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" />
              Download free for Windows
            </a>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center rounded-full border border-lp-line px-6 text-sm transition-colors hover:bg-lp-surface"
            >
              View pricing
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
