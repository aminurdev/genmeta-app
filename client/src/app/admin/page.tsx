import { Suspense } from "react";
import DashboardStats from "@/components/admin/app/AdminDashboardStats";
import { AdminDashboardSkeleton } from "@/components/admin/admin-dashboard-skeleton";

export default async function StatsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex flex-col p-3 sm:p-4 lg:p-6 w-full">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor platform statistics, user activity, and system performance
          </p>
        </div>
        <Suspense fallback={<AdminDashboardSkeleton showHeader={false} />}>
          <DashboardStats />
        </Suspense>
      </div>
    </div>
  );
}
