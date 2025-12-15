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
  bkashURL: string;
  paymentID: string;
  amount: string;
  plan: {
    name: string;
    type: "subscription" | "credit";
    duration?: number; // only for subscription
    credit?: number; // only for credit
  };
};
