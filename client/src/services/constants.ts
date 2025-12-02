export const QUERY_KEYS = {
  overview: ["dashboard", "overview"],
  profile: ["dashboard", "profile"],
  referralDetails: ["dashboard", "referralDetails"],

  adminOverview: ["admin", "overview"],
  usersStats: ["users", "stats"],
  allUsers: (queryParams: string) => ["users", "all", queryParams],
  paymentsHistory: (params: GetPaymentsHistoryParams) => [
    "admin",
    "paymentHistory",
    "list",
    params,
  ],
  downloadPayments: (queryParams?: string) => [
    "admin",
    "paymentHistory",
    "download",
    queryParams ?? "",
  ],
  allReferral: ["admin", "referral", "all"],
  referralByUser: (userId: string) => ["admin", "referral", "user", userId],
  pricingPlans: (params?: {
    isActive?: boolean;
    type?: "subscription" | "credit";
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => ["admin", "pricing", "plans", params],
  promoCodes: (params?: {
    active?: boolean;
    appliesTo?: "subscription" | "credit" | "both";
  }) => ["admin", "promo", "codes", params],
  schedulerStatus: ["admin", "scheduler", "status"],
  maintenanceStats: ["admin", "scheduler", "stats"],

  allPricing: ["pricing", "all"],
} as const;

export const MUTATION_KEYS = {
  login: "login",
  logout: "logout",
} as const;
import type { GetPaymentsHistoryParams } from "@/types/admin";
