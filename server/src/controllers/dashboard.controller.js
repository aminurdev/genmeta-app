import mongoose from "mongoose";
import { AppUser } from "../models/appUser.model.js";
import { AppPayment } from "../models/appPayment.model.js";
import { ApiUsageLog } from "../models/apiUsageLog.model.js";
import { AppPricing } from "../models/appPricing.model.js";
import { Session } from "../models/session.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/api.error.js";

const DEVICE_REMOVAL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

async function resolvePlanName(plan) {
  const planType = plan?.type || "free";
  const planId = plan?.id || null;
  if (plan?.name) return plan.name;

  if (planId && mongoose.Types.ObjectId.isValid(planId)) {
    const pricingDoc = await AppPricing.findById(planId).select("name").lean();
    if (pricingDoc?.name) {
      return pricingDoc.name;
    }
  }

  if (planType === "subscription") return "Subscription";
  if (planType === "credit") return "Credit Pack";
  return "Free Tier";
}

function toUtcDateKey(date) {
  return new Date(date).toISOString().split("T")[0];
}

function toUtcMonthKey(date) {
  return new Date(date).toISOString().slice(0, 7);
}

function getMapCount(mapOrObj, key) {
  if (!mapOrObj) return 0;
  if (typeof mapOrObj.get === "function") {
    return Number(mapOrObj.get(key)) || 0;
  }
  return Number(mapOrObj[key]) || 0;
}

export const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();

  const last7DateKeys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (6 - i))
    );
    return toUtcDateKey(d);
  });

  const last6MonthKeys = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1)
    );
    return toUtcMonthKey(d);
  });

  const [appUser, user, paymentStats, dailyUsageLogs, monthlyUsageLogs] = await Promise.all([
    AppUser.findOne({ userId }),
    User.findById(userId).select("name email isVerified loginProvider avatar role createdAt"),
    AppPayment.aggregate([
      { $match: { userId } },
      {
        $facet: {
          totalSpent: [
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
              },
            },
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                trxID: 1,
                plan: 1,
                amount: 1,
                status: 1,
                createdAt: 1,
                source: { $literal: "payment" },
              },
            },
          ],
        },
      },
    ]),
    ApiUsageLog.find({
      userId,
      date: { $in: last7DateKeys },
    })
      .select("date processCount fileCount")
      .lean(),
    ApiUsageLog.aggregate([
      {
        $match: {
          userId,
          date: { $gte: `${last6MonthKeys[0]}-01` },
        },
      },
      {
        $group: {
          _id: { $substrBytes: ["$date", 0, 7] },
          count: {
            $sum: {
              $cond: [{ $gt: ["$fileCount", 0] }, "$fileCount", "$processCount"],
            },
          },
        },
      },
    ]),
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Refresh app account state (sync devices, refresh daily free credits, auto-downgrade expired plans)
  if (appUser) {
    appUser.syncDevicesList();
    if (appUser.isActive && appUser.status === "active") {
      appUser.isValid();
      appUser.calculateCredit();
    }
    if (appUser.isModified()) {
      await appUser.save();
    }
  }

  const planType = appUser?.plan?.type || "free";
  const planId = appUser?.plan?.id || null;
  const planName = await resolvePlanName(appUser?.plan);

  const totalSpent = paymentStats[0]?.totalSpent[0]?.total || 0;
  const recentPayments = paymentStats[0]?.recent || [];

  const dailyLogMap = new Map();
  for (const log of dailyUsageLogs || []) {
    const count =
      log.fileCount && log.fileCount > 0 ? log.fileCount : log.processCount || 0;
    dailyLogMap.set(log.date, count);
  }

  const monthlyLogMap = new Map();
  for (const row of monthlyUsageLogs || []) {
    if (row?._id) {
      monthlyLogMap.set(row._id, row.count || 0);
    }
  }

  const last7DaysProcess = last7DateKeys.map((date) => ({
    date,
    count: Math.max(getMapCount(appUser?.dailyProcess, date), dailyLogMap.get(date) || 0),
  }));

  const last6MonthProcess = last6MonthKeys.map((month) => ({
    month,
    count: Math.max(getMapCount(appUser?.monthlyProcess, month), monthlyLogMap.get(month) || 0),
  }));

  const todayProcess = last7DaysProcess[last7DaysProcess.length - 1]?.count || 0;
  const currentMonthProcess = last6MonthProcess[last6MonthProcess.length - 1]?.count || 0;
  const totalProcess = Math.max(appUser?.totalProcess || 0, currentMonthProcess, todayProcess);

  const remainingDays = appUser?.expiresAt
    ? Math.max(0, Math.ceil((new Date(appUser.expiresAt) - now) / (1000 * 60 * 60 * 24)))
    : null;

  const rawCredit = appUser ? appUser.credit : 0;
  const creditValue =
    rawCredit === Infinity || rawCredit === null ? null : rawCredit ?? 0;

  const formattedDevices = appUser ? appUser.getFormattedDevices() : [];
  const deviceRemoval = appUser
    ? appUser.getDeviceRemovalStatus(now)
    : {
        canRemoveDevice: true,
        lastDeviceRemovalAt: null,
        nextDeviceRemovalAt: null,
        remainingMs: 0,
      };

  const recentHistory = recentPayments.map((p) => ({
    _id: p._id,
    trxID: p.trxID,
    plan: {
      id: p.plan?.id || p.plan?._id || "",
      type: p.plan?.type || "subscription",
      name: p.plan?.name || undefined,
    },
    amount: p.amount || 0,
    status: p.status || "Completed",
    createdAt: p.createdAt,
    source: "payment",
  }));

  return new ApiResponse(200, true, "Overview data retrieved", {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      avatar: user.avatar,
      role: user.role,
      loginProvider: user.loginProvider,
      createdAt: user.createdAt,
    },
    plan: {
      type: planType,
      id: planId,
      name: planName,
    },
    credit: creditValue,
    remainingDays,
    totalSpent,
    totalProcess,
    todayProcess,
    currentMonthProcess,
    last6MonthProcess,
    last7DaysProcess,
    recentHistory,
    appUser: {
      exists: Boolean(appUser),
      totalProcess,
      todayUsage: todayProcess,
      thisMonthUsage: currentMonthProcess,
      last6MonthProcess,
      last7DaysProcess,
      creditRemaining: creditValue,
      planType,
      planId,
      planName,
      expiresAt: appUser?.expiresAt || null,
      daysLeft: remainingDays,
      isActive: appUser ? Boolean(appUser.isActive) : true,
      status: appUser?.status || "active",
      isSuspended: appUser?.status === "suspended",
      isManuallyDisabled: appUser ? !appUser.isActive : false,
      devices: formattedDevices,
      maxDevices: appUser?.maxDevices || 2,
      deviceRemoval,
    },
  }).send(res);
});

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();

  const [user, appUser, activeSessionsCount] = await Promise.all([
    User.findById(userId)
      .select(
        "name email avatar loginProvider isVerified isDisabled role createdAt updatedAt lastLoginAt passwordChangedAt referred password"
      )
      .populate("referred", "referralCode"),
    AppUser.findOne({ userId }),
    Session.countDocuments({
      userId,
      revokedAt: null,
      expiresAt: { $gt: now },
    }),
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const hasPassword = Boolean(user.password);

  if (appUser) {
    appUser.syncDevicesList();
    if (appUser.isActive && appUser.status === "active") {
      appUser.isValid();
      appUser.calculateCredit();
    }
    if (appUser.isModified()) {
      await appUser.save();
    }
  }

  let formattedAppUser = null;
  if (appUser) {
    const planType = appUser.plan?.type || "free";
    const planId = appUser.plan?.id || null;
    const planName = await resolvePlanName(appUser.plan);
    const remainingDays = appUser.expiresAt
      ? Math.max(0, Math.ceil((new Date(appUser.expiresAt) - now) / (1000 * 60 * 60 * 24)))
      : null;
    const rawCredit = appUser.credit;
    const creditValue =
      rawCredit === Infinity || rawCredit === null ? null : rawCredit ?? 0;

    formattedAppUser = {
      exists: true,
      plan: {
        type: planType,
        id: planId,
        name: planName,
      },
      totalProcess: appUser.totalProcess || 0,
      credit: creditValue,
      isActive: Boolean(appUser.isActive),
      status: appUser.status || "active",
      isSuspended: appUser.status === "suspended",
      expiresAt: appUser.expiresAt || null,
      remainingDays,
      devicesCount: appUser.getFormattedDevices().length,
      maxDevices: appUser.maxDevices || 2,
    };
  }

  const loginProvider =
    Array.isArray(user.loginProvider) && user.loginProvider.length > 0
      ? user.loginProvider
      : ["email"];

  return new ApiResponse(200, true, "Profile retrieved successfully", {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      loginProvider,
      hasPassword,
      isVerified: Boolean(user.isVerified),
      isDisabled: Boolean(user.isDisabled),
      role: user.role,
      lastLoginAt: user.lastLoginAt || null,
      passwordChangedAt: user.passwordChangedAt || null,
      referredBy: user.referred?.referralCode || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    appUser: formattedAppUser,
    security: {
      activeSessionsCount,
      hasPassword,
      passwordChangedAt: user.passwordChangedAt || null,
      lastLoginAt: user.lastLoginAt || null,
    },
  }).send(res);
});

export const removeDesktopDevice = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const rawDeviceId = req.params.deviceId || "";
  let targetDeviceId = rawDeviceId;
  try {
    targetDeviceId = decodeURIComponent(rawDeviceId).trim();
  } catch {
    targetDeviceId = rawDeviceId.trim();
  }

  if (!targetDeviceId) {
    throw new ApiError(400, "Device ID is required.");
  }

  const appUser = await AppUser.findOne({ userId });
  if (!appUser) {
    throw new ApiError(404, "Desktop account not found.");
  }

  appUser.syncDevicesList();
  const targetExists = appUser.devices.some((d) => d.deviceId === targetDeviceId);
  if (!targetExists) {
    throw new ApiError(404, "Desktop device not found on your account.");
  }

  const now = new Date();
  const removalStatus = appUser.getDeviceRemovalStatus(now);
  if (!removalStatus.canRemoveDevice) {
    const hoursLeft = Math.max(1, Math.ceil(removalStatus.remainingMs / (1000 * 60 * 60)));
    throw new ApiError(
      429,
      `You can only remove 1 desktop device per 24 hours. Please try again in about ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}.`,
      [],
      "",
      {
        code: "DEVICE_REMOVAL_DAILY_LIMIT",
        data: { deviceRemoval: removalStatus },
      }
    );
  }

  const nextDevices = appUser.devices.filter((d) => d.deviceId !== targetDeviceId);
  const nextAllowedDevices = nextDevices.map((d) => d.deviceId);
  const cooldownCutoff = new Date(now.getTime() - DEVICE_REMOVAL_COOLDOWN_MS);

  const updated = await AppUser.findOneAndUpdate(
    {
      _id: appUser._id,
      $or: [
        { lastDeviceRemovalAt: null },
        { lastDeviceRemovalAt: { $exists: false } },
        { lastDeviceRemovalAt: { $lte: cooldownCutoff } },
      ],
    },
    {
      $set: {
        devices: nextDevices,
        allowedDevices: nextAllowedDevices,
        lastDeviceRemovalAt: now,
      },
    },
    { new: true }
  );

  if (!updated) {
    const latestDoc = await AppUser.findById(appUser._id);
    const latestStatus = latestDoc
      ? latestDoc.getDeviceRemovalStatus(new Date())
      : removalStatus;
    throw new ApiError(
      429,
      "You can only remove 1 desktop device per 24 hours.",
      [],
      "",
      {
        code: "DEVICE_REMOVAL_DAILY_LIMIT",
        data: { deviceRemoval: latestStatus },
      }
    );
  }

  return new ApiResponse(200, true, "Desktop device removed successfully.", {
    removedDeviceId: targetDeviceId,
    devices: updated.getFormattedDevices(),
    maxDevices: updated.maxDevices || 2,
    deviceRemoval: updated.getDeviceRemovalStatus(now),
  }).send(res);
});
