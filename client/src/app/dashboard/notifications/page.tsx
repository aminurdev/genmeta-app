import { Suspense } from "react";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/services/auth-services";

function NotificationPageFallback() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-44 w-full" />
    </div>
  );
}

export default async function DashboardNotificationsPage() {
  const user = await getCurrentUser();
  return (
    <Suspense fallback={<NotificationPageFallback />}>
      <NotificationCenter
        scope="user"
        userRole={user?.role ?? "user"}
      />
    </Suspense>
  );
}
