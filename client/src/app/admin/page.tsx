import { Suspense } from "react";
import DashboardStats from "@/components/admin/app/AdminDashboardStats";
import { AdminDashboardSkeleton } from "@/components/admin/admin-dashboard-skeleton";

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <DashboardStats />
    </Suspense>
  );
}
