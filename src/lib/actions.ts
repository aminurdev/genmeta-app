"use server";

import { getAccessToken } from "@/services/auth-services";
import { getBaseApi } from "@/services/image-services";

// Type definitions
export type PricingPlanType = "subscription" | "credit";

export interface PricingPlan {
  _id: string;
  name: string;
  type: PricingPlanType;
  basePrice: number;
  discountPercent: number;
  isActive: boolean;
  planDuration?: number | null;
  credit?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PricingPlansResponse {
  plans: PricingPlan[];
  pagination: PaginationData;
}

export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage =
      errorData?.message || response.statusText || "API request failed";
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetches pricing plans with optional filtering and pagination
 */
export async function fetchPricingPlans(params?: {
  isActive?: boolean;
  type?: PricingPlanType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<PricingPlansResponse> {
  try {
    const baseApi = await getBaseApi();

    // Build query string from params
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.isActive !== undefined) {
        queryParams.append("isActive", params.isActive.toString());
      }

      if (params.type) {
        queryParams.append("type", params.type);
      }

      if (params.page) {
        queryParams.append("page", params.page.toString());
      }

      if (params.limit) {
        queryParams.append("limit", params.limit.toString());
      }

      if (params.sortBy) {
        queryParams.append("sortBy", params.sortBy);
      }

      if (params.sortOrder) {
        queryParams.append("sortOrder", params.sortOrder);
      }
    }

    const queryString = queryParams.toString();
    const url = `${baseApi}/pricing${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    return await handleApiResponse<PricingPlansResponse>(response);
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch pricing plans"
    );
  }
}

/**
 * Fetches a single pricing plan by ID
 */
export async function fetchPricingPlanById(id: string): Promise<PricingPlan> {
  try {
    if (!id) {
      throw new Error("Pricing plan ID is required");
    }

    const baseApi = await getBaseApi();

    const response = await fetch(`${baseApi}/pricing/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    return await handleApiResponse<PricingPlan>(response);
  } catch (error) {
    console.error("Error fetching pricing plan:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch pricing plan"
    );
  }
}

/**
 * Creates a new pricing plan
 */
export async function createPricingPlan(data: {
  name: string;
  type: PricingPlanType;
  basePrice: number;
  discountPercent?: number;
  isActive?: boolean;
  planDuration?: number;
  credit?: number;
}): Promise<PricingPlan> {
  try {
    // Validate required fields based on type
    if (!data.name || !data.type || data.basePrice === undefined) {
      throw new Error("Name, type, and basePrice are required");
    }

    if (data.type === "credit" && !data.credit) {
      throw new Error("Credit is required for credit type pricing");
    }

    if (data.type === "subscription" && !data.planDuration) {
      throw new Error(
        "Plan duration is required for subscription type pricing"
      );
    }

    const baseApi = await getBaseApi();
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${baseApi}/pricing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    return await handleApiResponse<PricingPlan>(response);
  } catch (error) {
    console.error("Error creating pricing plan:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create pricing plan"
    );
  }
}

/**
 * Updates an existing pricing plan
 */
export async function updatePricingPlan(
  id: string,
  data: Partial<{
    name: string;
    type: PricingPlanType;
    basePrice: number;
    discountPercent: number;
    isActive: boolean;
    planDuration?: number;
    credit?: number;
  }>
): Promise<PricingPlan> {
  try {
    if (!id) {
      throw new Error("Pricing plan ID is required");
    }

    // Validate type-specific fields if type is being changed
    if (data.type === "credit" && data.credit === undefined) {
      // We should check if we're changing from subscription to credit
      // In a real implementation, we might want to fetch the current plan first
      // But for client-side validation, we'll just warn
      console.warn(
        "When changing to credit type, credit value should be provided"
      );
    }

    if (data.type === "subscription" && data.planDuration === undefined) {
      console.warn(
        "When changing to subscription type, planDuration should be provided"
      );
    }

    const baseApi = await getBaseApi();
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${baseApi}/pricing/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    return await handleApiResponse<PricingPlan>(response);
  } catch (error) {
    console.error("Error updating pricing plan:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update pricing plan"
    );
  }
}

/**
 * Deletes a pricing plan
 */
export async function deletePricingPlan(
  id: string
): Promise<{ success: boolean }> {
  try {
    if (!id) {
      throw new Error("Pricing plan ID is required");
    }

    const baseApi = await getBaseApi();
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${baseApi}/pricing/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    await handleApiResponse<null>(response);
    return { success: true };
  } catch (error) {
    console.error("Error deleting pricing plan:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete pricing plan"
    );
  }
}
