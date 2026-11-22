import { Suspense } from "react";
import AdminUserReferralDashboard from "./details";
import { ReferralDetailSkeleton } from "../referral-skeleton";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function ReferralUserPage({ params }: PageProps) {
  const { userId } = await params;

  return (
    <Suspense fallback={<ReferralDetailSkeleton />}>
      <AdminUserReferralDashboard userId={decodeURIComponent(userId)} />
    </Suspense>
  );
}
