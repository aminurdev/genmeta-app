import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/api.error.js";
import schedulerService from "../services/scheduler.service.js";
import { AppKey } from "../models/appKey.model.js";

/**
 * Get scheduler status and statistics
 */
const getSchedulerStatus = asyncHandler(async (req, res) => {
  const status = schedulerService.getStatus();

  return new ApiResponse(
    200,
    true,
    "Scheduler status retrieved successfully",
    status
  ).send(res);
});

/**
 * Manually trigger daily maintenance
 */
const triggerMaintenance = asyncHandler(async (req, res) => {
  const result = await schedulerService.runDailyMaintenance();

  if (result.success) {
    return new ApiResponse(
      200,
      true,
      "Daily maintenance completed successfully",
      result
    ).send(res);
  } else {
    throw new ApiError(500, "Daily maintenance failed", result);
  }
});

/**
 * Start the scheduler
 */
const startScheduler = asyncHandler(async (req, res) => {
  schedulerService.start();

  return new ApiResponse(200, true, "Scheduler started successfully", {
    isRunning: schedulerService.getStatus().isRunning,
  }).send(res);
});

/**
 * Stop the scheduler
 */
const stopScheduler = asyncHandler(async (req, res) => {
  schedulerService.stop();

  return new ApiResponse(200, true, "Scheduler stopped successfully", {
    isRunning: schedulerService.getStatus().isRunning,
  }).send(res);
});

/**
 * Schedule a one-time maintenance at a specific time
 */
const scheduleOneTimeMaintenance = asyncHandler(async (req, res) => {
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
  const today = new Date().toISOString().split("T")[0];

  // Get plan distribution
  const planStats = await AppKey.aggregate([
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
  ]);

  // Get users that need maintenance
  const freeUsersNeedingRefresh = await AppKey.countDocuments({
    "plan.type": "free",
    isActive: true,
    status: "active",
    lastCreditRefresh: { $ne: today },
  });

  const expiredSubscriptions = await AppKey.countDocuments({
    "plan.type": "subscription",
    isActive: true,
    status: "active",
    expiresAt: { $lte: new Date() },
  });

  const zeroCreditPlans = await AppKey.countDocuments({
    "plan.type": "credit",
    isActive: true,
    status: "active",
    credit: { $lte: 0 },
  });

  const schedulerStatus = schedulerService.getStatus();

  const stats = {
    planDistribution: planStats,
    maintenanceNeeded: {
      freeUsersNeedingRefresh,
      expiredSubscriptions,
      zeroCreditPlans,
      total: freeUsersNeedingRefresh + expiredSubscriptions + zeroCreditPlans,
    },
    scheduler: schedulerStatus,
    lastChecked: new Date().toISOString(),
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
