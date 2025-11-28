export interface Overview {
  user: {
    name: string;
    email: string;
    isVerified: boolean;
    loginProvider: ("google" | "email")[];
  };
  appKey: {
    exists: boolean;
    totalProcess: number;
    todayUsage: number;
    thisMonthUsage: number;
    last6MonthProcess: {
      month: string; // e.g., "2025-07"
      count: number;
    }[];
    last7DaysProcess: {
      day: string; // e.g., "2025-07-06"
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
  payments: {
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
  name: string;
  email: string;
  avatar: string;
  loginProvider: ("google" | "email")[];
  isVerified: boolean;
  isDisabled: boolean;
  createdAt: string; // ISO date string
  role: string;
  appKey?: {
    plan: {
      type: "subscription" | "credit" | "free";
      id?: string;
      name?: string;
    };
    totalProcess: number;
    credit: number | null; // null when subscription
    isActive: boolean;
    status: "active" | "suspended";
    expiresAt: string | null;
  } | null;
}
