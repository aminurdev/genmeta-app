export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "superAdmin",
};

export const PLAN_TYPES = {
  FREE: "free",
  CREDIT: "credit",
  SUBSCRIPTION: "subscription",
};

export const WITHDRAWAL_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  REJECTED: "rejected",
};

export const PAYMENT_GATEWAYS = {
  BKASH: "bkash",
  PAYSTATION: "paystation",
  MANUAL: "manual",
};

export const PAYMENT_STATUS = {
  INITIATED: "initiated",
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELED: "canceled",
  EXPIRED: "expired",
  AMOUNT_MISMATCH: "amount_mismatch",
  REFUNDED: "refunded",
};

export const PROMO_APPLIES_TO = {
  SUBSCRIPTION: "subscription",
  CREDIT: "credit",
  BOTH: "both",
};
