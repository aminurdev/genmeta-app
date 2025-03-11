import Link from "next/link";
import {
  HomeIcon,
  PhotoIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { getCurrentUser } from "@/services/auth-services";
import { UserMenu } from "./user-menu";
import { ModeToggle } from "./main/mode-toggle";
import Image from "next/image";
import { ListIcon } from "lucide-react";

export async function Navigation() {
  const user = await getCurrentUser();
  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="h-16 max-w-screen-xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-muted-foreground"
        >
          <span>
            <Image
              src={"/logo/GenMeta-Logo.png"}
              className=" h-16 w-auto"
              alt="logo"
              width={128}
              height={128}
            />
          </span>
          <Typography variant="h4" as="span">
            GenMeta
          </Typography>
        </Link>
        {/* Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground"
          >
            <HomeIcon className="h-5 w-5 inline-block mr-1" /> Home
          </Link>
          <Link
            href="/generate"
            className="text-muted-foreground hover:text-foreground"
          >
            <PhotoIcon className="h-5 w-5 inline-block mr-1" /> Generate
          </Link>
          <Link
            href="/results"
            className="text-muted-foreground hover:text-foreground"
          >
            <ListIcon className="h-5 w-5 inline-block mr-1" /> Results
          </Link>
          <Link
            href="/help"
            className="text-muted-foreground hover:text-foreground"
          >
            <QuestionMarkCircleIcon className="h-5 w-5 inline-block mr-1" />{" "}
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
