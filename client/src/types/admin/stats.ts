// User Types
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
