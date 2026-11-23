import { z } from "zod";
import {
  NOTIFICATION_BROADCAST_TARGETS,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  PLAN_TYPES,
  PROCESS_ERROR_STATUS,
  PROMO_APPLIES_TO,
} from "../constants/index.js";

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
    appUserId: z.string().trim().optional(),
    userId: z.string().trim().optional(),
    username: z.string().trim().optional(),
    key: z.string().trim().optional(),
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
  .refine(
    (data) => Boolean(data.userId || data.appUserId || data.username || data.key),
    {
      message: "userId, appUserId, or username is required",
      path: ["userId"],
    }
  );

export const addCreditsSchema = z
  .object({
    appUserId: z.string().trim().optional(),
    userId: z.string().trim().optional(),
    username: z.string().trim().optional(),
    key: z.string().trim().optional(),
    credits: z.coerce.number().min(1, "Credits must be a positive number"),
  })
  .refine(
    (data) => Boolean(data.userId || data.appUserId || data.username || data.key),
    {
      message: "userId, appUserId, or username is required",
      path: ["userId"],
    }
  );

export const updateAppUserStatusSchema = z
  .object({
    appUserId: z.string().trim().optional(),
    userId: z.string().trim().optional(),
    username: z.string().trim().optional(),
    key: z.string().trim().optional(),
    mode: z.enum(["suspend", "reactivate"]),
  })
  .refine(
    (data) => Boolean(data.userId || data.appUserId || data.username || data.key),
    {
      message: "userId, appUserId, or username is required",
      path: ["userId"],
    }
  );

export const resetDeviceSchema = z
  .object({
    appUserId: z.string().trim().optional(),
    userId: z.string().trim().optional(),
    username: z.string().trim().optional(),
    key: z.string().trim().optional(),
    deviceId: z.string().trim().optional(),
  })
  .refine(
    (data) => Boolean(data.userId || data.appUserId || data.username || data.key),
    {
      message: "userId, appUserId, or username is required",
      path: ["userId"],
    }
  );

// === PRICING SCHEMAS ===
export const createPricingPlanSchema = z.object({
  name: z.string().trim().min(1, "Plan name is required"),
  type: z.enum([PLAN_TYPES.SUBSCRIPTION, PLAN_TYPES.CREDIT]),
  basePrice: z.coerce.number().min(0, "Base price cannot be negative"),
  discountPrice: z.coerce.number().min(0).optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().optional().default(true),
  credit: z.coerce.number().min(1).nullable().optional(),
  planDuration: z.coerce.number().min(1, "Plan duration must be at least 1 day"),
});

export const updatePricingPlanSchema = z.object({
  name: z.string().trim().min(1).optional(),
  type: z.enum([PLAN_TYPES.SUBSCRIPTION, PLAN_TYPES.CREDIT]).optional(),
  basePrice: z.coerce.number().min(0).optional(),
  discountPrice: z.coerce.number().min(0).optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  credit: z.coerce.number().min(1).nullable().optional(),
  planDuration: z.coerce.number().min(1).optional(),
});

// === PROMO CODE SCHEMAS ===
const promoUsageLimitSchema = z
  .union([z.coerce.number().int().min(1), z.null(), z.literal("")])
  .optional();

export const createPromoCodeSchema = z.object({
  code: z.string().trim().min(2, "Code must be at least 2 characters").toUpperCase(),
  description: z.string().optional(),
  discountPercent: z.coerce.number().min(1).max(100),
  isActive: z.boolean().optional().default(true),
  appliesTo: z.enum([PROMO_APPLIES_TO.SUBSCRIPTION, PROMO_APPLIES_TO.CREDIT, PROMO_APPLIES_TO.BOTH]).optional().default(PROMO_APPLIES_TO.BOTH),
  usageLimit: promoUsageLimitSchema,
  validFrom: z.string().or(z.date()),
  validUntil: z.string().or(z.date()),
});

export const updatePromoCodeSchema = z.object({
  code: z.string().trim().min(2, "Code must be at least 2 characters").toUpperCase().optional(),
  description: z.string().optional(),
  discountPercent: z.coerce.number().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  appliesTo: z.enum([PROMO_APPLIES_TO.SUBSCRIPTION, PROMO_APPLIES_TO.CREDIT, PROMO_APPLIES_TO.BOTH]).optional(),
  usageLimit: promoUsageLimitSchema,
  validFrom: z.string().or(z.date()).optional(),
  validUntil: z.string().or(z.date()).optional(),
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

// === PAYMENT SCHEMAS ===
export const createPaystationPaymentSchema = z.object({
  planId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Valid Plan ID is required"),
  promoCode: z.string().trim().max(64).nullable().optional(),
  customerPhone: z
    .string()
    .trim()
    .max(20)
    .refine(
      (val) => {
        if (!val) return true;
        const cleaned = val.replace(/[\s\-()]/g, "");
        return /^(?:\+?88)?01[3-9]\d{8}$/.test(cleaned);
      },
      { message: "Please provide a valid Bangladeshi mobile number (e.g. 017XXXXXXXX)" }
    )
    .nullable()
    .optional(),
  idempotencyKey: z.string().trim().max(128).nullable().optional(),
  type: z.string().trim().max(32).optional(),
  paymentMethod: z.string().trim().max(32).optional(),
});

export const paymentInvoiceParamSchema = z.object({
  invoiceNumber: z
    .string()
    .trim()
    .min(4, "Valid invoice number is required")
    .max(80, "Invoice number is too long")
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid invoice number format"),
});

// === NOTIFICATION SCHEMAS ===
export const listNotificationsQuerySchema = z.object({
  scope: z.enum(["user", "admin", "all"]).optional().default("user"),
  status: z.enum(["all", "unread", "read", "archived"]).optional().default("all"),
  category: z
    .enum([
      NOTIFICATION_CATEGORIES.BILLING,
      NOTIFICATION_CATEGORIES.PLAN,
      NOTIFICATION_CATEGORIES.REFERRAL,
      NOTIFICATION_CATEGORIES.SECURITY,
      NOTIFICATION_CATEGORIES.SYSTEM,
      NOTIFICATION_CATEGORIES.ANNOUNCEMENT,
    ])
    .optional(),
  priority: z
    .enum([
      NOTIFICATION_PRIORITIES.LOW,
      NOTIFICATION_PRIORITIES.NORMAL,
      NOTIFICATION_PRIORITIES.HIGH,
      NOTIFICATION_PRIORITIES.URGENT,
    ])
    .optional(),
  search: z.string().trim().max(120).optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

const categoryPreferenceItemSchema = z
  .object({
    inApp: z.boolean().optional(),
    email: z.boolean().optional(),
  })
  .strict();

export const updateNotificationPreferencesSchema = z
  .object({
    channels: z
      .object({
        inApp: z.boolean().optional(),
        email: z.boolean().optional(),
      })
      .strict()
      .optional(),
    categories: z
      .object({
        billing: categoryPreferenceItemSchema.optional(),
        plan: categoryPreferenceItemSchema.optional(),
        referral: categoryPreferenceItemSchema.optional(),
        security: categoryPreferenceItemSchema.optional(),
        system: categoryPreferenceItemSchema.optional(),
        announcement: categoryPreferenceItemSchema.optional(),
      })
      .strict()
      .optional(),
    toastEnabled: z.boolean().optional(),
    soundEnabled: z.boolean().optional(),
  })
  .strict();

function isValidSafeActionUrl(value) {
  if (!value) return true;
  const trimmed = String(value).trim();
  if (!trimmed) return true;
  if (/[\r\n\0]/.test(trimmed)) return false;
  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//");
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export const broadcastNotificationSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(160, "Title cannot exceed 160 characters"),
    message: z
      .string()
      .trim()
      .min(2, "Message must be at least 2 characters")
      .max(1000, "Message cannot exceed 1000 characters"),
    category: z
      .enum([
        NOTIFICATION_CATEGORIES.ANNOUNCEMENT,
        NOTIFICATION_CATEGORIES.SYSTEM,
        NOTIFICATION_CATEGORIES.BILLING,
        NOTIFICATION_CATEGORIES.PLAN,
      ])
      .optional()
      .default(NOTIFICATION_CATEGORIES.ANNOUNCEMENT),
    priority: z
      .enum([
        NOTIFICATION_PRIORITIES.LOW,
        NOTIFICATION_PRIORITIES.NORMAL,
        NOTIFICATION_PRIORITIES.HIGH,
        NOTIFICATION_PRIORITIES.URGENT,
      ])
      .optional()
      .default(NOTIFICATION_PRIORITIES.NORMAL),
    target: z.enum([
      NOTIFICATION_BROADCAST_TARGETS.ALL_USERS,
      NOTIFICATION_BROADCAST_TARGETS.SUBSCRIPTION_USERS,
      NOTIFICATION_BROADCAST_TARGETS.CREDIT_USERS,
      NOTIFICATION_BROADCAST_TARGETS.FREE_USERS,
      NOTIFICATION_BROADCAST_TARGETS.ADMINS,
      NOTIFICATION_BROADCAST_TARGETS.SPECIFIC_USERS,
    ]),
    targetIdentifiers: z
      .union([z.array(z.string().trim().min(1)), z.string()])
      .optional()
      .transform((val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.map((v) => v.trim()).filter(Boolean);
        return val
          .split(/[\s,;]+/)
          .map((v) => v.trim())
          .filter(Boolean);
      }),
    actionUrl: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional()
      .refine((val) => isValidSafeActionUrl(val), {
        message: "Action URL must be a relative path (e.g. /pricing) or valid http/https URL",
      }),
    actionLabel: z.string().trim().max(60).nullable().optional(),
    sendEmail: z.boolean().optional().default(false),
    expiresInDays: z
      .union([z.coerce.number().int().min(1).max(365), z.null(), z.literal("")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
  })
  .superRefine((data, ctx) => {
    if (
      data.target === NOTIFICATION_BROADCAST_TARGETS.SPECIFIC_USERS &&
      (!data.targetIdentifiers || data.targetIdentifiers.length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["targetIdentifiers"],
        message: "Provide at least one email or user ID when targeting specific users",
      });
    }
  });

// === ADMIN PROCESS ERROR TRIAGE SCHEMAS ===
export const updateProcessErrorStatusSchema = z.object({
  status: z.enum([
    PROCESS_ERROR_STATUS.UNRESOLVED,
    PROCESS_ERROR_STATUS.RESOLVED,
    PROCESS_ERROR_STATUS.IGNORED,
  ]),
  resolutionNote: z.string().trim().max(500).nullable().optional(),
});

export const bulkUpdateProcessErrorStatusSchema = z
  .object({
    ids: z.array(z.string().trim().min(1)).max(200).optional(),
    resolveAllUnresolved: z.boolean().optional().default(false),
    status: z.enum([
      PROCESS_ERROR_STATUS.UNRESOLVED,
      PROCESS_ERROR_STATUS.RESOLVED,
      PROCESS_ERROR_STATUS.IGNORED,
    ]),
    resolutionNote: z.string().trim().max(500).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasIds = Array.isArray(data.ids) && data.ids.length > 0;
    if (data.resolveAllUnresolved) {
      if (
        data.status !== PROCESS_ERROR_STATUS.RESOLVED &&
        data.status !== PROCESS_ERROR_STATUS.IGNORED
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["status"],
          message: "Bulk resolving all unresolved errors requires status 'resolved' or 'ignored'",
        });
      }
      return;
    }
    if (!hasIds) {
      ctx.addIssue({
        code: "custom",
        path: ["ids"],
        message: "Provide at least one error log ID or enable resolveAllUnresolved",
      });
    }
  });
