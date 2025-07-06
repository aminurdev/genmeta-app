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
    type: String, // YYYY-MM-DD format
  },
});

// Refresh daily credits for free plan
appKeySchema.methods.refreshDailyCredits = function () {
  const today = new Date().toISOString().split("T")[0];
  if (this.plan.type === "free" && this.lastCreditRefresh !== today) {
    this.credit = 10;
    this.lastCreditRefresh = today;

    // Initialize daily process for today if not exists
    if (!this.dailyProcess.has(today)) {
      this.dailyProcess.set(today, 0);
    }

    // Initialize monthly process if not exists
    const currentMonth = `${today.substring(0, 7)}`;
    if (!this.monthlyProcess.has(currentMonth)) {
      this.monthlyProcess.set(currentMonth, 0);
    }
  }
};

// Check if API key is valid
appKeySchema.methods.isValid = function () {
  if (!this.isActive || this.status !== "active") return false;

  // Check if subscription has expired and downgrade if needed
  if (
    this.plan.type !== "free" &&
    this.expiresAt &&
    new Date() >= this.expiresAt
  ) {
    this.downgradeToPlan("free");
  }

  this.refreshDailyCredits();
  return true;
};

// Downgrade plan
appKeySchema.methods.downgradeToPlan = function (newPlan) {
  this.plan = { type: newPlan };
  if (newPlan === "free") {
    this.expiresAt = undefined;
    this.credit = 10;
    this.lastCreditRefresh = new Date().toISOString().split("T")[0];
  }
};

// Check if the key can process a request
appKeySchema.methods.canProcess = function (count = 1) {
  if (!count || count < 1) return false;

  if (
    this.plan.type !== "free" &&
    this.expiresAt &&
    new Date() >= this.expiresAt
  ) {
    this.downgradeToPlan("free");
  }

  this.refreshDailyCredits();

  if (this.plan.type === "subscription") return true;

  if (this.plan.type === "free" || this.plan.type === "credit") {
    return this.credit >= count;
  }

  return false;
};

// Decrease credit (used in processing)
appKeySchema.methods.useCredit = async function (count = 1) {
  if (!this.canProcess(count)) {
    throw new Error("Not enough credit");
  }

  // Ensure we're using a valid count
  count = Math.max(1, parseInt(count) || 1);

  if (this.plan.type === "free" || this.plan.type === "credit") {
    this.credit -= count;
  }

  await this.incrementProcessCount(count);
};

// Increment process counts
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

  // Keep last 3 days only
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

  await this.save();
};

// Calculate remaining credit (for credit plan)
appKeySchema.methods.calculateCredit = function () {
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

export const AppKey = mongoose.model("AppKey", appKeySchema);
