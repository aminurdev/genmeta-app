"use client"; // Ensure this is a client component if using Next.js 15

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { DecodedToken, getCurrentUser } from "@/services/auth-services";
import { UserMenu } from "./user-menu";
import { ModeToggle } from "./main/mode-toggle";
import Image from "next/image";
import {
  DollarSign,
  Home,
  ImageIcon,
  OctagonAlert,
  Sparkles,
  Menu,
} from "lucide-react";

export function Navigation() {
  const [user, setUser] = useState<DecodedToken | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }
    fetchUser();
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="h-20 max-w-screen-xl mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-4 w-52">
          <Link href="/">
            <Image
              src="/Assets/SVG/Asset 5.svg"
              className="h-16 py-2 w-auto"
              alt="logo"
              width={128}
              height={128}
            />
          </Link>

          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger className="md:hidden" aria-label="Toggle menu">
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col items-start gap-6 py-4">
                <NavLinks />
                <div className="w-full border-t border-border my-4"></div>
                {user ? (
                  <UserMenu user={user} />
                ) : (
                  <div className="flex flex-col w-full gap-2">
                    <Button variant="outline" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-12">
          <NavLinks />
        </div>

        {/* User Authentication */}
        <div className="flex items-center gap-4">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}

function NavLinks() {
  return (
    <>
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground flex items-center"
      >
        <Home className="h-5 w-5 inline-block mr-2" /> Home
      </Link>
      <Link
        href="/generate/v2"
        className="text-muted-foreground hover:text-foreground flex items-center"
      >
        <Sparkles className="h-5 w-5 inline-block mr-2" /> Generate
      </Link>
      <Link
        href="/results"
        className="text-muted-foreground hover:text-foreground flex items-center"
      >
        <ImageIcon className="h-5 w-5 inline-block mr-2" /> Results
      </Link>
      <Link
        href="/pricing"
        className="text-muted-foreground hover:text-foreground flex items-center"
      >
        <DollarSign className="h-5 w-5 inline-block mr-1" /> Pricing
      </Link>
      <Link
        href="/help"
        className="text-muted-foreground hover:text-foreground flex items-center"
      >
        <OctagonAlert className="h-5 w-5 inline-block mr-2" /> Help
      </Link>
    </>
  );
}
