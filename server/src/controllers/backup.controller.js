import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/api.error.js";
import backupService from "../services/backup.service.js";
import schedulerService from "../services/scheduler.service.js";

/**
 * Get backup service status and statistics
 */
const getBackupStatus = asyncHandler(async (req, res) => {
    try {
        const status = backupService.getStatus();
        const schedulerStatus = schedulerService.getStatus();

        // Format the response to match frontend expectations
        const formattedStatus = {
            lastBackup: status.stats.lastBackupResult ? {
                timestamp: status.stats.lastBackupResult.timestamp,
                success: status.stats.lastBackupResult.success,
                duration: status.stats.lastBackupResult.duration || 'N/A',
                collections: status.stats.lastBackupResult.collections || {
                    total: 0,
                    successful: 0,
                    failed: 0,
                },
                totalDocuments: status.stats.lastBackupResult.totalDocuments || 0,
                error: status.stats.lastBackupResult.error || null,
            } : null,
            nextScheduledBackup: schedulerStatus.backup?.nextBackup || null,
            totalBackups: status.stats.totalBackups,
            successfulBackups: status.stats.successfulBackups,
            failedBackups: status.stats.failedBackups,
        };

        return new ApiResponse(
            200,
            true,
            "Backup status retrieved successfully",
            formattedStatus
        ).send(res);
    } catch (error) {
        return new ApiResponse(
            200,
            true,
            "Backup status retrieved successfully",
            {
                lastBackup: null,
                nextScheduledBackup: null,
                totalBackups: 0,
                successfulBackups: 0,
                failedBackups: 0,
            }
        ).send(res);
    }
});

/**
 * Manually trigger database backup
 * Syncs all data from main database to backup database
 */
const triggerBackup = asyncHandler(async (req, res) => {
    try {
        const result = await backupService.performBackup();

        if (result.success) {
            return new ApiResponse(
                200,
                true,
                "Database backup completed successfully",
                result
            ).send(res);
        } else {
            return new ApiResponse(
                200,
                false,
                result.message || "Database backup failed",
                result
            ).send(res);
        }
    } catch (error) {
        return new ApiResponse(
            200,
            false,
            error.message || "Database backup failed",
            {
                success: false,
                error: error.message,
                message: error.message,
            }
        ).send(res);
    }
});

/**
 * Test backup database connection
 */
const testBackupConnection = asyncHandler(async (req, res) => {
    try {
        const result = await backupService.testConnection();

        if (result.success) {
            return new ApiResponse(
                200,
                true,
                "Backup database connection test successful",
                result
            ).send(res);
        } else {
            return new ApiResponse(
                200,
                false,
                result.message || "Backup database connection test failed",
                result
            ).send(res);
        }
    } catch (error) {
        return new ApiResponse(
            200,
            false,
            error.message || "Backup database connection test failed",
            {
                success: false,
                message: error.message,
                error: error.message,
            }
        ).send(res);
    }
});

/**
 * Get backup history and statistics
 * Returns an array of backup records (currently only the last backup)
 */
const getBackupHistory = asyncHandler(async (req, res) => {
    try {
        const status = backupService.getStatus();

        // Convert last backup result to array format expected by frontend
        const history = [];

        if (status.stats.lastBackupResult) {
            const lastBackup = status.stats.lastBackupResult;
            history.push({
                _id: lastBackup.timestamp, // Use timestamp as ID
                timestamp: lastBackup.timestamp,
                success: lastBackup.success,
                duration: lastBackup.duration || 'N/A',
                collections: lastBackup.collections || {
                    total: 0,
                    successful: 0,
                    failed: 0,
                },
                totalDocuments: lastBackup.totalDocuments || 0,
                triggeredBy: 'manual', // Default to manual since we don't track this yet
                error: lastBackup.error || null,
            });
        }

        return new ApiResponse(
            200,
            true,
            "Backup history retrieved successfully",
            history
        ).send(res);
    } catch (error) {
        return new ApiResponse(
            200,
            true,
            "Backup history retrieved successfully",
            []
        ).send(res);
    }
});

export {
    getBackupStatus,
    triggerBackup,
    testBackupConnection,
    getBackupHistory,
};
