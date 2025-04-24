import { getAccessToken } from "@/services/auth-services";
import { getBaseApi } from "@/services/image-services";
import { useState, useEffect } from "react";

export interface PricingPlan {
  _id: string;
  title: string;
  tokens: number;
  price: number;
  discount: number;
  popular: boolean;
  discountedPrice: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export function usePricingPlans() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlans = async () => {
    try {
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseApi}/admin/pricingPlans/get`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const result: ApiResponse<PricingPlan[]> = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch plans");
      }

      setPlans(result.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (
    planData: Omit<
      PricingPlan,
      "_id" | "createdAt" | "updatedAt" | "discountedPrice"
    >
  ) => {
    try {
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(`${baseApi}/admin/pricingPlans/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(planData),
      });

      const result: ApiResponse<PricingPlan> = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to create plan");
      }

      await fetchPlans(); // Refresh the plans list
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
      throw err;
    }
  };

  const updatePlan = async (id: string, planData: Partial<PricingPlan>) => {
    try {
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${baseApi}/admin/pricingPlans/update/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(planData),
        }
      );

      const result: ApiResponse<PricingPlan> = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to update plan");
      }

      await fetchPlans(); // Refresh the plans list
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
      throw err;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const baseApi = await getBaseApi();
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${baseApi}/admin/pricingPlans/delete/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result: ApiResponse<null> = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to delete plan");
      }

      await fetchPlans(); // Refresh the plans list
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
      throw err;
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    refreshPlans: fetchPlans,
  };
}
