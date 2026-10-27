export interface OverviewRecentItem {
  _id: string;
  trxID: string;
  plan: {
    name?: string;
    type: string;
    id?: string;
  };
  amount: number;
  status: string;
  createdAt: string;
  source?: "payment" | "order";
}

export interface Overview {
  user: {
    id?: string;
    name: string;
    email: string;
    isVerified: boolean;
    avatar?: string | null;
    role?: string;
    loginProvider?: ("google" | "email")[];
    createdAt?: string;
  };
  // Modern direct fields
  plan?: {
    type: "free" | "credit" | "subscription";
    name?: string;
    id?: string;
  };
  credit?: number;
  remainingDays?: number | null;
  totalSpent?: number;
  totalProcess?: number;
  todayProcess?: number;
  currentMonthProcess?: number;
  last6MonthProcess?: {
    month: string;
    count: number;
  }[];
  last7DaysProcess?: {
    date?: string;
    day?: string;
    count: number;
  }[];
  recentHistory?: OverviewRecentItem[];

  // Compatibility nested fields
  appKey?: {
    exists: boolean;
    key?: string | null;
    totalProcess: number;
    todayUsage: number;
    thisMonthUsage: number;
    last6MonthProcess: {
      month: string;
      count: number;
    }[];
    last7DaysProcess: {
      day?: string;
      date?: string;
      count: number;
    }[];
    creditRemaining: number | null;
    planType: "free" | "credit" | "subscription";
    planId: string | null;
    expiresAt: string | null;
    daysLeft: number | null;
    isSuspended: boolean;
    isManuallyDisabled: boolean;
  };
  payments?: {
    totalSpent: number;
    last5Payments: {
      id: string;
      trxID: string;
      plan: {
        id: string;
        type: string;
      };
      amount: number;
      createdAt: string;
    }[];
  };
}

export interface Profile {
  _id?: string;
  name: string;
  email: string;
  avatar?: string | null;
  loginProvider?: ("google" | "email")[];
  isVerified: boolean;
  isDisabled?: boolean;
  createdAt?: string;
  role: string;
  user?: {
    _id?: string;
    name: string;
    email: string;
    avatar?: string | null;
    loginProvider?: ("google" | "email")[];
    isVerified: boolean;
    isDisabled?: boolean;
    role: string;
    createdAt?: string;
  };
  appKey?: {
    key?: string;
    plan: {
      type: "subscription" | "credit" | "free";
      id?: string;
      name?: string;
    };
    totalProcess?: number;
    credit: number | null;
    isActive: boolean;
    status: "active" | "suspended";
    expiresAt: string | null;
  } | null;
}

export interface EarnedHistoryItem {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  createdAt: string;
}

export interface WithdrawHistoryItem {
  _id?: string;
  amount: number;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
  issuedAt: string | null;
  trx: string | null;
  withdrawAccount?: string;
}

export interface ReferralData {
  referralCode: string;
  withdrawAccount: string | null;
  referralCount: number;
  totalEarned: number;
  availableBalance: number;
  totalWithdrawn: number;
  earnedHistory?: EarnedHistoryItem[];
  withdrawHistory?: WithdrawHistoryItem[];
}

export interface RequestWithdrawRes {
  amount: number;
  withdrawAccount?: string;
  status?: string;
  requestedAt?: Date | string;
}
