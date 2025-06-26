import { PricingDashboard } from "@/components/admin/app/pricing-dashboard";

export default function Home() {
  return (
    <div className="container mx-auto py-6 space-y-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-8">Pricing Management</h1>
      <PricingDashboard />
    </div>
  );
}
