import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CreditCard,
  Download,
  HelpCircle,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/Home";

const QUICK_LINKS = [
  {
    icon: Home,
    title: "Home",
    description: "Explore AI metadata generation for microstock contributors.",
    href: "/",
  },
  {
    icon: Download,
    title: "Download App",
    description: "Get the GenMeta desktop application for Windows 10 & 11.",
    href: "/download",
  },
  {
    icon: CreditCard,
    title: "Pricing & Plans",
    description: "Compare free, pay-as-you-go credit, and subscription plans.",
    href: "/pricing",
  },
  {
    icon: HelpCircle,
    title: "Contact Support",
    description: "Report a broken link or get help from our support team.",
    href: "/contact",
  },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navigation propUser={null} />

      <main className="flex-1">
        <div className="mx-auto max-w-[1300px] md:border-x border-border">
          {/* Hero 404 Section */}
          <section className="relative overflow-hidden">
            <div
              aria-hidden
              className="lp-grid-bg pointer-events-none absolute inset-0"
            />

            <div className="relative flex min-h-[58vh] flex-col items-center justify-center px-6 py-20 text-center md:px-12 md:py-28">
              <div className="lp-rise inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                <span>ERROR 404 · NOT FOUND</span>
              </div>

              <div
                className="lp-rise mt-6 font-mono text-7xl font-semibold tracking-[-0.06em] text-foreground sm:text-8xl md:text-9xl"
                style={{ animationDelay: "60ms" }}
              >
                404
              </div>

              <h1
                className="lp-rise mt-4 max-w-xl text-balance text-2xl font-semibold tracking-[-0.03em] sm:text-3xl md:text-4xl"
                style={{ animationDelay: "120ms" }}
              >
                This page could not be found.
              </h1>

              <p
                className="lp-rise mt-4 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground md:text-base"
                style={{ animationDelay: "180ms" }}
              >
                The page you&apos;re looking for doesn&apos;t exist, has been
                removed, or its URL was changed.
              </p>

              <div
                className="lp-rise mt-8 flex flex-col items-center gap-3 sm:flex-row"
                style={{ animationDelay: "240ms" }}
              >
                <Button
                  asChild
                  size="lg"
                  className="h-11 gap-2 rounded-full px-6"
                >
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-11 gap-1.5 rounded-full px-6"
                >
                  <Link href="/download">
                    Download GenMeta
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Quick Navigation Grid */}
          <section className="relative border-t border-border">
            <span
              aria-hidden
              className="lp-cross -left-[7px] -top-[7px] z-10 hidden md:block"
            />
            <span
              aria-hidden
              className="lp-cross -right-[7px] -top-[7px] z-10 hidden md:block"
            />

            <div className="border-b border-border px-6 py-4 font-mono text-xs uppercase tracking-wider text-muted-foreground md:px-12">
              Where to go next
            </div>

            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_LINKS.map(({ icon: Icon, title, description, href }) => (
                <Link
                  key={title}
                  href={href}
                  className="group relative flex flex-col justify-between bg-background p-6 transition-colors hover:bg-muted/40 md:p-8"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground group-hover:opacity-100" />
                    </div>
                    <h2 className="mt-5 text-[15px] font-medium tracking-tight text-foreground">
                      {title}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
