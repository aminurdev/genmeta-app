import type {
  GetAdminPaymentTransactionsParams,
  GetAllReferralsParams,
  GetPaymentsHistoryParams,
  GetPricingPlansParams,
  GetPromoCodesParams,
} from "@/types/admin";

export const QUERY_KEYS = {
  overview: ["dashboard", "overview"],
  profile: ["dashboard", "profile"],
  activeSessions: ["dashboard", "activeSessions"],
  referralDetails: ["dashboard", "referralDetails"],

  adminOverview: ["admin", "overview"],
  usersStats: ["users", "stats"],
  allUsers: (queryParams: string) => ["users", "all", queryParams],
  appUserDetails: (key: string) => ["admin", "users", "details", key],
  paymentsHistory: (params: GetPaymentsHistoryParams) => [
    "admin",
    "paymentHistory",
    "list",
    params,
  ],
  adminPaymentTransactions: (params?: GetAdminPaymentTransactionsParams) => [
    "admin",
    "payments",
    "transactions",
    params,
  ],
  downloadPayments: (queryParams?: string) => [
    "admin",
    "paymentHistory",
    "download",
    queryParams ?? "",
  ],
  allReferral: (params?: GetAllReferralsParams) => [
    "admin",
    "referral",
    "all",
    params,
  ],
  referralByUser: (userId: string) => ["admin", "referral", "user", userId],
  pricingPlans: (params?: GetPricingPlansParams) => [
    "admin",
    "pricing",
    "plans",
    params,
  ],
  promoCodes: (params?: GetPromoCodesParams) => [
    "admin",
    "promo",
    "codes",
    params,
  ],
  schedulerStatus: ["admin", "scheduler", "status"],
  maintenanceStats: ["admin", "scheduler", "stats"],

  allPricing: ["pricing", "all"],
  superAdminOverview: ["admin", "superAdmin", "overview"],
  superAdminStaff: ["admin", "superAdmin", "staff"],
  adminWithdrawalNotifications: ["admin", "notifications", "withdrawals"],
} as const;

export const MUTATION_KEYS = {
  login: "login",
  logout: "logout",
} as const;
