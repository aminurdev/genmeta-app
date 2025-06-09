import DashboardStats from "@/components/admin/app/stats";
import { Suspense } from "react";

export default async function StatsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-col">
        <main className="flex-1 px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div>Loading ...</div>}>
            <DashboardStats />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
