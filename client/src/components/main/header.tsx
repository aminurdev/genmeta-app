import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { ListIcon } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          Image SEO Generator
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/generate/v2"
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
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
