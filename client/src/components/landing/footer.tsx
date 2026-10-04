import Image from "next/image";
import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/download", label: "Download" },
      { href: "/pricing", label: "Pricing" },
      { href: "/docs", label: "Docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy-policy", label: "Privacy" },
      { href: "/refund-policy", label: "Refunds" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-lp-line bg-lp-surface">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" aria-label="GenMeta home">
              <Image
                src="/Assets/SVG/logo.svg"
                alt="GenMeta"
                width={128}
                height={128}
                className="h-12 w-auto"
              />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-lp-muted">
              AI metadata for microstock contributors. Titles, descriptions and
              keywords, generated on your desktop.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 md:col-span-7">
            {columns.map((c) => (
              <div key={c.title}>
                <h3 className="font-lpmono text-xs uppercase tracking-[0.14em] text-lp-muted">
                  {c.title}
                </h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="transition-colors hover:text-lp-accent">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h3 className="font-lpmono text-xs uppercase tracking-[0.14em] text-lp-muted">
                Support
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a href="https://wa.me/8801817710493" className="transition-colors hover:text-lp-accent">
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@genmeta.app"
                    className="break-all transition-colors hover:text-lp-accent"
                  >
                    support@genmeta.app
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-lp-line pt-6 text-sm text-lp-muted sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} GenMeta Technologies. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Image
              src="/Assets/Payment Gateway Dark.png"
              alt="Accepted payment methods"
              width={300}
              height={60}
              className="h-auto w-56 dark:hidden"
            />
            <Image
              src="/Assets/Payment Gateway Light.png"
              alt="Accepted payment methods"
              width={300}
              height={60}
              className="hidden h-auto w-56 dark:block"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
