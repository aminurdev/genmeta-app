export interface DesktopDevice {
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
  isCurrent: boolean;
}

export interface DeviceRemovalStatus {
  canRemoveDevice: boolean;
  lastDeviceRemovalAt: string | null;
  nextDeviceRemovalAt: string | null;
  remainingMs: number;
}

export interface RemoveDesktopDeviceResponse {
  removedDeviceId: string;
  devices: DesktopDevice[];
  maxDevices: number;
  deviceRemoval: DeviceRemovalStatus;
}

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
  source?: "payment";
}

export interface ProcessMetricPoint {
  date?: string;
  day?: string;
  month?: string;
  count: number;
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
  plan: {
    type: "free" | "credit" | "subscription";
    name: string;
    id?: string | null;
  };
  credit: number | null;
  remainingDays: number | null;
  totalSpent: number;
  totalProcess: number;
  todayProcess: number;
  currentMonthProcess: number;
  last6MonthProcess: {
    month: string;
    count: number;
  }[];
  last7DaysProcess: {
    date: string;
    count: number;
  }[];
  recentHistory: OverviewRecentItem[];

  appUser: {
    exists: boolean;
    totalProcess: number;
    todayUsage: number;
    thisMonthUsage: number;
    last6MonthProcess: {
      month: string;
      count: number;
    }[];
    last7DaysProcess: {
      date: string;
      count: number;
    }[];
    creditRemaining: number | null;
    planType: "free" | "credit" | "subscription";
    planId: string | null;
    planName: string;
    expiresAt: string | null;
    daysLeft: number | null;
    isActive: boolean;
    status: "active" | "suspended";
    isSuspended: boolean;
    isManuallyDisabled: boolean;
    devices: DesktopDevice[];
    maxDevices: number;
    deviceRemoval: DeviceRemovalStatus;
  };
}

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  loginProvider: ("google" | "email")[];
  hasPassword: boolean;
  isVerified: boolean;
  isDisabled: boolean;
  role: string;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  referredBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileAppUser {
  exists: boolean;
  plan: {
    type: "subscription" | "credit" | "free";
    id: string | null;
    name: string;
  };
  totalProcess: number;
  credit: number | null;
  isActive: boolean;
  status: "active" | "suspended";
  isSuspended: boolean;
  expiresAt: string | null;
  remainingDays: number | null;
  devicesCount: number;
  maxDevices: number;
}

export interface ProfileSecurity {
  activeSessionsCount: number;
  hasPassword: boolean;
  passwordChangedAt: string | null;
  lastLoginAt: string | null;
}

export interface Profile {
  user: ProfileUser;
  appUser: ProfileAppUser | null;
  security: ProfileSecurity;
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
