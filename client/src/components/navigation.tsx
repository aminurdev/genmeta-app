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

export async function Navigation() {
  const user = await getCurrentUser();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-secondary-200">
      <div className="h-16 max-w-screen-xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-secondary-900 hover:text-secondary-700"
        >
          <PhotoIcon className="h-8 w-8 text-primary-600" />
          <Typography variant="h4" as="span">
            Image Processor
          </Typography>
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-secondary-600 hover:text-secondary-900"
          >
            <HomeIcon className="h-5 w-5 inline-block mr-1" /> Home
          </Link>
          <Link
            href="/generate"
            className="text-secondary-600 hover:text-secondary-900"
          >
            <PhotoIcon className="h-5 w-5 inline-block mr-1" /> Generate
          </Link>
          <Link
            href="/help"
            className="text-secondary-600 hover:text-secondary-900"
          >
            <QuestionMarkCircleIcon className="h-5 w-5 inline-block mr-1" />{" "}
            Help
          </Link>
        </div>

        {/* User Authentication */}
        {user ? (
          <div className="flex items-center gap-4">
            <UserMenu user={user} />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
