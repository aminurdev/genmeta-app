"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { UserMenu } from "./user-menu";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { NavLinks, MobileNavLinks } from "./navLinks";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { User } from "@/types/user";

interface NavigationProps {
  user?: User;
}

export function Navigation({ user }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 20);
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Cleanup
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="mb-20">
      <nav
        className={`fixed top-0 left-0 w-svw z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300 ease-in-out ${
          isScrolled ? "shadow-lg" : ""
        }`}
      >
        <div
          className={`mx-auto flex items-center justify-between px-4 transition-all duration-300 ease-in-out ${
            isScrolled
              ? "h-12 md:h-12 max-w-screen-xl" // Smaller height and width when scrolled
              : "h-20 md:h-24 max-w-screen-2xl" // Larger height and width initially
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-4 w-52">
            <Link
              href="/"
              className="transition-transform duration-300 hover:scale-105"
            >
              <Image
                src="/Assets/SVG/logo.svg"
                className={`py-2 w-auto transition-all duration-300 ease-in-out ${
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
            {user ? (
              <UserMenu user={user} />
            ) : (
              <span className="hidden lg:flex items-center gap-4">
                <Button
                  variant="outline"
                  asChild
                  className="transition-all duration-200 hover:scale-105 bg-transparent"
                >
                  <Link href="/login">Login</Link>
                </Button>
              </span>
            )}

            <Button
              asChild
              className="transition-all duration-200 hover:scale-105"
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

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger
                className="lg:hidden"
                aria-label="Toggle menu"
                onClick={handleMobileMenuToggle}
              >
                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground hover:scale-105 h-10 w-10">
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6 transition-transform duration-200" />
                  ) : (
                    <Menu className="h-6 w-6 transition-transform duration-200" />
                  )}
                </span>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[350px] transition-all duration-300 ease-in-out"
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
                    {user ? (
                      <div className="space-y-3">
                        <div className="px-3 py-2 rounded-lg bg-muted/50">
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
                          className="w-full transition-all duration-200 hover:scale-[0.98]"
                          onClick={closeMobileMenu}
                        >
                          <Link href="/login">Login</Link>
                        </Button>
                        <Button
                          asChild
                          className="w-full transition-all duration-200 hover:scale-[0.98]"
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
