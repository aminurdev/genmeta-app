import { apiRequest } from "../api";
import { ApiResponse } from "../referral";

interface ReferralRes {
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

export const getAllReferral = async (): Promise<ApiResponse<ReferralRes[]>> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: "/admin/referral",
  });

  return result;
};

// Referrer basic info
export interface Referrer {
  _id: string;
  name: string;
  email: string;
}

// Referred User info
export interface ReferredUser {
  _id: string;
  name: string;
  email: string;
}

// Earned History
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

// Withdrawal History
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

export const getAllReferralByUserId = async (
  userId: string
): Promise<ApiResponse<ReferralDetails>> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: `/admin/referral/${userId}`,
  });

  return result;
};

export interface UpdateWithdrawalRes {
  _id: string;
  amount: number;
  status: "completed" | "rejected";
  withdrawAccount: string;
  trx: string | null;
  createdAt: Date;
  issuedAt: Date;
}

export const updateWithdrawal = async (
  userId: string,
  withdrawalId: string,
  status: string,
  trx: string
): Promise<ApiResponse<UpdateWithdrawalRes>> => {
  const result = await apiRequest({
    method: "PATCH",
    endpoint: `/admin/referral/${userId}/withdrawals/${withdrawalId}`,
    data: { status, trx },
  });
  return result;
};
