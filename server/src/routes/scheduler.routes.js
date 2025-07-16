import { Router } from "express";
import {
  getSchedulerStatus,
  triggerMaintenance,
  startScheduler,
  stopScheduler,
  scheduleOneTimeMaintenance,
  getMaintenanceStats,
} from "../controllers/scheduler.controller.js";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateAndVerifyAdmin);

// Note: These routes should be restricted to admin users only
// You may want to add an additional admin middleware here

/**
 * @route GET /api/scheduler/status
 * @desc Get scheduler status and statistics
 * @access Private (Admin)
 */
router.get("/status", getSchedulerStatus);

/**
 * @route POST /api/scheduler/trigger
 * @desc Manually trigger daily maintenance
 * @access Private (Admin)
 */
router.post("/trigger", triggerMaintenance);

/**
 * @route POST /api/scheduler/start
 * @desc Start the scheduler
 * @access Private (Admin)
 */
router.post("/start", startScheduler);

/**
 * @route POST /api/scheduler/stop
 * @desc Stop the scheduler
 * @access Private (Admin)
 */
router.post("/stop", stopScheduler);

/**
 * @route POST /api/scheduler/schedule-once
 * @desc Schedule a one-time maintenance at specific time
 * @access Private (Admin)
 * @body { scheduledTime: "2024-02-20T12:00:00.000Z" }
 */
router.post("/schedule-once", scheduleOneTimeMaintenance);

/**
 * @route GET /api/scheduler/stats
 * @desc Get maintenance statistics and plan distribution
 * @access Private (Admin)
 */
router.get("/stats", getMaintenanceStats);

export default router;
