import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WindowsIcon } from "@/components/Home";
import { getLatestRelease } from "@/lib/release-info";

const STEPS = [
  "Run the installer",
  "Sign in and add your Gemini API key",
  "Add a folder of files and generate",
];

export default async function DownloadPage() {
  const releaseInfo = await getLatestRelease();
  const downloadUrl = releaseInfo?.downloadUrl;
  const version = releaseInfo?.version;
  const fileSize = releaseInfo?.fileSize;

  const meta = [
    version ? `v${version}` : null,
    "Windows 10/11 · 64-bit",
    fileSize ? `${fileSize} MB` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-[1300px] md:border-x">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="lp-grid-bg pointer-events-none absolute inset-0"
          />
          <div className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center md:px-12">
            <h1 className="lp-rise max-w-2xl text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl md:text-6xl md:leading-[1.05]">
              Download GenMeta for Windows.
            </h1>
            <p
              className="lp-rise mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
              style={{ animationDelay: "60ms" }}
            >
              AI-written titles, descriptions and keywords for your microstock
              uploads. Free plan available.
            </p>

            <div
              className="lp-rise mt-10 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "120ms" }}
            >
              {downloadUrl ? (
                <Button asChild size="lg" className="h-11 gap-2 rounded-full px-6">
                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                    <WindowsIcon className="h-4 w-4" />
                    Download for Windows
                  </a>
                </Button>
              ) : (
                <Button size="lg" disabled className="h-11 gap-2 rounded-full px-6">
                  <WindowsIcon className="h-4 w-4" />
                  Unavailable right now
                </Button>
              )}
            </div>

            <p
              className="lp-rise mt-6 font-mono text-xs text-muted-foreground"
              style={{ animationDelay: "180ms" }}
            >
              {meta}
            </p>
          </div>

          <ol className="relative grid gap-px border-t bg-border md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step}
                className="flex items-center gap-4 bg-background px-6 py-6 md:px-10"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ------------------------------- CTA ------------------------------ */}
        <section className="relative border-t overflow-hidden">
          <span
            aria-hidden
            className="lp-cross -left-[7px] -top-[7px] z-10 hidden md:block"
          />
          <span
            aria-hidden
            className="lp-cross -right-[7px] -top-[7px] z-10 hidden md:block"
          />
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
              {downloadUrl ? (
                <Button
                  asChild
                  size="lg"
                  className="h-11 gap-2 rounded-full px-6"
                >
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WindowsIcon className="h-4 w-4" />
                    Download free
                  </a>
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled
                  className="h-11 gap-2 rounded-full px-6"
                >
                  <WindowsIcon className="h-4 w-4" />
                  Unavailable right now
                </Button>
              )}
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
        </section>
      </div>
    </div>
  );
}
