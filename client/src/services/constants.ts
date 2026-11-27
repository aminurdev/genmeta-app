import type {
  GetAdminPaymentTransactionsParams,
  GetAdminProcessErrorsParams,
  GetAllReferralsParams,
  GetPaymentsHistoryParams,
  GetPricingPlansParams,
  GetPromoCodesParams,
} from "@/types/admin";

export const QUERY_KEYS = {
  currentUser: ["auth", "currentUser"],
  visitorCountry: ["visitor", "country"],
  paymentStatus: (invoiceNumber: string) => ["payment", "status", invoiceNumber],

  overview: ["dashboard", "overview"],
  profile: ["dashboard", "profile"],
  activeSessions: ["dashboard", "activeSessions"],
  referralDetails: ["dashboard", "referralDetails"],

  adminOverview: ["admin", "overview"],
  usersStats: ["users", "stats"],
  allUsers: (queryParams: string) => ["users", "all", queryParams],
  appUserDetails: (userId: string) => ["admin", "users", "details", userId],
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
  superAdminAiKeys: ["admin", "superAdmin", "aiKeys"],
  adminWithdrawalNotifications: ["admin", "notifications", "withdrawals"],
  adminProcessErrors: (params?: GetAdminProcessErrorsParams) => [
    "admin",
    "errors",
    "list",
    params ?? {},
  ],

  notificationsAll: ["notifications"],
  notifications: (params?: Record<string, unknown>) => [
    "notifications",
    "list",
    params ?? {},
  ],
  notificationsUnreadCount: (scope: string) => [
    "notifications",
    "unread-count",
    scope,
  ],
  notificationPreferences: (scope: string = "user") => [
    "notifications",
    "preferences",
    scope,
  ],
  adminBroadcasts: (page?: number) => [
    "notifications",
    "admin",
    "broadcasts",
    page ?? 1,
  ],
} as const;

export const MUTATION_KEYS = {
  login: "login",
  logout: "logout",
} as const;
