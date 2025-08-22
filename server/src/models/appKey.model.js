import mongoose from "mongoose";

const appKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  key: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
  credit: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ["active", "suspended"],
    default: "active",
  },
  suspendedAt: {
    type: Date,
    default: null,
  },
  deviceId: String,
  plan: {
    type: {
      type: String,
      enum: ["free", "credit", "subscription"],
      default: "free",
    },
    id: {
      type: String,
    },
  },
  totalProcess: {
    type: Number,
    default: 0,
  },
  monthlyProcess: {
    type: Map,
    of: Number,
    default: {},
  },
  dailyProcess: {
    type: Map,
    of: Number,
    default: {},
  },
  lastCreditRefresh: {
    type: String,
  },
  // New fields for better tracking
  lastPlanChange: {
    type: Date,
    default: Date.now,
  },
  planHistory: [
    {
      planType: String,
      changedAt: Date,
      reason: String,
    },
  ],
});

// Enhanced refresh daily credits for free plan
appKeySchema.methods.refreshDailyCredits = function () {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = `${today.substring(0, 7)}`;

  if (this.plan.type === "free" && this.lastCreditRefresh !== today) {
    this.credit = 10;
    this.lastCreditRefresh = today;

    // Initialize daily process for today if not exists
    if (!this.dailyProcess.has(today)) {
      this.dailyProcess.set(today, 0);
    }

    // Initialize monthly process if not exists
    if (!this.monthlyProcess.has(currentMonth)) {
      this.monthlyProcess.set(currentMonth, 0);
    }
  }
};

// Static method for automatic daily maintenance at 12 AM
appKeySchema.statics.performDailyMaintenance = async function () {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  try {
    // 1. Refresh credits for all free plan users
    const freeUsers = await this.find({
      "plan.type": "free",
      isActive: true,
      status: "active",
      credit: { $lte: 10 },
      lastCreditRefresh: { $ne: today },
    });

    for (const appKey of freeUsers) {
      appKey.refreshDailyCredits();
      await appKey.save();
    }

    // 2. Downgrade expired subscription plans
    const expiredSubscriptions = await this.find({
      "plan.type": "subscription",
      isActive: true,
      status: "active",
      expiresAt: { $lte: now },
    });

    for (const appKey of expiredSubscriptions) {
      appKey.downgradeToPlan("free", "expired_auto");
      await appKey.save();
    }

    // 3. Downgrade zero credit plans
    const zeroCreditPlans = await this.find({
      "plan.type": "credit",
      isActive: true,
      status: "active",
      credit: { $lte: 0 },
    });

    for (const appKey of zeroCreditPlans) {
      appKey.downgradeToPlan("free", "zero_credit_auto");
      await appKey.save();
    }

    return {
      success: true,
      freeUsersRefreshed: freeUsers.length,
      expiredSubscriptionsDowngraded: expiredSubscriptions.length,
      zeroCreditPlansDowngraded: zeroCreditPlans.length,
      timestamp: now.toISOString(),
    };
  } catch (error) {
    console.error("Daily maintenance failed:", error);
    return {
      success: false,
      error: error.message,
      timestamp: now.toISOString(),
    };
  }
};

// Enhanced validity check with auto-management
appKeySchema.methods.isValid = function () {
  if (!this.isActive || this.status !== "active") return false;

  // Auto-downgrade expired subscriptions
  if (
    this.plan.type === "subscription" &&
    this.expiresAt &&
    new Date() >= this.expiresAt
  ) {
    this.downgradeToPlan("free", "expired");
  }

  // Auto-downgrade zero credit plans
  if (this.plan.type === "credit" && this.credit <= 0) {
    this.downgradeToPlan("free", "zero_credit");
  }

  this.refreshDailyCredits();
  return true;
};

// Enhanced downgrade plan with reason tracking
appKeySchema.methods.downgradeToPlan = function (newPlan, reason = "manual") {
  const oldPlan = this.plan.type;

  // Record plan change in history
  this.planHistory.push({
    planType: oldPlan,
    changedAt: new Date(),
    reason: reason,
  });

  this.plan = { type: newPlan };
  this.lastPlanChange = new Date();

  if (newPlan === "free") {
    this.expiresAt = undefined;
    this.credit = 10;
    this.lastCreditRefresh = new Date().toISOString().split("T")[0];

    // Initialize tracking for current period
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = `${today.substring(0, 7)}`;

    if (!this.dailyProcess.has(today)) {
      this.dailyProcess.set(today, 0);
    }

    if (!this.monthlyProcess.has(currentMonth)) {
      this.monthlyProcess.set(currentMonth, 0);
    }
  }
};

// Enhanced canProcess with auto-management
appKeySchema.methods.canProcess = function (count = 1) {
  if (!count || count < 1) return false;

  // Auto-downgrade expired subscriptions
  if (
    this.plan.type === "subscription" &&
    this.expiresAt &&
    new Date() >= this.expiresAt
  ) {
    this.downgradeToPlan("free", "expired");
  }

  // Auto-downgrade zero credit plans
  if (this.plan.type === "credit" && this.credit <= 0) {
    this.downgradeToPlan("free", "zero_credit");
  }

  this.refreshDailyCredits();

  if (this.plan.type === "subscription") return true;

  if (this.plan.type === "free" || this.plan.type === "credit") {
    return this.credit >= count;
  }

  return false;
};

// Enhanced useCredit with better error handling
appKeySchema.methods.useCredit = async function (count = 1) {
  if (!this.canProcess(count)) {
    const errorMessage =
      this.plan.type === "subscription"
        ? "Subscription has expired"
        : "Not enough credit";
    throw new Error(errorMessage);
  }

  // Ensure we're using a valid count
  count = Math.max(1, parseInt(count) || 1);

  if (this.plan.type === "free" || this.plan.type === "credit") {
    this.credit -= count;

    // Auto-downgrade if credit reaches zero
    if (this.credit <= 0 && this.plan.type === "credit") {
      this.downgradeToPlan("free", "zero_credit");
    }
  }

  await this.incrementProcessCount(count);
};

// Enhanced incrementProcessCount with better Map handling
appKeySchema.methods.incrementProcessCount = async function (count = 1) {
  this.totalProcess += count;

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dayKey = now.toISOString().split("T")[0];

  // Initialize maps if they don't exist
  if (!this.monthlyProcess) {
    this.monthlyProcess = new Map();
  }

  if (!this.dailyProcess) {
    this.dailyProcess = new Map();
  }

  const currentMonthly = this.monthlyProcess.get(monthKey) || 0;
  this.monthlyProcess.set(monthKey, currentMonthly + count);

  const currentDaily = this.dailyProcess.get(dayKey) || 0;
  this.dailyProcess.set(dayKey, currentDaily + count);

  // Keep last 3 days only for daily process
  this.cleanupOldDailyData();

  // Keep last 12 months for monthly process
  this.cleanupOldMonthlyData();

  await this.save();
};

// New method to clean up old daily data
appKeySchema.methods.cleanupOldDailyData = function () {
  const now = new Date();
  const recentDays = new Set();

  for (let i = 0; i < 3; i++) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    recentDays.add(date.toISOString().split("T")[0]);
  }

  for (const key of this.dailyProcess.keys()) {
    if (!recentDays.has(key)) {
      this.dailyProcess.delete(key);
    }
  }
};

// New method to clean up old monthly data
appKeySchema.methods.cleanupOldMonthlyData = function () {
  const now = new Date();
  const recentMonths = new Set();

  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(now.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    recentMonths.add(monthKey);
  }

  for (const key of this.monthlyProcess.keys()) {
    if (!recentMonths.has(key)) {
      this.monthlyProcess.delete(key);
    }
  }
};

// Enhanced calculateCredit with auto-management
appKeySchema.methods.calculateCredit = function () {
  // Auto-check for expired subscriptions
  if (
    this.plan.type === "subscription" &&
    this.expiresAt &&
    new Date() >= this.expiresAt
  ) {
    this.downgradeToPlan("free", "expired");
  }

  // Auto-check for zero credit plans
  if (this.plan.type === "credit" && this.credit <= 0) {
    this.downgradeToPlan("free", "zero_credit");
  }

  if (this.plan.type === "credit") {
    return this.credit;
  } else if (this.plan.type === "subscription") {
    return Infinity;
  } else {
    // For free plan, refresh daily credits first
    this.refreshDailyCredits();
    return this.credit;
  }
};

// New method to get plan status with expiry info
appKeySchema.methods.getPlanStatus = function () {
  const now = new Date();

  return {
    planType: this.plan.type,
    credit: this.credit,
    isExpired: this.expiresAt && now >= this.expiresAt,
    daysUntilExpiry: this.expiresAt
      ? Math.ceil((this.expiresAt - now) / (1000 * 60 * 60 * 24))
      : null,
    lastRefresh: this.lastCreditRefresh,
    needsRefresh:
      this.plan.type === "free" &&
      this.lastCreditRefresh !== new Date().toISOString().split("T")[0],
  };
};

// New method to upgrade plan
appKeySchema.methods.upgradePlan = function (
  newPlan,
  expiresAt = null,
  credits = null
) {
  const oldPlan = this.plan.type;

  // Record plan change in history
  this.planHistory.push({
    planType: oldPlan,
    changedAt: new Date(),
    reason: "upgrade",
  });

  this.plan = { type: newPlan };
  this.lastPlanChange = new Date();

  if (newPlan === "subscription") {
    this.expiresAt = expiresAt;
    this.credit = Infinity; // Unlimited for subscription
  } else if (newPlan === "credit") {
    this.credit = credits || this.credit;
    this.expiresAt = undefined;
  }
};

// Index for better query performance
appKeySchema.index({ "plan.type": 1, expiresAt: 1 });
appKeySchema.index({ "plan.type": 1, credit: 1 });
appKeySchema.index({ "plan.type": 1, lastCreditRefresh: 1 });
appKeySchema.index({ isActive: 1, status: 1 });

export const AppKey = mongoose.model("AppKey", appKeySchema);
