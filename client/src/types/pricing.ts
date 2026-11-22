export interface SubscriptionPlan {
  _id: string;
  name: string;
  type: "subscription" | "credit";
  basePrice: number;
  discountPrice?: number;
  discountPercent: number;
  isActive: boolean;
  planDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPlan {
  _id: string;
  name: string;
  type: "subscription" | "credit";
  basePrice: number;
  discountPrice?: number;
  discountPercent: number;
  isActive: boolean;
  credit: number;
  planDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface PricingResponse {
  subscriptionPlans: SubscriptionPlan[];
  creditPlans: CreditPlan[];
}

export type AppliesTo = "subscription" | "plan" | "both";

export interface PromoCodeRes {
  promoCode: {
    code: string;
    discountPercent: number;
    appliesTo: AppliesTo;
    validUntil: string;
  };
}

export type PaymentCreateResponse = {
  paymentUrl?: string;
  paymentID?: string;
  invoiceNumber?: string;
  amount: number | string;
  currency?: string;
  expiresAt?: string;
  reused?: boolean;
  plan: {
    name: string;
    type: "subscription" | "credit";
    duration?: number; // only for subscription
    credit?: number; // only for credit
  };
  promoCode?: string | null;
};

export type PaymentTransactionStatus =
  | "initiated"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "canceled"
  | "expired"
  | "amount_mismatch"
  | "refunded";

export interface PaymentStatusData {
  id: string | null;
  invoiceNumber: string | null;
  gateway: string;
  status: PaymentTransactionStatus;
  trxId: string | null;
  paymentMethod: string | null;
  payerMobileNo: string | null;
  plan: {
    id: string;
    name: string;
    type: "subscription" | "credit" | string;
    planDuration: number | null;
    credit: number | null;
  };
  promoCode: {
    code: string;
    discountPercent: number;
  } | null;
  amount: number;
  paidAmount: number | null;
  currency: string;
  pricing: {
    basePrice: number;
    priceAfterPlanDiscount: number;
    planDiscountAmount: number;
    promoDiscountAmount: number;
    expectedAmount: number;
    paidAmount: number | null;
    currency: string;
    payWithCharge: number;
  };
  failureReason: string | null;
  expiresAt: string | null;
  verifiedAt: string | null;
  fulfilledAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
