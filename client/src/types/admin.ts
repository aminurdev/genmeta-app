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

export interface AppUsers {
  _id: string;
  userId: string;
  username: string;
  email?: string;
  name?: string;
  key: string;
  credit: number | null;
  isActive: boolean;
  status: "active" | "suspended";
  suspendedAt: string | null;
  totalProcess: number;
  monthlyProcess: Record<string, number>;
  dailyProcess: Record<string, number>;
  lastCreditRefresh: string;
  createdAt: string;
  allowedDevices?: string[];
  expiresAt?: string;
  lastPlanChange: string;
  plan: {
    type: "free" | "credit" | "subscription";
    id: string;
    name: string;
  } | null;
  planHistory: {
    planType: string;
    changedAt: string;
    reason: string;
  }[];
}

export interface AllUsersResponse {
  users: AppUsers[];
  total: number;
  currentPage: number;
  totalPages: number;
}

// Daily User Registration
export interface DailyNewUser {
  date: string; // Format: "YYYY-MM-DD"
  count: number;
}

// User Plan Distribution
export interface UsersByPlan {
  subscription: number;
  free: number;
}

// Statistics Data
export interface UsersStatisticsData {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  usersByPlan: UsersByPlan;
  totalProcesses: number;
  avgProcessesPerUser: number;
  dailyNewUsers: DailyNewUser[] | [];
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

export interface ReferralRes {
  referrer: {
    _id: string;
    name: string;
    email: string;
  };
  referralCode: string;
  referredCount: number;
  totalEarned: number;
  availableBalance: number;
  withdrawAccount: string | null;
  pendingWithdrawals: number;
}

export interface AllReferralsResponse {
  referrals: ReferralRes[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Referrer {
  _id: string;
  name: string;
  email: string;
}

export interface ReferredUser {
  _id: string;
  name: string;
  email: string;
}

export interface EarnedHistory {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
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
  createdAt: string;
  issuedAt: string | null;
}

export interface ReferralDetails {
  referrer: Referrer;
  referralCode: string;
  availableBalance: number;
  withdrawAccount: string | null;
  referralCount: number;
  totalEarned: number;
  referredUsers: ReferredUser[];
  earnedHistory: EarnedHistory[];
  withdrawHistory: WithdrawHistory[];
}

export interface UpdateWithdrawalRes {
  _id: string;
  amount: number;
  status: "completed" | "rejected";
  withdrawAccount: string;
  trx: string | null;
  createdAt: Date;
  issuedAt: Date;
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
