import { getAllReferralByUserId } from "@/services/admin-dashboard";
import { notFound } from "next/navigation";
import AdminUserReferralDashboard from "./details";

interface PageProps {
  params: Promise<{ userId: string }>;
}

const ReferralUserPage = async ({ params }: PageProps) => {
  const userId = (await params).userId;

  let referralData;
  try {
    const result = await getAllReferralByUserId(userId);

    if (!result.success || !result.data) {
      notFound();
    }

    referralData = result.data;
  } catch (error) {
    console.error("[v0] Error fetching user referral data:", error);
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <AdminUserReferralDashboard data={referralData} userId={userId} />
    </div>
  );
};

export default ReferralUserPage;
