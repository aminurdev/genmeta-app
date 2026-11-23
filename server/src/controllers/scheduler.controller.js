import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/api.error.js";
import schedulerService from "../services/scheduler.service.js";
import { AppUser } from "../models/appUser.model.js";

function setNoStoreHeaders(res) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
}

/**
 * Get scheduler status and statistics
 */
const getSchedulerStatus = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const refreshed = req.query.refresh === "true";
  const status = schedulerService.getStatus();

  return new ApiResponse(200, true, "Scheduler status retrieved successfully", {
    ...status,
    meta: {
      generatedAt: new Date().toISOString(),
      refreshed,
    },
  }).send(res);
});

/**
 * Manually trigger daily maintenance
 */
const triggerMaintenance = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const result = await schedulerService.runDailyMaintenance();

  if (result.success) {
    return new ApiResponse(
      200,
      true,
      "Daily maintenance completed successfully",
      result
    ).send(res);
  }

  throw new ApiError(500, result?.error || "Daily maintenance failed");
});

/**
 * Start the scheduler
 */
const startScheduler = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  schedulerService.start();
  const status = schedulerService.getStatus();

  return new ApiResponse(200, true, "Scheduler started successfully", {
    isRunning: status.isRunning,
    status,
  }).send(res);
});

/**
 * Stop the scheduler
 */
const stopScheduler = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  schedulerService.stop();
  const status = schedulerService.getStatus();

  return new ApiResponse(200, true, "Scheduler stopped successfully", {
    isRunning: status.isRunning,
    status,
  }).send(res);
});

/**
 * Schedule a one-time maintenance at a specific time
 */
const scheduleOneTimeMaintenance = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const { scheduledTime } = req.body;

  if (!scheduledTime) {
    throw new ApiError(400, "Scheduled time is required");
  }

  const scheduledDate = new Date(scheduledTime);

  if (isNaN(scheduledDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  if (scheduledDate <= new Date()) {
    throw new ApiError(400, "Scheduled time must be in the future");
  }

  schedulerService.scheduleOneTime(scheduledDate);

  return new ApiResponse(
    200,
    true,
    "One-time maintenance scheduled successfully",
    {
      scheduledTime: scheduledDate.toISOString(),
      message: `Maintenance will run at ${scheduledDate.toISOString()}`,
    }
  ).send(res);
});

/**
 * Get maintenance statistics and plan distribution
 */
const getMaintenanceStats = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const refreshed = req.query.refresh === "true";
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const [
    planStats,
    freeUsersNeedingRefresh,
    expiredSubscriptions,
    zeroCreditPlans,
    expiredCreditPlans,
  ] = await Promise.all([
    AppUser.aggregate([
      {
        $match: {
          isActive: true,
          status: "active",
        },
      },
      {
        $group: {
          _id: "$plan.type",
          count: { $sum: 1 },
          totalCredits: { $sum: "$credit" },
          avgCredits: { $avg: "$credit" },
        },
      },
      { $sort: { count: -1 } },
    ]),
    AppUser.countDocuments({
      "plan.type": "free",
      isActive: true,
      status: "active",
      credit: { $lt: 5 },
      lastCreditRefresh: { $ne: today },
    }),
    AppUser.countDocuments({
      "plan.type": "subscription",
      isActive: true,
      status: "active",
      expiresAt: { $lte: now },
    }),
    AppUser.countDocuments({
      "plan.type": "credit",
      isActive: true,
      status: "active",
      credit: { $lte: 0 },
    }),
    AppUser.countDocuments({
      "plan.type": "credit",
      isActive: true,
      status: "active",
      credit: { $gt: 0 },
      expiresAt: { $lte: now },
    }),
  ]);

  const schedulerStatus = schedulerService.getStatus();
  const totalNeeded =
    freeUsersNeedingRefresh +
    expiredSubscriptions +
    zeroCreditPlans +
    expiredCreditPlans;

  const stats = {
    planDistribution: planStats,
    maintenanceNeeded: {
      freeUsersNeedingRefresh,
      expiredSubscriptions,
      zeroCreditPlans,
      expiredCreditPlans,
      total: totalNeeded,
    },
    scheduler: schedulerStatus,
    lastChecked: now.toISOString(),
    meta: {
      generatedAt: now.toISOString(),
      refreshed,
    },
  };

  return new ApiResponse(
    200,
    true,
    "Maintenance statistics retrieved successfully",
    stats
  ).send(res);
});

export {
  getSchedulerStatus,
  triggerMaintenance,
  startScheduler,
  stopScheduler,
  scheduleOneTimeMaintenance,
  getMaintenanceStats,
};
