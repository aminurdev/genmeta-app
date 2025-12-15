import { getAllReferral } from "@/services/admin-dashboard";
import { AdminReferralDashboard } from "./admin-referral";

const AdminReferralPage = async () => {
  try {
    const result = await getAllReferral();

    if (!result.success) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">
              Error Loading Data
            </h1>
            <p className="text-muted-foreground">{result.message}</p>
          </div>
        </div>
      );
    }
    return <AdminReferralDashboard referralData={result.data ?? []} />;
  } catch (error) {
    console.error("Failed to load referral data:", error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Connection Error
          </h1>
          <p className="text-muted-foreground">
            Failed to connect to the server
          </p>
        </div>
      </div>
    );
  }
};

export default AdminReferralPage;
