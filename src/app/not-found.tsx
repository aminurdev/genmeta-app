import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="space-y-4 mb-8">
        <h1 className="text-9xl font-bold text-violet-500 dark:text-violet-400">
          404
        </h1>
        <div className="h-2 w-20 bg-gradient-to-r from-violet-500 to-indigo-500 mx-auto rounded-full"></div>
      </div>

      <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>

      <p className="text-muted-foreground max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Perhaps you mistyped the URL or the page has been relocated.
      </p>

      <div className="space-y-4">
        <p className="text-muted-foreground">Return to</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            variant="outline"
            className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
            asChild
          >
            <Link href="/">Home Page</Link>
          </Button>
          <Button
            variant="outline"
            className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
            asChild
          >
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>

      <div className="mt-16 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-lg -z-10 blur-xl opacity-50"></div>
        <div className="p-6 border border-violet-200 dark:border-violet-800 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please{" "}
            <Link
              href="/contact"
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              contact our support team
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
