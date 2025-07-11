import { Suspense } from "react";
import AppKeyDetailsPage from "./details";
import { Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{ key: string }>;
}

export default async function UserDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const key = resolvedParams.key;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-col">
        <main className="flex-1 px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading user details...</span>
                </div>
              </div>
            }
          >
            <AppKeyDetailsPage appKey={key} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
