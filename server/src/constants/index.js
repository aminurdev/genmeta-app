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

export const NOTIFICATION_CATEGORIES = {
  BILLING: "billing",
  PLAN: "plan",
  REFERRAL: "referral",
  SECURITY: "security",
  SYSTEM: "system",
  ANNOUNCEMENT: "announcement",
};

export const NOTIFICATION_PRIORITIES = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
};

export const NOTIFICATION_AUDIENCES = {
  USER: "user",
  ADMIN: "admin",
};

export const NOTIFICATION_BROADCAST_TARGETS = {
  ALL_USERS: "all_users",
  SUBSCRIPTION_USERS: "subscription_users",
  CREDIT_USERS: "credit_users",
  FREE_USERS: "free_users",
  ADMINS: "admins",
  SPECIFIC_USERS: "specific_users",
};

export const PROCESS_ERROR_STATUS = {
  UNRESOLVED: "unresolved",
  RESOLVED: "resolved",
  IGNORED: "ignored",
};
