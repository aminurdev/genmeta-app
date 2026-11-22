import { Suspense } from "react";
import AppUserDetailsPage from "./details";
import { UserProfileSkeleton } from "@/components/admin/users/users-skeleton";

interface PageProps {
  params: Promise<{ key: string }>;
}

export default async function UserDetailsPage({ params }: PageProps) {
  const { key } = await params;

  return (
    <Suspense fallback={<UserProfileSkeleton />}>
      <AppUserDetailsPage userKey={decodeURIComponent(key)} />
    </Suspense>
  );
}
