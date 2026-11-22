export interface AdminDashboardUserSummary {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface AdminDashboardMonthlyRevenuePoint {
  month: string;
  amount: number;
  count: number;
}

export interface AdminDashboardDailyRevenuePoint {
  date: string;
  amount: number;
  count: number;
}

export interface AdminDashboardMonthlyProcessPoint {
  month: string;
  count: number;
  failed: number;
}

export interface AdminDashboardDailyProcessPoint {
  date: string;
  count: number;
  failed: number;
}

export interface AdminDashboardRecentPayment {
  _id: string;
  trxID: string;
  paymentID: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  plan: {
    id?: string;
    name: string;
    type: string;
  };
  createdAt: string;
  userId: AdminDashboardUserSummary;
}

export interface AdminDashboardTopUsageItem {
  _id: string;
  key: string | null;
  planType: string;
  count: number;
  failedCount: number;
  user: AdminDashboardUserSummary;
}

export interface AdminDashboardTopSpenderItem {
  _id: string;
  totalSpent: number;
  paymentCount: number;
  lastPaymentAt?: string | null;
  user: AdminDashboardUserSummary;
}

export interface AdminDashboardTopReferrerItem {
  _id: string;
  userId: string;
  referralCode: string;
  referredCount: number;
  totalEarned: number;
  availableBalance: number;
  user: AdminDashboardUserSummary;
}

export type AdminDashboardStats = {
  revenue: {
    total: number;
    today: number;
    currentMonth: number;
    lastMonth: number;
    avgOrderValue: number;
    growthPercentage: number;
    monthlyBreakdown: Record<string, number>;
    monthlyRevenueList: Record<string, number>;
    last6MonthRevenue: AdminDashboardMonthlyRevenuePoint[];
    last7DaysRevenue: AdminDashboardDailyRevenuePoint[];
    byPlanType: {
      subscription: { amount: number; count: number };
      credit: { amount: number; count: number };
      other: { amount: number; count: number };
    };
  };
  users: {
    total: number;
    verified: number;
    unverified: number;
    disabled: number;
    newToday: number;
    newThisMonth: number;
    newLastMonth: number;
    growthPercentage: number;
    verificationRate: number;
  };
  appUsers: {
    total: number;
    newThisMonth: number;
    active: number;
    suspended: number;
    activePremium: number;
    subscriptionPlanCount: number;
    creditPlanCount: number;
    freePlanCount: number;
    expiredPendingDowngrade: number;
    totalDevices: number;
    conversionRate: number;
    monthlyProcessList: Record<string, number>;
    last6MonthProcess: AdminDashboardMonthlyProcessPoint[];
    last7DaysProcess: AdminDashboardDailyProcessPoint[];
    topUsage: AdminDashboardTopUsageItem[];
  };
  processes: {
    total: number;
    totalFailed: number;
    today: number;
    currentMonth: number;
    lastMonth: number;
    growthPercentage: number;
    successRate: number;
  };
  payments: {
    total: number;
    today: number;
    newThisMonth: number;
    lastMonth: number;
    recent: AdminDashboardRecentPayment[];
    topSpenders: AdminDashboardTopSpenderItem[];
  };
  recentPayments: AdminDashboardRecentPayment[];
  topReferrers: AdminDashboardTopReferrerItem[];
  referrals: {
    totalReferrers: number;
    totalReferredUsers: number;
    totalAvailable: number;
    totalEarned: number;
    pendingWithdrawalsCount: number;
    pendingWithdrawalsAmount: number;
    completedWithdrawalsAmount: number;
  };
  meta: {
    generatedAt: string;
    refreshed: boolean;
    syncedExpiredPlans: number;
  };
};

export interface AdminDesktopDevice {
  deviceId: string;
  fingerprint: string | null;
  deviceName: string;
  platform: string;
  osVersion: string;
  arch: string;
  cpuModel: string;
  appVersion: string;
  ipAddress: string;
  firstLoginAt: string | null;
  lastActiveAt: string | null;
  isCurrent?: boolean;
}

export interface AdminDeviceRemovalStatus {
  canRemoveDevice: boolean;
  lastDeviceRemovalAt: string | null;
  nextDeviceRemovalAt: string | null;
  remainingMs: number;
}

export interface AppUsers {
  _id: string;
  userId: string;
  appUserId?: string | null;
  hasAppUser?: boolean;
  username: string;
  email?: string;
  name?: string;
  avatar?: string | null;
  role?: "user" | "admin" | "superAdmin" | string;
  isVerified?: boolean;
  isDisabled?: boolean;
  loginProvider?: string[];
  lastLoginAt?: string | null;
  key: string | null;
  credit: number | null;
  isActive: boolean;
  status: "active" | "suspended";
  suspendedAt?: string | null;
  totalProcess: number;
  totalFailedProcess?: number;
  monthlyProcess?: Record<string, number>;
  dailyProcess?: Record<string, number>;
  lastCreditRefresh?: string;
  createdAt: string;
  appCreatedAt?: string | null;
  allowedDevices?: string[];
  devices?: AdminDesktopDevice[];
  devicesCount?: number;
  maxDevices?: number;
  expiresAt?: string | null;
  isExpired?: boolean;
  lastPlanChange?: string;
  plan: {
    type: "free" | "credit" | "subscription";
    id: string | null;
    name: string;
  } | null;
  planHistory?: {
    planType: string;
    changedAt: string;
    reason: string;
  }[];
}

export interface AllUsersResponse {
  users: AppUsers[];
  total: number;
  currentPage: number;
  page?: number;
  limit?: number;
  totalPages: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta?: {
    generatedAt: string;
    refreshed: boolean;
    syncedExpiredPlans: number;
  };
}

// Daily User Registration
export interface DailyNewUser {
  date: string; // Format: "YYYY-MM-DD"
  count: number;
}

// User Plan Distribution
export interface UsersByPlan {
  subscription: number;
  credit: number;
  free: number;
  uninitialized?: number;
}

// Statistics Data
export interface UsersStatisticsData {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  newUsers24h: number;
  newUsers7d: number;
  newUsersThisMonth: number;
  totalAppUsers: number;
  activeAppUsers: number;
  suspendedAppUsers: number;
  activePremiumUsers: number;
  expiredPendingDowngrade: number;
  totalDevices: number;
  uninitializedUsers: number;
  dailyNewUsers: DailyNewUser[];
  totalProcesses: number;
  totalFailedProcesses: number;
  avgProcessesPerUser: number;
  processSuccessRate: number;
  usersByPlan: UsersByPlan;
  roleDistribution: Array<{ _id: string; count: number }>;
  meta?: {
    generatedAt: string;
    refreshed: boolean;
    syncedExpiredPlans: number;
  };
}

export interface AdminUserProfileUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "user" | "admin" | "superAdmin" | string;
  isVerified: boolean;
  isDisabled: boolean;
  loginProvider: string[];
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  ipAddress: string | null;
  failedLoginAttempts: number;
  isLocked: boolean;
  referredBy: {
    referralCode: string | null;
    referrerName: string | null;
    referrerEmail: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserProfileFailure {
  date: string;
  count: number;
  errorMessages: string[];
}

export interface AdminUserProfileAppUser {
  id: string;
  _id: string;
  userId: string;
  username: string;
  key: string;
  expiresAt: string | null;
  remainingDays: number | null;
  isExpired: boolean;
  isActive: boolean;
  status: "active" | "suspended";
  suspendedAt: string | null;
  plan: {
    type: "free" | "credit" | "subscription";
    id: string | null;
    name: string;
  };
  credit: number | null;
  remainingCredit: number | null;
  lastCreditRefresh: string | null;
  lastPlanChange: string | null;
  planHistory: Array<{
    _id?: string;
    planType: string;
    changedAt: string;
    reason: string;
  }>;
  totalProcess: number;
  totalFailedProcess: number;
  todayProcess: number;
  currentMonthProcess: number;
  successRate: number;
  last7DaysProcess: Array<{ date: string; count: number; failed: number }>;
  last6MonthProcess: Array<{ month: string; count: number; failed: number }>;
  monthlyUsage: Record<string, number>;
  recentFailures: AdminUserProfileFailure[];
  allowedDevices: string[];
  devices: AdminDesktopDevice[];
  maxDevices: number;
  deviceRemoval: AdminDeviceRemovalStatus;
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserProfilePayment {
  id: string;
  _id: string;
  paymentID: string;
  trxID: string;
  gateway: string;
  plan: {
    id?: string;
    type: string;
    name: string;
  };
  amount: number;
  currency: string;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface AdminUserProfileReferral {
  exists: boolean;
  referralCode: string | null;
  withdrawAccount: string | null;
  referredCount: number;
  availableBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
}

export interface AdminUserProfileSession {
  id: string;
  deviceName: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface AdminUserDetailsResponse {
  user: AdminUserProfileUser;
  appUser: AdminUserProfileAppUser;
  payments: AdminUserProfilePayment[];
  paymentSummary: {
    totalSpent: number;
    totalCount: number;
    lastPaymentAt: string | null;
  };
  referral: AdminUserProfileReferral;
  security: {
    activeSessionsCount: number;
    sessions: AdminUserProfileSession[];
  };
  meta: {
    generatedAt: string;
    refreshed: boolean;
  };
}

export interface CreateAppUserPayload {
  username: string;
  name?: string;
  password?: string;
  createAccountIfMissing?: boolean;
  isVerified?: boolean;
  planId?: string | null;
  plan?: "free" | "credit" | "subscription" | { type: string; id?: string | null; name?: string | null };
  expiryDays?: number;
  initialCredit?: number;
  credit?: number;
  maxDevices?: number;
  recordPayment?: boolean;
  paymentAmount?: number;
  paymentNote?: string;
  reason?: string;
}

export interface CreateAppUserResponse {
  key: string;
  username: string;
  userId: string;
  plan: { type: string; id: string | null; name: string };
  expiresAt: string | null;
  isActive: boolean;
  maxDevices: number;
  credit: number | null;
  userCreated: boolean;
  paymentRecorded: { id: string; trxID: string; amount: number } | null;
}

export interface UpdateAppUserPayload {
  username?: string;
  key?: string;
  userId?: string;
  planId?: string | null;
  plan?: "free" | "credit" | "subscription" | { type: string; id?: string | null; name?: string | null };
  upgradeMode?: "replace" | "extend";
  expiryDays?: number;
  credit?: number;
  maxDevices?: number;
  reactivate?: boolean;
  recordPayment?: boolean;
  paymentAmount?: number;
  paymentNote?: string;
  triggerReferralReward?: boolean;
  reason?: string;
}

export interface UpdateAppUserResponse {
  key: string;
  appUser: Partial<AppUsers>;
  paymentRecorded: { id: string; trxID: string; amount: number } | null;
}

export interface PaymentResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  payments: {
    _id: string;
    user?: {
      _id: string;
      name: string;
      email: string;
    };
    userId?: {
      _id: string;
      name: string;
      email: string;
    } | string;
    paymentID: string;
    trxID: string;
    plan?: {
      id?: string;
      name?: string;
      type?: string;
    };
    amount: number;
    currency?: string;
    gateway?: string;
    createdAt: string;
    status?: string;
    transactionStatus?: string;
  }[];
}

export interface DownloadPaymentHistory {
  success: boolean;
  message: string;
  data: {
    name: string;
    email: string;
    paymentNumber: string;
    paymentCreatedAt: string;
    paymentExecuteTime: string;
    amount: string;
    trxID: string;
    paymentID: string;
  }[];
}

export interface ReferralSummary {
  totalReferrers: number;
  totalReferredUsers: number;
  totalEarned: number;
  totalAvailable: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  completedWithdrawalsCount: number;
  completedWithdrawalsAmount: number;
  referrersWithPending: number;
}

export interface ReferralRes {
  _id: string;
  referrer: {
    _id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  referralCode: string;
  referredCount: number;
  convertedCount: number;
  totalEarned: number;
  totalWithdrawn: number;
  availableBalance: number;
  withdrawAccount: string | null;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
  latestPendingAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AllReferralsResponse {
  referrals: ReferralRes[];
  summary: ReferralSummary;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta: {
    generatedAt: string;
    refreshed: boolean;
  };
}

export interface GetAllReferralsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "pending" | "has_balance" | "has_referrals";
  sortBy?: "pending" | "balance" | "earned" | "referred" | "recent";
  sortOrder?: "asc" | "desc";
}

export interface Referrer {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  isVerified?: boolean;
  isDisabled?: boolean;
  createdAt?: string | null;
}

export interface ReferredUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  createdAt?: string | null;
  hasConverted?: boolean;
  earnedAmount?: number;
}

export interface EarnedHistory {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  amount: number;
  createdAt: string;
}

export interface WithdrawHistory {
  _id: string;
  amount: number;
  status: "pending" | "completed" | "rejected";
  withdrawAccount: string;
  trx: string | null;
  notes?: string | null;
  createdAt: string;
  requestedAt?: string;
  issuedAt: string | null;
}

export interface ReferralDetails {
  _id: string;
  referrer: Referrer;
  referralCode: string;
  availableBalance: number;
  withdrawAccount: string | null;
  referralCount: number;
  convertedCount: number;
  conversionRate: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  completedWithdrawalsCount: number;
  rejectedWithdrawalsCount: number;
  referredUsers: ReferredUser[];
  earnedHistory: EarnedHistory[];
  withdrawHistory: WithdrawHistory[];
  createdAt?: string;
  updatedAt?: string;
  meta?: {
    generatedAt: string;
    refreshed: boolean;
  };
}

export interface UpdateWithdrawalPayload {
  userId: string;
  withdrawalId: string;
  status: "completed" | "rejected";
  trx?: string;
  notes?: string;
}

export interface UpdateWithdrawalRes {
  withdrawal: WithdrawHistory;
  availableBalance: number;
}

export interface PricingPlan {
  _id: string;
  name: string;
  type: "subscription" | "credit";
  basePrice: number;
  discountPrice?: number;
  discountPercent: number;
  isActive: boolean;
  planDuration: number;
  credit?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PricingSummary {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  subscriptionPlans: number;
  activeSubscriptionPlans: number;
  creditPlans: number;
  activeCreditPlans: number;
  avgDiscountPercent: number;
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pages?: number;
}

export interface PricingPlansResponse {
  plans: PricingPlan[];
  summary?: PricingSummary;
  pagination: PaginationData;
  meta?: {
    generatedAt: string;
    refreshed: boolean;
  };
}

export interface GetPricingPlansParams {
  search?: string;
  isActive?: boolean;
  type?: "subscription" | "credit";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type PromoCodeLifecycleStatus =
  | "live"
  | "scheduled"
  | "expired"
  | "exhausted"
  | "inactive";

export interface PromoCode {
  _id: string;
  code: string;
  description?: string;
  discountPercent: number;
  isActive: boolean;
  appliesTo: "subscription" | "credit" | "both";
  usageLimit: number | null;
  usedCount: number;
  usedBy?: string[];
  lifecycleStatus?: PromoCodeLifecycleStatus;
  remainingUses?: number | null;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCodeSummary {
  totalPromoCodes: number;
  livePromoCodes: number;
  scheduledPromoCodes: number;
  expiredPromoCodes: number;
  exhaustedPromoCodes: number;
  inactivePromoCodes: number;
  totalRedemptions: number;
}

export interface PromoCodesResponse {
  promoCodes: PromoCode[];
  summary?: PromoCodeSummary;
  pagination?: PaginationData;
  meta?: {
    generatedAt: string;
    refreshed: boolean;
  };
}

export interface GetPromoCodesParams {
  search?: string;
  status?: "all" | PromoCodeLifecycleStatus;
  active?: boolean;
  appliesTo?: "subscription" | "credit" | "both";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface GetPaymentsHistoryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface SuperAdminOverview {
  environment: string;
  nodeVersion: string;
  platform: string;
  uptimeSeconds: number;
  uptimeHuman: string;
  memory: {
    rssMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
  };
  database: {
    status: "healthy" | "disconnected";
    name: string;
  };
  counts: {
    totalUsers: number;
    users: number;
    admins: number;
    superAdmins: number;
    disabledUsers: number;
    totalAppUsers: number;
    totalProcesses: number;
  };
}

export interface StaffAccount {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "superAdmin";
  avatar?: string | null;
  isVerified: boolean;
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffListResponse {
  staff: StaffAccount[];
  total: number;
}

export interface WithdrawalNotification {
  id: string;
  withdrawalId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  amount: number;
  withdrawAccount: string;
  requestedAt: string;
  status: "pending" | "completed" | "rejected";
  pendingCount?: number;
  href: string;
}

export interface WithdrawalNotificationsResponse {
  count: number;
  notifications: WithdrawalNotification[];
}
