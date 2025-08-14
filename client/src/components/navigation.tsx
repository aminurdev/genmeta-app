"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { UserMenu } from "./user-menu";
import Image from "next/image";
import { LoaderCircle, Menu, X } from "lucide-react";
import { NavLinks, MobileNavLinks } from "./navLinks";
import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getCurrentUserWithRefresh } from "@/services/auth-services";
import type { User } from "@/types/user";

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
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    user ? () => {} : fetchUser();
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

  return (
    <div className="mb-20">
      <nav
        className={`fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-500 ease-out ${
          isScrolled ? "shadow-lg shadow-black/5" : ""
        }`}
      >
        <div
          className={`mx-auto flex items-center justify-between px-4 transition-all duration-500 ease-out ${
            isScrolled
              ? "h-12 md:h-12 max-w-screen-xl"
              : "h-20 md:h-24 max-w-screen-2xl"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-4 w-52">
            <Link
              href="/"
              className="transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
            >
              <Image
                src="/Assets/SVG/logo.svg"
                className={`py-2 w-auto transition-all duration-500 ease-out ${
                  isScrolled ? "h-12" : "h-16"
                }`}
                alt="GenMeta logo"
                width={128}
                height={128}
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-5">
            <NavLinks />
          </div>

          {/* User Authentication */}
          <div className="flex items-center gap-4">
            {loading ? (
              <Button variant="outline" size="icon">
                <LoaderCircle className="animate-spin" />
              </Button>
            ) : user ? (
              <UserMenu user={user} />
            ) : (
              <span className="hidden lg:flex items-center gap-4">
                <Button
                  variant="outline"
                  asChild
                  className="transition-all duration-300 hover:scale-105 bg-transparent hover:bg-accent/50"
                >
                  <Link href="/login">Login</Link>
                </Button>
              </span>
            )}

            <Button
              asChild
              className="transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              <Link
                className="hidden md:flex items-center gap-2"
                href="/download"
              >
                <Image
                  src="/Assets/SVG/win.svg"
                  alt="Download"
                  width={16}
                  height={16}
                />
                Download
              </Link>
            </Button>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden transition-all duration-300 hover:scale-105 hover:bg-accent/50"
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  onClick={handleMobileMenuToggle}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6 transition-transform duration-300 rotate-90" />
                  ) : (
                    <Menu className="h-6 w-6 transition-transform duration-300" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[350px] transition-all duration-500 ease-out"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center pb-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">
                      Menu
                    </h2>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex-1 py-6">
                    <div className="space-y-2">
                      <MobileNavLinks onLinkClick={closeMobileMenu} />
                    </div>
                  </div>

                  {/* User Section */}
                  <div className="border-t border-border pt-4 mt-auto">
                    {loading ? (
                      <Button variant="outline" size="icon">
                        <LoaderCircle className="animate-spin" />
                      </Button>
                    ) : user ? (
                      <div className="space-y-3">
                        <div className="px-3 py-2 rounded-lg bg-muted/50 transition-colors duration-200">
                          <p className="text-sm font-medium text-foreground">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <UserMenu user={user} />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          asChild
                          className="w-full transition-all duration-300 hover:scale-[0.98] hover:bg-accent/50 bg-transparent"
                          onClick={closeMobileMenu}
                        >
                          <Link href="/login">Login</Link>
                        </Button>
                        <Button
                          asChild
                          className="w-full transition-all duration-300 hover:scale-[0.98] hover:shadow-md"
                          onClick={closeMobileMenu}
                        >
                          <Link href="/signup">Sign Up</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </div>
  );
}
