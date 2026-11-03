import { z } from "zod";
import { USER_ROLES, PLAN_TYPES, WITHDRAWAL_STATUS, PROMO_APPLIES_TO } from "../constants/index.js";

// === AUTH SCHEMAS ===
export const registerUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referralCode: z.string().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirm password do not match",
  path: ["confirmPassword"],
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const verifyOtpSchema = z.object({
  otp: z.string().min(4, "OTP is required"),
  otpToken: z.string().min(1, "OTP Token is required"),
});

export const resetPasswordSchema = z.object({
  tempToken: z.string().min(1, "Temporary token is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmNewPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New password and confirm password do not match",
  path: ["confirmNewPassword"],
});

// === APP ID / APP KEY SCHEMAS ===
export const createAppIdSchema = z.object({
  username: z.string().min(1, "Username (email) is required"),
  expiryDays: z.coerce.number().optional().default(3),
  plan: z.union([z.string(), z.object({ type: z.string() })]).optional().default("free"),
  initialCredit: z.coerce.number().optional(),
});
export const createAppKeySchema = createAppIdSchema;

export const updateAppIdSchema = z.object({
  username: z.string().min(1, "Username is required"),
  plan: z.union([z.string(), z.object({ type: z.string() })]).optional(),
  expiryDays: z.coerce.number().optional(),
  credit: z.coerce.number().optional(),
});
export const updateAppKeySchema = updateAppIdSchema;

export const addCreditsSchema = z.object({
  key: z.string().min(1, "App ID is required"),
  credits: z.coerce.number().min(1, "Credits must be a positive number"),
});

export const updateAppIdStatusSchema = z.object({
  key: z.string().min(1, "App ID is required"),
  mode: z.enum(["suspend", "reactivate"]),
});
export const updateAppKeyStatusSchema = updateAppIdStatusSchema;

// === PRICING SCHEMAS ===
export const createPricingPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  type: z.enum([PLAN_TYPES.SUBSCRIPTION, PLAN_TYPES.CREDIT]),
  basePrice: z.coerce.number().min(0, "Base price cannot be negative"),
  discountPrice: z.coerce.number().min(0).optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().optional().default(true),
  credit: z.coerce.number().min(1).optional(),
  planDuration: z.coerce.number().min(1, "Plan duration must be at least 1 day"),
});

export const updatePricingPlanSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum([PLAN_TYPES.SUBSCRIPTION, PLAN_TYPES.CREDIT]).optional(),
  basePrice: z.coerce.number().min(0).optional(),
  discountPrice: z.coerce.number().min(0).optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  credit: z.coerce.number().min(1).optional(),
  planDuration: z.coerce.number().min(1).optional(),
});

// === PROMO CODE SCHEMAS ===
export const createPromoCodeSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").toUpperCase(),
  description: z.string().optional(),
  discountPercent: z.coerce.number().min(1).max(100),
  isActive: z.boolean().optional().default(true),
  appliesTo: z.enum([PROMO_APPLIES_TO.SUBSCRIPTION, PROMO_APPLIES_TO.CREDIT, PROMO_APPLIES_TO.BOTH]).optional().default(PROMO_APPLIES_TO.BOTH),
  usageLimit: z.coerce.number().nullable().optional(),
  validFrom: z.string().or(z.date()),
  validUntil: z.string().or(z.date()),
});

export const validatePromoCodeSchema = z.object({
  code: z.string().min(1, "Promo code is required").toUpperCase(),
  planType: z.enum([PLAN_TYPES.SUBSCRIPTION, PLAN_TYPES.CREDIT]).optional(),
});

// === REFERRAL SCHEMAS ===
export const requestWithdrawalSchema = z.object({
  amount: z.coerce.number().min(100, "Minimum withdrawal amount is 100"),
  withdrawAccount: z.string().min(3, "Withdrawal account details required"),
});
