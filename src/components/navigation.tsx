import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/services/auth-services";
import { UserMenu } from "./user-menu";
import { ModeToggle } from "./main/mode-toggle";
import Image from "next/image";
import {
  DollarSign,
  Home,
  ImageIcon,
  OctagonAlert,
  Sparkles,
} from "lucide-react";

export async function Navigation() {
  const user = await getCurrentUser();
  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="h-20 max-w-screen-xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="w-52">
          <Link href="/">
            <Image
              src={"/Assets/SVG/Asset 5.svg"}
              className=" h-16 py-2 w-auto"
              alt="logo"
              width={128}
              height={128}
            />
          </Link>
        </div>
        {/* Navigation */}
        <div className="hidden md:flex items-center gap-12">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center"
          >
            <Home className="h-5 w-5 inline-block mr-2" /> Home
          </Link>
          <Link
            href="/generate"
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
            href="/help"
            className="text-muted-foreground hover:text-foreground flex items-center"
          >
            <DollarSign className="h-5 w-5 inline-block mr-1" />
            Pricing
          </Link>
          <Link
            href="/help"
            className="text-muted-foreground hover:text-foreground flex items-center"
          >
            <OctagonAlert className="h-5 w-5 inline-block mr-2" />
            Help
          </Link>
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
          )}{" "}
          <ModeToggle />{" "}
        </div>
      </div>
    </nav>
  );
}
