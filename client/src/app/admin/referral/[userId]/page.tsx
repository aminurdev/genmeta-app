import { getAllReferralByUserId } from "@/services/admin-dashboard/referral";
import { notFound } from "next/navigation";
import AdminUserReferralDashboard from "./details";

interface PageProps {
  params: Promise<{ userId: string }>;
}

const ReferralUserPage = async ({ params }: PageProps) => {
  const userId = (await params).userId;

  try {
    const result = await getAllReferralByUserId(userId);

    if (!result.success || !result.data) {
      notFound();
    }

    return (
      <div className="container mx-auto py-6">
        <AdminUserReferralDashboard data={result.data} userId={userId} />
      </div>
    );
  } catch (error) {
    console.error("[v0] Error fetching user referral data:", error);
    notFound();
  }
};

export default ReferralUserPage;
