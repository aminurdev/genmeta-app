import { Suspense } from "react";
import AppUserDetailsPage from "./details";
import { UserProfileSkeleton } from "@/components/admin/users/users-skeleton";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserDetailsPage({ params }: PageProps) {
  const { userId } = await params;

  return (
    <Suspense fallback={<UserProfileSkeleton />}>
      <AppUserDetailsPage userId={decodeURIComponent(userId)} />
    </Suspense>
  );
}
