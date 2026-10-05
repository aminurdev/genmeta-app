"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { UserMenu } from "./user-menu";
import { LoaderCircle, Menu, X } from "lucide-react";
import { NavLinks, MobileNavLinks } from "./navLinks";
import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUserWithRefresh, logout } from "@/services/auth-services";
import type { User } from "@/types/user";
import { WindowsIcon } from "./Home";
import { ThemeToggle } from "./theme-toggle";

interface NavigationProps {
  propUser: User | null;
}

export function Navigation({ propUser }: NavigationProps) {
  const [loading, setLoading] = useState(propUser ? false : true);
  const [user, setUser] = useState<User | null>(propUser);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUserWithRefresh();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (!user) {
      fetchUser();
    }
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          setIsScrolled(scrollTop > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    const result = await logout();
    setIsLoading(false);

    if (result.success) {
      setUser(null);
      if (pathname !== "/") {
        router.push("/login");
      }
    } else {
      console.error(result.message);
    }
  };

  return (
    <div className="mb-16">
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/90 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-background/60 backdrop-blur-sm border-b border-border/50"
        }`}
      >
        {/* Inner wrapper — matches home page max-width & border */}
        <div className="mx-auto max-w-[1300px] md:border-x border-border">
          <div
            className={`flex items-center justify-between px-6 transition-all duration-300 md:px-12 ${
              isScrolled ? "h-12" : "h-14"
            }`}
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80 focus:outline-none"
              aria-label="GenMeta home"
            >
              <GenMetaLogo />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              <NavLinks />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle className="h-8 w-8 text-muted-foreground hover:text-foreground" />

              {loading ? (
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                </Button>
              ) : user ? (
                <UserMenu
                  user={user}
                  handleLogout={handleLogout}
                  isLoading={isLoading}
                />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden sm:inline-flex h-8 rounded-full px-4 text-muted-foreground hover:text-foreground"
                >
                  <Link href="/login">Log in</Link>
                </Button>
              )}

              <Button
                asChild
                size="sm"
                className="hidden md:inline-flex h-8 gap-1.5 rounded-full px-4"
              >
                <Link href="/download">
                  <WindowsIcon className="h-3.5 w-3.5" />
                  Download
                </Link>
              </Button>

              {/* Mobile menu trigger */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-8 w-8"
                    aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                    onClick={handleMobileMenuToggle}
                  >
                    {isMobileMenuOpen ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Menu className="h-4 w-4" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[280px] sm:w-[320px] border-l border-border bg-background p-0"
                >
                  <div className="flex flex-col h-full">
                    {/* Sheet header */}
                    <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
                      <GenMetaLogo />
                    </div>

                    {/* Navigation links */}
                    <div className="flex-1 overflow-y-auto px-4 py-6">
                      <MobileNavLinks onLinkClick={closeMobileMenu} />
                    </div>

                    {/* Mobile bottom actions */}
                    <div className="border-t border-border p-4 space-y-3">
                      {loading ? (
                        <Button variant="outline" size="icon">
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        </Button>
                      ) : user ? (
                        <div className="space-y-3">
                          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                            <p className="text-[13px] font-medium">{user.name}</p>
                            <p className="text-[11px] text-muted-foreground">{user.email}</p>
                          </div>
                          <UserMenu
                            user={user}
                            handleLogout={handleLogout}
                            isLoading={isLoading}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            asChild
                            className="w-full h-9 rounded-full"
                            onClick={closeMobileMenu}
                          >
                            <Link href="/login">Log in</Link>
                          </Button>
                          <Button
                            asChild
                            className="w-full h-9 gap-1.5 rounded-full"
                            onClick={closeMobileMenu}
                          >
                            <Link href="/download">
                              <WindowsIcon className="h-3.5 w-3.5" />
                              Download free
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              GenMeta Logo                                   */
/* -------------------------------------------------------------------------- */

function GenMetaLogo() {
  return (
    <span className="flex items-center gap-2">
      {/* Icon — inline SVG so it inherits colour correctly */}
      <svg
        viewBox="0 0 106.37 106.37"
        className="h-6 w-6 shrink-0"
        aria-hidden
      >
        <defs>
          <linearGradient id="nav-lg" x1="9.2" y1="8.82" x2="35.33" y2="35.93" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2563ec" />
            <stop offset="1" stopColor="#2563ec" />
          </linearGradient>
          <linearGradient id="nav-lg2" x1="25.35" y1="-6.74" x2="51.48" y2="20.36" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2563ec" />
            <stop offset="1" stopColor="#2563ec" />
          </linearGradient>
          <linearGradient id="nav-lg3" x1="-6.35" y1="23.82" x2="19.78" y2="50.92" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2563ec" />
            <stop offset="1" stopColor="#2563ec" />
          </linearGradient>
        </defs>
        <path fill="#a3b4d2" d="M68.41,27.77c3.3.66,7.01,2.53,9.71,5.17,2.7,2.64,4.4,6.06,3.69,9.8-.37,1.48-1.43,2.83-2.68,4.11-1.25,1.28-2.69,2.49-3.83,3.68-.73.8-2,1.88-3,2.99-1,1.11-1.74,2.26-1.4,3.2.19.56.6,1.06,1.1,1.42s1.11.6,1.71.65c1.58.12,3.31-1.47,5.01-3.28s3.35-3.84,4.77-4.59c2.15-1.26,3.78-.39,5.05,1.19,1.27,1.57,2.19,3.84,2.92,5.37.62,1.35,1.22,2.72,1.82,4.1.59,1.37,1.17,2.75,1.75,4.13,1.08,2.62,2.21,5.2,3.36,7.76,1.15,2.56,2.33,5.11,3.51,7.7,1.12,2.63,2.5,5.43,3.43,8.3.93,2.87,1.41,5.82.71,8.74-.82,3.58-3.29,6.03-6.35,7.26-3.07,1.23-6.73,1.23-9.93-.07-1.28-.57-3.6-1.62-6.28-2.82-2.68-1.2-5.72-2.57-8.41-3.78-1.35-.61-2.6-1.17-3.69-1.66-1.08-.49-1.99-.9-2.64-1.19-.52-.2-.98-.5-1.32-.9s-.57-.89-.62-1.47c-.11-.66.05-1.37.36-2.03s.78-1.28,1.28-1.76c1.13-1.17,2.64-2.49,3.84-3.82,1.21-1.33,2.12-2.67,2.07-3.89,0-.68-.32-1.28-.8-1.72s-1.12-.7-1.79-.69c-1.28.07-2.34.8-3.32,1.73s-1.86,2.07-2.78,2.95c-.9.94-1.79,1.91-2.74,2.8-.95.9-1.95,1.72-3.08,2.35-1.22.69-2.51.78-3.82.56s-2.66-.75-4-1.31c-1.67-.7-3.36-1.5-5.05-2.32s-3.36-1.67-5.01-2.49c-1.87-.86-3.14-2.09-3.6-3.53-.46-1.44-.12-3.09,1.24-4.78,1.11-1.4,2.53-2.71,3.97-4.02,1.44-1.31,2.9-2.61,4.09-3.98.84-.85,1.38-2.03,1.38-3.08,0-1.05-.53-1.98-1.87-2.33-.74-.19-1.53-.02-2.29.35-.75.37-1.47.93-2.04,1.5-1.14,1.1-2.3,2.41-3.46,3.67s-2.33,2.48-3.49,3.42c-1.6,1.34-3.16,1.78-4.49,1.39-1.33-.39-2.43-1.62-3.1-3.64-2.54-7.01-.59-12.64,3.09-17.67,3.69-5.02,9.12-9.43,13.55-13.96,3.18-4.07,6.45-6.98,10.21-8.61,3.76-1.63,8.02-1.97,13.15-.9h.04Z" />
        <path fill="url(#nav-lg)" d="M28.9,11.18c-.68-1.06-1.47-2.08-2.39-2.95-.92-.87-1.97-1.58-3.2-2.03-2.51-1.13-5.34-1.33-7.98-.74-2.65.59-5.11,1.97-6.9,4.01l-.03.03-.03.03c-1.82,2.16-2.9,4.95-3.1,7.78s.47,5.7,2.15,8.02c.78,1.15,1.71,2.02,2.74,2.77s2.17,1.4,3.35,2.08c2.13,1.22,4.73,2.59,7.23,3.84s4.9,2.37,6.65,3.09c.73.3,1.46.55,2.22.73s1.52.28,2.34.28c1.8.06,3.36-.54,4.48-1.61,1.11-1.07,1.78-2.61,1.77-4.42.01-1.05-.15-2.08-.43-3.08-.27-1.01-.65-1.99-1.06-2.94-1.08-2.38-2.27-5.03-3.57-7.62-1.3-2.59-2.72-5.12-4.24-7.28Z" />
        <path fill="url(#nav-lg2)" d="M51.64,7.73c-.35-2.58-1.74-4.7-3.67-6.07-1.93-1.36-4.39-1.97-6.87-1.5-2.38.31-4.55,1.66-5.94,3.53-1.39,1.87-2.02,4.25-1.31,6.63.4,1.42.94,2.85,1.53,4.27s1.24,2.83,1.87,4.18c.53,1.05,1.02,2.13,1.57,3.13s1.17,1.92,1.96,2.65c1.18,1.17,2.66,1.43,4.02,1.06,1.36-.37,2.6-1.38,3.31-2.73.66-1.32,1.25-3.06,1.73-4.82.49-1.76.87-3.55,1.12-4.95v-.04Z" />
        <path fill="url(#nav-lg3)" d="M20.51,37.75c-1.22-.6-2.59-1.25-3.96-1.87s-2.74-1.18-3.98-1.62c-2.42-.96-4.98-.95-7.16-.06-2.18.89-3.98,2.65-4.88,5.17-1.06,2.7-.45,5.76,1.15,8.12,1.61,2.35,4.21,4,7.15,3.85h.04c1.16-.1,2.24-.26,3.33-.46,1.1-.2,2.21-.42,3.42-.65,1.64-.43,3.48-.76,5.17-1.32,1.69-.56,3.24-1.35,4.31-2.7.46-.63.71-1.42.75-2.23.04-.81-.12-1.65-.47-2.39-.47-1-1.23-1.72-2.11-2.32s-1.87-1.06-2.8-1.54Z" />
      </svg>
      {/* Wordmark */}
      <span className="text-[15px] font-semibold tracking-[-0.03em]">
        GenMeta
      </span>
    </span>
  );
}
