import { z } from "zod";
import { PLAN_TYPES, PROMO_APPLIES_TO } from "../constants/index.js";

// === AUTH SCHEMAS ===
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const registerUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: passwordSchema,
  referralCode: z.string().trim().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required").max(72, "Invalid credentials"),
});

export const verifyEmailSchema = z.union([
  z.object({
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Verification code must be 6 digits"),
  }),
  z.object({
    token: z.string().trim().min(32, "Invalid verification token"),
  }),
]);

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(72).optional(),
    newPassword: passwordSchema,
    confirmPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
  })
  .refine((data) => Boolean(data.confirmPassword || data.confirmNewPassword), {
    message: "Please confirm your new password",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => data.newPassword === (data.confirmPassword || data.confirmNewPassword),
    {
      message: "New password and confirm password do not match",
      path: ["confirmPassword"],
    }
  );

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().trim().min(32, "Reset token is required"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmNewPassword"],
  });

export const verifyGoogleCodeSchema = z.object({
  code: z.string().trim().min(16, "Google authorization code is required"),
  referralCode: z.string().trim().nullable().optional(),
});

// === APP USER SCHEMAS ===
export const createAppUserSchema = z
  .object({
    username: z.string().trim().toLowerCase().email("Valid email address is required"),
    name: z.string().trim().max(100).optional(),
    password: z.string().max(72).optional(),
    createAccountIfMissing: z.boolean().optional().default(false),
    isVerified: z.boolean().optional().default(true),
    planId: z.string().trim().nullable().optional(),
    plan: z
      .union([
        z.string(),
        z.object({
          type: z.string(),
          id: z.string().nullable().optional(),
          name: z.string().nullable().optional(),
        }),
      ])
      .optional()
      .default("free"),
    expiryDays: z.coerce.number().min(0).max(3650).optional(),
    initialCredit: z.coerce.number().min(0).optional(),
    credit: z.coerce.number().min(0).optional(),
    maxDevices: z.coerce.number().int().min(1).max(20).optional().default(2),
    recordPayment: z.boolean().optional().default(false),
    paymentAmount: z.coerce.number().min(0).optional(),
    paymentNote: z.string().trim().max(500).optional(),
    reason: z.string().trim().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.createAccountIfMissing) {
      if (!data.name || data.name.trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Full name must be at least 2 characters when creating a new account",
        });
      }
      if (!data.password || data.password.length < 8) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "Password must be at least 8 characters when creating a new account",
        });
      }
    }
  });

export const updateAppUserSchema = z
  .object({
    username: z.string().trim().optional(),
    key: z.string().trim().optional(),
    userId: z.string().trim().optional(),
    planId: z.string().trim().nullable().optional(),
    plan: z
      .union([
        z.string(),
        z.object({
          type: z.string(),
          id: z.string().nullable().optional(),
          name: z.string().nullable().optional(),
        }),
      ])
      .optional(),
    upgradeMode: z.enum(["replace", "extend"]).optional().default("replace"),
    expiryDays: z.coerce.number().min(0).max(3650).optional(),
    credit: z.coerce.number().min(0).optional(),
    maxDevices: z.coerce.number().int().min(1).max(20).optional(),
    reactivate: z.boolean().optional().default(false),
    recordPayment: z.boolean().optional().default(false),
    paymentAmount: z.coerce.number().min(0).optional(),
    paymentNote: z.string().trim().max(500).optional(),
    triggerReferralReward: z.boolean().optional().default(false),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((data) => Boolean(data.username || data.key || data.userId), {
    message: "Username, access key, or userId is required",
    path: ["username"],
  });

export const addCreditsSchema = z.object({
  key: z.string().min(1, "App user key is required"),
  credits: z.coerce.number().min(1, "Credits must be a positive number"),
});

export const updateAppUserStatusSchema = z.object({
  key: z.string().min(1, "App user key is required"),
  mode: z.enum(["suspend", "reactivate"]),
});

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
