import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { getCurrentUser } from "@/services/auth-services";
import { UserMenu } from "./user-menu";
import Image from "next/image";
import { Menu } from "lucide-react";
import { NavLinks } from "./navLinks";

export async function Navigation() {
  const user = await getCurrentUser();

  return (
    <nav className="md:sticky top-0 z-50 bg-background border-b border-border">
      <div className="h-20 md:h-28 max-w-screen-xl mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-4 w-52">
          <Link href="/">
            <Image
              src="/Assets/SVG/logo.svg"
              className="h-16 py-2 w-auto"
              alt="logo"
              width={128}
              height={128}
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
              <Button variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
            </span>
          )}{" "}
          <Button asChild>
            <Link className="flex items-center gap-2" href="/download">
              <Image
                src="/Assets/SVG/win.svg"
                alt="Download"
                width={16}
                height={16}
              />
              Download
            </Link>
          </Button>
          {/* <ModeToggle /> */}
          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger className="md:hidden" aria-label="Toggle menu">
              <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
                <Menu className="h-6 w-6" />
              </span>
            </SheetTrigger>
            <SheetContent side="right">
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
      </div>
    </nav>
  );
}
