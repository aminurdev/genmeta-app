"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTab from "@/components/dashboard/overview-tab";
import HistoryTab from "@/components/dashboard/history-tab";
import AccountTab from "@/components/dashboard/account-tab";
import { toast } from "sonner";
import { getAccessToken, getBaseApi } from "@/services/image-services";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// Types
type Package = {
  _id: string;
  discount: number;
  title: string;
  tokens: number;
  price: number;
  popular: boolean;
};

type RecentActivity = {
  status: string;
  _id: string;
  batchId: string;
  userId: string;
  createdAt: string;
  tokensUsed: number;
  imagesCount: number;
};

type TokenHistory = {
  tokenDetails: {
    count: number;
    type: string;
  };
  actionType: string;
  description: string;
  _id: string;
  createdAt: string;
};

type UserActivity = {
  plan: {
    planId?: Package;
    status?: string;
    expiresDate?: string;
  };
  _id: string;
  userId: string;
  availableTokens?: number;
  totalImageProcessed?: number;
  tokensUsedThisMonth?: number;
  totalTokensUsed?: number;
  totalTokensPurchased?: number;
  tokenHistory?: TokenHistory[];
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse = {
  success: boolean;
  message: string;
  data: {
    packages: Package[];
    recentActivity: RecentActivity[];
    userActivity: UserActivity;
  };
};

const emptyData = {
  packages: [],
  recentActivity: [],
  userActivity: {} as UserActivity,
  plan: {} as Package,
};

const VALID_TABS = ["overview", "history", "account"];
const DEFAULT_TAB = "overview";

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get active tab from URL search params, defaulting to "overview" if not present or invalid
  const getActiveTabFromParams = () => {
    const tab = searchParams?.get("tab");
    return tab && VALID_TABS.includes(tab) ? tab : DEFAULT_TAB;
  };

  const [activeTab, setActiveTab] = useState<string>(getActiveTabFromParams());
  const [data, setData] = useState<ApiResponse["data"]>(emptyData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      if (!baseApi || !accessToken) {
        throw new Error("Authentication failed. Please log in again.");
      }

      const response = await fetch(`${baseApi}/user-dashboard/data`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to access this data.");
        } else if (response.status === 404) {
          throw new Error("Dashboard data not found.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error(
            `Failed to fetch dashboard data (${response.status})`
          );
        }
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(
          responseData.message || "Failed to fetch dashboard data"
        );
      }

      setData(responseData.data || emptyData);
      setError(null);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const handleOnline = () => {
      if (error) {
        toast.info("Connection restored. Refreshing data...");
        fetchDashboardData();
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [fetchDashboardData, error]);

  // Update URL when tab changes
  useEffect(() => {
    // Sync active tab with URL search params
    const currentTab = getActiveTabFromParams();
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const handlePurchase = async (packageId: string) => {
    if (isPurchasing) return;

    try {
      setIsPurchasing(true);
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      if (!baseApi || !accessToken) {
        throw new Error("Authentication failed. Please log in again.");
      }

      const response = await fetch(`${baseApi}/payment/create-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          packageId,
        }),
      });

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.message || "Failed to initiate payment");
      }

      if (responseData.data?.bkashURL) {
        window.location.href = responseData.data.bkashURL;
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment initiation failed";
      toast.error(errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Handle tab change - update URL search params
  const handleTabChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    router.push(url.pathname + url.search);
    setActiveTab(value);
  };

  // Check for returning from payment
  useEffect(() => {
    // Check URL parameters for payment status
    const paymentStatus = searchParams?.get("payment_status");

    if (paymentStatus === "success") {
      toast.success("Payment successful! Your tokens have been added.");
      fetchDashboardData(); // Refresh data after successful payment

      // Remove payment_status parameter but keep the tab parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("payment_status");
      router.replace(url.pathname + url.search);
    } else if (paymentStatus === "failed") {
      toast.error("Payment failed. Please try again.");

      // Remove payment_status parameter but keep the tab parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("payment_status");
      router.replace(url.pathname + url.search);
    } else if (paymentStatus === "canceled") {
      toast.info("Payment was canceled.");

      // Remove payment_status parameter but keep the tab parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("payment_status");
      router.replace(url.pathname + url.search);
    }
  }, [searchParams, fetchDashboardData, router]);

  // Render loading state ONLY on initial load
  if (isLoading && !data.packages.length && !error) {
    return (
      <div className="max-w-7xl mx-auto bg-background min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  // Render error state but only if we have no data
  if (error && !data.packages.length) {
    return (
      <div className="max-w-7xl mx-auto bg-background p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h2 className="text-lg font-medium text-destructive mb-2">
            Unable to load dashboard
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-background">
      <div className="flex flex-1 flex-col">
        <main className="p-4 md:p-6">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-6"
            defaultValue={activeTab}
          >
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            {isLoading && (
              <div className="h-8 flex items-center justify-end">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Refreshing...</span>
                </div>
              </div>
            )}

            <TabsContent value="overview">
              <OverviewTab
                data={data}
                handlePurchase={handlePurchase}
                isLoading={isPurchasing}
                onRefresh={fetchDashboardData}
                setActiveTab={handleTabChange}
              />
            </TabsContent>

            <TabsContent value="history">
              <HistoryTab />
            </TabsContent>

            <TabsContent value="account">
              <AccountTab
                userActivity={data.userActivity}
                packages={data.packages}
                handlePurchase={handlePurchase}
                isLoading={isLoading}
                isPurchasing={isPurchasing}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

const DashboardWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Dashboard />
  </Suspense>
);

export default DashboardWrapper;
