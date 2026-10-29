import mongoose from "mongoose";
import { PLAN_TYPES } from "../constants/index.js";

const appUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: [true, "Username (email) is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    key: {
      type: String,
      required: [true, "App access key is required"],
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    credit: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    allowedDevices: {
      type: [String],
      default: [],
    },
    plan: {
      type: {
        type: String,
        enum: Object.values(PLAN_TYPES),
        default: PLAN_TYPES.FREE,
        index: true,
      },
      id: {
        type: String,
        default: null,
      },
      name: {
        type: String,
        default: null,
      },
    },
    totalProcess: {
      type: Number,
      default: 0,
    },
    monthlyProcess: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    dailyProcess: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    lastCreditRefresh: {
      type: String,
      index: true,
    },
    lastPlanChange: {
      type: Date,
      default: Date.now,
    },
    planHistory: [
      {
        planType: String,
        changedAt: { type: Date, default: Date.now },
        reason: String,
      },
    ],
    failedProcess: {
      type: Map,
      of: {
        count: { type: Number, default: 0 },
        errorMessages: { type: [String], default: [] },
      },
      default: () => new Map(),
    },
    totalFailedProcess: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "appusers",
  }
);

// Method: Refresh daily credits for free plan
appUserSchema.methods.refreshDailyCredits = function () {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.substring(0, 7);

  if (
    this.plan?.type === PLAN_TYPES.FREE &&
    this.lastCreditRefresh !== today &&
    this.credit < 5
  ) {
    this.credit = 5;
    this.lastCreditRefresh = today;

    if (!this.dailyProcess) this.dailyProcess = new Map();
    if (!this.monthlyProcess) this.monthlyProcess = new Map();

    if (!this.dailyProcess.has(today)) {
      this.dailyProcess.set(today, 0);
    }
    if (!this.monthlyProcess.has(currentMonth)) {
      this.monthlyProcess.set(currentMonth, 0);
    }
  }
};

// Method: Downgrade plan
appUserSchema.methods.downgradeToPlan = function (newPlan = PLAN_TYPES.FREE, reason = "manual") {
  const oldPlan = this.plan?.type || PLAN_TYPES.FREE;

  if (!this.planHistory) this.planHistory = [];
  this.planHistory.push({
    planType: oldPlan,
    changedAt: new Date(),
    reason,
  });

  this.plan = { type: newPlan, id: null };
  this.lastPlanChange = new Date();

  if (newPlan === PLAN_TYPES.FREE) {
    this.expiresAt = undefined;
    this.credit = 5;
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.substring(0, 7);
    this.lastCreditRefresh = today;

    if (!this.dailyProcess) this.dailyProcess = new Map();
    if (!this.monthlyProcess) this.monthlyProcess = new Map();

    if (!this.dailyProcess.has(today)) {
      this.dailyProcess.set(today, 0);
    }
    if (!this.monthlyProcess.has(currentMonth)) {
      this.monthlyProcess.set(currentMonth, 0);
    }
  }
};

// Method: Check validity and perform auto-downgrades if expired
appUserSchema.methods.isValid = function () {
  if (!this.isActive || this.status !== "active") return false;

  const now = new Date();

  // Auto-downgrade expired subscriptions
  if (
    this.plan?.type === PLAN_TYPES.SUBSCRIPTION &&
    this.expiresAt &&
    now >= this.expiresAt
  ) {
    this.downgradeToPlan(PLAN_TYPES.FREE, "subscription_expired");
  }

  // Auto-downgrade expired credit plans
  if (
    this.plan?.type === PLAN_TYPES.CREDIT &&
    this.expiresAt &&
    now >= this.expiresAt
  ) {
    this.downgradeToPlan(PLAN_TYPES.FREE, "credit_plan_expired");
  }

  // Auto-downgrade zero credit plans
  if (this.plan?.type === PLAN_TYPES.CREDIT && this.credit <= 0) {
    this.downgradeToPlan(PLAN_TYPES.FREE, "zero_credit");
  }

  this.refreshDailyCredits();
  return true;
};

// Method: Verify if requested count can be processed
appUserSchema.methods.canProcess = function (count = 1) {
  if (!count || count < 1) return false;

  const now = new Date();

  if (
    this.plan?.type === PLAN_TYPES.SUBSCRIPTION &&
    this.expiresAt &&
    now >= this.expiresAt
  ) {
    this.downgradeToPlan(PLAN_TYPES.FREE, "subscription_expired");
  }

  if (
    this.plan?.type === PLAN_TYPES.CREDIT &&
    this.expiresAt &&
    now >= this.expiresAt
  ) {
    this.downgradeToPlan(PLAN_TYPES.FREE, "credit_plan_expired");
  }

  if (this.plan?.type === PLAN_TYPES.CREDIT && this.credit <= 0) {
    this.downgradeToPlan(PLAN_TYPES.FREE, "zero_credit");
  }

  this.refreshDailyCredits();

  if (this.plan?.type === PLAN_TYPES.SUBSCRIPTION) return true;

  if (this.plan?.type === PLAN_TYPES.FREE || this.plan?.type === PLAN_TYPES.CREDIT) {
    return this.credit >= count;
  }

  return false;
};

// Method: Deduct credit and increment process count
appUserSchema.methods.useCredit = async function (creditUsed = 1, processFileCount = 1) {
  creditUsed = Math.max(1, parseInt(creditUsed, 10) || 1);
  processFileCount = Math.max(1, parseInt(processFileCount, 10) || 1);

  if (this.plan?.type === PLAN_TYPES.FREE || this.plan?.type === PLAN_TYPES.CREDIT) {
    this.credit -= creditUsed;

    if (this.credit <= 0 && this.plan.type === PLAN_TYPES.CREDIT) {
      this.downgradeToPlan(PLAN_TYPES.FREE, "zero_credit");
    }
  }

  await this.incrementProcessCount(processFileCount);
};

// Method: Increment process counts and update rolling window
appUserSchema.methods.incrementProcessCount = async function (count = 1) {
  this.totalProcess += count;

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dayKey = now.toISOString().split("T")[0];

  if (!this.monthlyProcess) this.monthlyProcess = new Map();
  if (!this.dailyProcess) this.dailyProcess = new Map();

  const currentMonthly = this.monthlyProcess.get(monthKey) || 0;
  this.monthlyProcess.set(monthKey, currentMonthly + count);

  const currentDaily = this.dailyProcess.get(dayKey) || 0;
  this.dailyProcess.set(dayKey, currentDaily + count);

  this.cleanupOldDailyData();
  this.cleanupOldMonthlyData();

  await this.save();
};

appUserSchema.methods.cleanupOldDailyData = function () {
  if (!this.dailyProcess) return;
  const now = new Date();
  const recentDays = new Set();

  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    recentDays.add(d.toISOString().split("T")[0]);
  }

  for (const key of this.dailyProcess.keys()) {
    if (!recentDays.has(key)) {
      this.dailyProcess.delete(key);
    }
  }
};

appUserSchema.methods.cleanupOldMonthlyData = function () {
  if (!this.monthlyProcess) return;
  const now = new Date();
  const recentMonths = new Set();

  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    recentMonths.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  for (const key of this.monthlyProcess.keys()) {
    if (!recentMonths.has(key)) {
      this.monthlyProcess.delete(key);
    }
  }
};

appUserSchema.methods.calculateCredit = function () {
  const now = new Date();

  if (
    this.plan?.type === PLAN_TYPES.SUBSCRIPTION &&
    this.expiresAt &&
    now >= this.expiresAt
  ) {
    this.downgradeToPlan(PLAN_TYPES.FREE, "subscription_expired");
  }

  if (
    this.plan?.type === PLAN_TYPES.CREDIT &&
    this.expiresAt &&
    now >= this.expiresAt
  ) {
    this.downgradeToPlan(PLAN_TYPES.FREE, "credit_plan_expired");
  }

  if (this.plan?.type === PLAN_TYPES.CREDIT && this.credit <= 0) {
    this.downgradeToPlan(PLAN_TYPES.FREE, "zero_credit");
  }

  if (this.plan?.type === PLAN_TYPES.CREDIT) {
    return this.credit;
  }
  if (this.plan?.type === PLAN_TYPES.SUBSCRIPTION) {
    return Infinity;
  }

  this.refreshDailyCredits();
  return this.credit;
};

appUserSchema.methods.getPlanStatus = function () {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  return {
    planType: this.plan?.type || PLAN_TYPES.FREE,
    credit: this.credit,
    isExpired: Boolean(this.expiresAt && now >= this.expiresAt),
    daysUntilExpiry: this.expiresAt
      ? Math.ceil((this.expiresAt - now) / (1000 * 60 * 60 * 24))
      : null,
    lastRefresh: this.lastCreditRefresh,
    needsRefresh:
      this.plan?.type === PLAN_TYPES.FREE &&
      this.lastCreditRefresh !== today,
  };
};

appUserSchema.methods.upgradePlan = function (newPlan, expiresAt = null, credits = null) {
  const oldPlan = this.plan?.type || PLAN_TYPES.FREE;

  if (!this.planHistory) this.planHistory = [];
  this.planHistory.push({
    planType: oldPlan,
    changedAt: new Date(),
    reason: "upgrade",
  });

  this.plan = { type: newPlan, id: this.plan?.id || null };
  this.lastPlanChange = new Date();

  if (newPlan === PLAN_TYPES.SUBSCRIPTION) {
    this.expiresAt = expiresAt;
    this.credit = Infinity;
  } else if (newPlan === PLAN_TYPES.CREDIT) {
    this.credit = credits !== null ? credits : this.credit;
    this.expiresAt = expiresAt || undefined;
  }
};

// Static: Daily maintenance batch runner
appUserSchema.statics.performDailyMaintenance = async function () {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  try {
    // 1. Refresh credits for free users
    const freeUsers = await this.find({
      "plan.type": PLAN_TYPES.FREE,
      isActive: true,
      status: "active",
      credit: { $lte: 5 },
      lastCreditRefresh: { $ne: today },
    });

    for (const appUser of freeUsers) {
      appUser.refreshDailyCredits();
      await appUser.save();
    }

    // 2. Downgrade expired subscriptions
    const expiredSubscriptions = await this.find({
      "plan.type": PLAN_TYPES.SUBSCRIPTION,
      isActive: true,
      status: "active",
      expiresAt: { $lte: now },
    });

    for (const appUser of expiredSubscriptions) {
      appUser.downgradeToPlan(PLAN_TYPES.FREE, "subscription_expired_auto");
      await appUser.save();
    }

    // 3. Downgrade zero credit plans
    const zeroCreditPlans = await this.find({
      "plan.type": PLAN_TYPES.CREDIT,
      isActive: true,
      status: "active",
      credit: { $lte: 0 },
    });

    for (const appUser of zeroCreditPlans) {
      appUser.downgradeToPlan(PLAN_TYPES.FREE, "zero_credit_auto");
      await appUser.save();
    }

    // 4. Downgrade expired credit plans
    const expiredCreditPlans = await this.find({
      "plan.type": PLAN_TYPES.CREDIT,
      isActive: true,
      status: "active",
      expiresAt: { $lte: now },
    });

    for (const appUser of expiredCreditPlans) {
      appUser.downgradeToPlan(PLAN_TYPES.FREE, "credit_plan_expired_auto");
      await appUser.save();
    }

    return {
      success: true,
      freeUsersRefreshed: freeUsers.length,
      expiredSubscriptionsDowngraded: expiredSubscriptions.length,
      zeroCreditPlansDowngraded: zeroCreditPlans.length,
      expiredCreditPlansDowngraded: expiredCreditPlans.length,
      timestamp: now.toISOString(),
    };
  } catch (error) {
    console.error("Daily maintenance error:", error);
    return {
      success: false,
      error: error.message,
      timestamp: now.toISOString(),
    };
  }
};

// Optimized compound indexes
appUserSchema.index({ "plan.type": 1, expiresAt: 1 });
appUserSchema.index({ "plan.type": 1, credit: 1 });
appUserSchema.index({ "plan.type": 1, lastCreditRefresh: 1 });
appUserSchema.index({ isActive: 1, status: 1 });
appUserSchema.index({ userId: 1, isActive: 1 });
appUserSchema.index({ createdAt: -1 });

export const AppUser =
  mongoose.models.AppUser || mongoose.model("AppUser", appUserSchema, "appusers");
export const AppKey = AppUser; // Seamless alias for backward compatibility

export default AppUser;
