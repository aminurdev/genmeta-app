"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserMenu } from "@/components/user-menu";
import { getCurrentUserWithRefresh, logout } from "@/services/auth-services";
import type { User } from "@/types/user";
import { cn } from "@/lib/utils";
import { navLinks } from "./data";
import { ThemeToggle } from "./theme-toggle";

export function LandingNavbar({ propUser }: { propUser: User | null }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(propUser);
  const [authReady, setAuthReady] = useState(Boolean(propUser));
  const [loggingOut, setLoggingOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (propUser) return;
    getCurrentUserWithRefresh()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthReady(true));
  }, [propUser]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    const result = await logout();
    setLoggingOut(false);
    if (result.success) {
      setUser(null);
      router.refresh();
    }
  }, [router]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-lp-line bg-lp-bg/85 backdrop-blur-md"
          : "border-transparent bg-lp-bg",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="GenMeta home" className="shrink-0">
          <Image
            src="/Assets/SVG/logo.svg"
            alt="GenMeta"
            width={128}
            height={128}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-lp-muted transition-colors hover:text-lp-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {authReady && user ? (
            <UserMenu user={user} handleLogout={handleLogout} isLoading={loggingOut} />
          ) : (
            authReady && (
              <Link
                href="/login"
                className="hidden text-sm text-lp-ink transition-colors hover:text-lp-accent sm:inline"
              >
                Log in
              </Link>
            )
          )}
          <Link
            href="/download"
            className="hidden h-9 items-center rounded-full bg-lp-ink px-4 text-sm font-medium text-lp-bg transition-opacity hover:opacity-85 md:inline-flex"
          >
            Download
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-lp-line text-lp-ink lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="landing w-[300px] border-lp-line bg-lp-bg">
              <SheetTitle className="font-display text-2xl text-lp-ink">Menu</SheetTitle>
              <div className="mt-8 flex flex-col">
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="border-b border-lp-line py-4 text-lg text-lp-ink"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/download"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-lp-ink text-sm font-medium text-lp-bg"
                >
                  Download for Windows
                </Link>
                {!user && (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-lp-line text-sm text-lp-ink"
                  >
                    Log in
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
