import { Suspense } from "react";
import AppKeyDetailsPage from "./details";
import { Loader2 } from "lucide-react";

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const key = (await params).key;
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-col">
        <main className="flex-1 px-4 sm:px-6 lg:px-8">
          <AppKeyDetailsPage appKey={key} />
        </main>
      </div>
    </div>
  );
}
