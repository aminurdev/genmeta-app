export interface User {
  _id: string;
  name: string;
  email: string;
}

// Payment Types
export interface Payment {
  _id: string;
  amount: number;
  createdAt: string;
  userId: User;
}

export interface PaymentsData {
  total: number;
  newThisMonth: number;
  recent: Payment[];
}

// Revenue Types
export interface MonthlyRevenueList {
  [key: string]: number; // Format: "YYYY-MM": amount
}

export interface RevenueData {
  total: number;
  currentMonth: number;
  lastMonth: number;
  growthPercentage: number;
  monthlyRevenueList: MonthlyRevenueList;
}

// App Keys Types
export interface MonthlyProcessList {
  [key: string]: number; // Format: "YYYY-MM": count
}

export interface AppKeysData {
  total: number;
  newThisMonth: number;
  active: number;
  activePremium: number;
  subscriptionPlanCount: number;
  creditPlanCount: number;
  monthlyProcessList: MonthlyProcessList;
}

// Users Types
export interface UsersData {
  total: number;
  newThisMonth: number;
}

// Dashboard Data
export interface DashboardData {
  revenue: RevenueData;
  appKeys: AppKeysData;
  users: UsersData;
  payments: PaymentsData;
}

export interface AppUsers {
  _id: string;
  userId: string;
  username: string;
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
