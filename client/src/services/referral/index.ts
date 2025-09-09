import { apiRequest } from "../api";

// Earned history item
export interface EarnedHistoryItem {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  term: "1st" | "2nd" | "3rd";
  amount: number;
  createdAt: string;
}

// Withdrawal history item
export interface WithdrawHistoryItem {
  amount: number;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
  issuedAt: string | null;
  trx: string | null;
  withdrawAccount?: string;
}

// Referral response data
export interface ReferralData {
  referralCode: string;
  referralCount: number;
  totalEarned: number;
  availableBalance: number;
  totalWithdrawn: number;
  earnedHistory?: EarnedHistoryItem[];
  withdrawHistory?: WithdrawHistoryItem[];
}

export interface RequestWithdrawRes {
  amount: number;
  withdrawAccount: string;
  status: string;
  requestedAt: Date;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export const getReferralDetails = async (): Promise<
  ApiResponse<ReferralData>
> => {
  const result = await apiRequest({
    method: "GET",
    endpoint: "/referral/getDetails",
  });

  return result;
};

interface RequestWithdraw {
  withdrawAccount: string;
  amount: number;
}

export const requestWithdraw = async (
  data: RequestWithdraw
): Promise<ApiResponse<RequestWithdrawRes>> => {
  const result = await apiRequest({
    method: "post",
    endpoint: "/referral/request-withdraw",
    data: data,
  });

  return result;
};
