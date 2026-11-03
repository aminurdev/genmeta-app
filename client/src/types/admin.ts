export type AdminDashboardStats = {
  revenue: {
    total: number;
    currentMonth: number;
    lastMonth: number;
    growthPercentage: number;
    monthlyRevenueList: Record<string, number>;
    monthlyBreakdown?: Record<string, number> | Array<Record<string, unknown>>;
  };
  appIds?: {
    total: number;
    newThisMonth: number;
    active: number;
    activePremium: number;
    subscriptionPlanCount: number;
    creditPlanCount: number;
    monthlyProcessList: Record<string, number>;
    topUsage: Array<{
      _id: string;
      count: number;
      user: {
        _id: string;
        name: string;
        email: string;
      };
    }>;
  };
  appKeys: {
    total: number;
    newThisMonth: number;
    active: number;
    activePremium: number;
    subscriptionPlanCount: number;
    creditPlanCount: number;
    monthlyProcessList: Record<string, number>;
    topUsage: Array<{
      _id: string;
      count: number;
      user: {
        _id: string;
        name: string;
        email: string;
      };
    }>;
  };
  users: {
    total: number;
    newThisMonth: number;
  };
  payments: {
    total: number;
    newThisMonth: number;
    recent: Array<{
      _id: string;
      amount: number;
      createdAt: string;
      plan?: { name?: string; type?: string } | string;
      userId: {
        _id: string;
        name: string;
        email: string;
      };
    }>;
    topSpenders: Array<{
      _id: string;
      totalSpent: number;
      user: {
        _id: string;
        name: string;
        email: string;
      };
    }>;
  };
  topReferrers: Array<{
    _id: string;
    referredCount: number;
    user: {
      _id: string;
      name: string;
      email: string;
    };
  }>;
  orders: {
    total: number;
    totalAmount: number;
    currentMonthCount: number;
    currentMonthAmount: number;
    lastMonthCount: number;
    lastMonthAmount: number;
    amountGrowthPercentage: number | null;
    monthlyOrderAmountList: Record<string, number>;
    recent: Array<{
      _id: string;
      amount: number;
      status: "pending" | "completed" | "cancelled";
      createdAt: string;
      planSnapshot: {
        name: string;
        type: "subscription" | "credit";
      };
      promoCodeUsed?: string;
      referralCode?: string;
      user: {
        _id: string;
        name: string;
        email: string;
      };
    }>;
  };
  recentPayments?: Record<string, unknown>[];
  monthlyBreakdown?: unknown;
  processes?: unknown;
  ordersSummary?: unknown;
};

export interface AppUsers {
  _id: string;
  userId: string;
  username: string;
  email?: string;
  name?: string;
  key: string;
  appId?: string;
  appKey?: string;
  credit: number | null;
  isActive: boolean;
  status: "active" | "suspended";
  suspendedAt: string | null;
  totalProcess: number;
  monthlyProcess: Record<string, number>;
  dailyProcess: Record<string, number>;
  lastCreditRefresh: string;
  createdAt: string;
  allowedDevices?: [string];
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
    totalAppIds?: number;
    totalAppKeys: number;
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
