import MaxWidthWrapper from "@/components/MaxWidthWrapper";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20">
      <MaxWidthWrapper className="py-24">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-800 rounded-full animate-spin border-t-violet-600 dark:border-t-violet-400"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-violet-400"></div>
          </div>
          <p className="mt-6 text-lg text-muted-foreground font-medium">
            Loading...
          </p>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
