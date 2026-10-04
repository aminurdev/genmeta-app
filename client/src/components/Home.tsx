"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

// Footer Component
export const Footer = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="bg-muted/30 border-t py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                <Image
                  src="/Assets/SVG/logo.svg"
                  className="h-16 w-auto"
                  alt="GenMeta logo"
                  width={128}
                  height={128}
                />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Transform your images with our powerful desktop application
              featuring advanced AI technology and professional-grade metadata
              tools.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact Us" },
                { href: "/pricing", label: "Pricing" },
                { href: "/download", label: "Download App" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { href: "/terms", label: "Terms & Conditions" },
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/refund-policy", label: "Refund Policy" },
                { href: "/delivery-policy", label: "Delivery Policy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <a
                  href="https://wa.me/8801817710493"
                  className="text-primary hover:underline"
                >
                  WhatsApp
                </a>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 mt-0.5 text-primary flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a
                  href="mailto:support@genmeta.app"
                  className="text-primary hover:underline break-all"
                >
                  support@genmeta.app
                </a>
              </li>
            </ul>
            {mounted && (
              <div className="mt-4">
                <Image
                  src={
                    resolvedTheme === "dark"
                      ? "/Assets/Payment Gateway Light.png"
                      : "/Assets/Payment Gateway Dark.png"
                  }
                  alt="Payment Gateway"
                  width={300}
                  height={60}
                  className="w-full max-w-xs h-auto"
                  priority={false}
                  key={resolvedTheme}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} GenMeta Technologies. All rights
              reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <span>•</span>
              <Link href="/privacy-policy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/refund-policy" className="hover:text-primary transition-colors">
                Refunds
              </Link>
              <span>•</span>
              <Link href="/contact" className="hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
