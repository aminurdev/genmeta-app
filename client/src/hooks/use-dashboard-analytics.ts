import { useEffect, useState } from "react";
import { getBaseApi } from "@/services/image-services";
import { getAccessToken } from "@/services/auth-services";

interface KeyMetrics {
  totalUsers: {
    count: number;
    growth: number | null;
  };
  imagesProcessed: {
    count: number;
    growth: number | null;
  };
  tokensPurchased: {
    count: number;
    growth: number;
  };
  totalRevenue: {
    amount: number;
    growth: number;
  };
}

interface MonthlyData {
  month: string;
  tokensPurchased: number;
  tokensUsed: number;
  revenue: number;
}

interface Transaction {
  _id: string;
  status: string;
  amount: number;
  name: string;
  email: string;
}

interface DashboardAnalytics {
  keyMetrics: KeyMetrics;
  monthlyData: MonthlyData[];
  recentTransactions: Transaction[];
}

export function useDashboardAnalytics() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const baseAPI = await getBaseApi();
        const accessToken = await getAccessToken();

        const response = await fetch(`${baseAPI}/admin/dashboardAnalytics`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch dashboard data");
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An error occurred"));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}
