import { Suspense } from "react";
import ApiKeyDetailsPage from "./details";

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
          <Suspense fallback={<div>Loading ...</div>}>
            <ApiKeyDetailsPage apiKey={key} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
