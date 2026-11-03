import { Suspense } from "react";
import { SchedulerDashboard } from "./scheduler-dashboard";
import { SchedulerSkeleton } from "./scheduler-skeleton";

export default function SchedulerPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-col">
        <main className="flex-1 px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<SchedulerSkeleton />}>
            <SchedulerDashboard />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
