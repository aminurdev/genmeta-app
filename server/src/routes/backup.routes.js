import { Router } from "express";
import {
    getBackupStatus,
    triggerBackup,
    testBackupConnection,
    getBackupHistory,
} from "../controllers/backup.controller.js";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateAndVerifyAdmin);

/**
 * @route GET /api/v1/backup/status
 * @desc Get backup service status and statistics
 * @access Private (Admin)
 */
router.get("/status", getBackupStatus);

/**
 * @route POST /api/v1/backup/trigger
 * @desc Manually trigger database backup (sync main DB to backup DB)
 * @access Private (Admin)
 */
router.post("/trigger", triggerBackup);

/**
 * @route GET /api/v1/backup/test-connection
 * @desc Test backup database connection
 * @access Private (Admin)
 */
router.get("/test-connection", testBackupConnection);

/**
 * @route GET /api/v1/backup/history
 * @desc Get backup history and statistics
 * @access Private (Admin)
 */
router.get("/history", getBackupHistory);

export default router;
