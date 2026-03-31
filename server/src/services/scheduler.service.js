import cron from "node-cron";
import { CronExpressionParser } from "cron-parser";
import { AppKey } from "../models/appKey.model.js";
import backupService from "./backup.service.js";

/**
 * Scheduler Service for Automatic Daily Maintenance and Backups
 * Runs daily at 12:00 AM (midnight) to:
 * 1. Refresh free plan credits
 * 2. Downgrade expired subscriptions
 * 3. Downgrade zero credit plans
 * 
 * Runs weekly backup every Friday at 12:00 PM (noon)
 */
class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.cronExpression = "0 0 * * *"; // Daily at midnight UTC
    this.backupCronExpression = "0 12 * * 5"; // Every Friday at 12:00 PM UTC
    this.dailyMaintenanceJob = null;
    this.weeklyBackupJob = null;
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastResult: null,
    };
    this.backupStats = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      lastBackup: null,
      lastBackupResult: null,
    };
  }

  /**
   * Start the daily maintenance scheduler and weekly backup scheduler
   * Daily maintenance runs every day at 12:00 AM (00:00)
   * Weekly backup runs every Friday at 12:00 PM (noon)
   */
  start() {
    if (this.isRunning) {
      console.log("⚠ Scheduler already running");
      return;
    }

    // Schedule daily maintenance at 12:00 AM
    this.dailyMaintenanceJob = cron.schedule(
      this.cronExpression,
      async () => {
        await this.runDailyMaintenance();
      },
      {
        scheduled: true,
        timezone: "UTC", // Use UTC timezone for consistency
      }
    );

    // Schedule weekly backup every Friday at 12:00 PM
    this.weeklyBackupJob = cron.schedule(
      this.backupCronExpression,
      async () => {
        await this.runWeeklyBackup();
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

    this.isRunning = true;

    // Optional: Run maintenance immediately on startup if it hasn't run today
    this.checkAndRunIfNeeded();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.dailyMaintenanceJob) {
      this.dailyMaintenanceJob.stop();
    }

    if (this.weeklyBackupJob) {
      this.weeklyBackupJob.stop();
    }

    this.isRunning = false;
    console.log("✓ Scheduler stopped");
  }

  /**
   * Run daily maintenance manually
   */
  async runDailyMaintenance() {
    const startTime = new Date();
    console.log(`→ Daily maintenance started`);

    try {
      this.stats.totalRuns++;

      // Execute the daily maintenance
      const result = await AppKey.performDailyMaintenance();

      if (result.success) {
        this.stats.successfulRuns++;
        console.log(`✓ Daily maintenance completed`);
      } else {
        this.stats.failedRuns++;
        console.error("✗ Daily maintenance failed:", result);
      }

      this.lastRun = startTime;
      this.stats.lastResult = result;

      return result;
    } catch (error) {
      this.stats.failedRuns++;
      const errorResult = {
        success: false,
        error: error.message,
        timestamp: startTime.toISOString(),
      };

      this.stats.lastResult = errorResult;
      console.error("✗ Daily maintenance error:", error.message);

      return errorResult;
    }
  }

  /**
   * Run weekly backup (every Friday at 12:00 PM)
   */
  async runWeeklyBackup() {
    const startTime = new Date();
    console.log(`→ Weekly backup started`);

    try {
      this.backupStats.totalBackups++;

      // Execute the backup
      const result = await backupService.performBackup();

      if (result.success) {
        this.backupStats.successfulBackups++;
        console.log(`✓ Weekly backup completed`);
      } else {
        this.backupStats.failedBackups++;
        console.error("✗ Weekly backup failed:", result);
      }

      this.backupStats.lastBackup = startTime;
      this.backupStats.lastBackupResult = result;

      return result;
    } catch (error) {
      this.backupStats.failedBackups++;
      const errorResult = {
        success: false,
        error: error.message,
        timestamp: startTime.toISOString(),
      };

      this.backupStats.lastBackupResult = errorResult;
      console.error("✗ Weekly backup error:", error.message);

      return errorResult;
    }
  }

  /**
   * Check if maintenance has run today, if not run it
   */
  async checkAndRunIfNeeded() {
    const today = new Date().toISOString().split("T")[0];
    const lastRunDate = this.lastRun
      ? this.lastRun.toISOString().split("T")[0]
      : null;

    if (lastRunDate !== today) {
      await this.runDailyMaintenance();
    }
  }

  /**
   * Get scheduler status and statistics
   */
  getStatus() {
    let nextRun = null;
    let nextBackup = null;

    if (this.isRunning && this.cronExpression) {
      try {
        const interval = CronExpressionParser.parse(this.cronExpression, {
          tz: "UTC",
        });
        nextRun = interval.next().toISOString();
      } catch (error) {
        console.error("Error calculating next run time:", error);
      }
    }

    if (this.isRunning && this.backupCronExpression) {
      try {
        const backupInterval = CronExpressionParser.parse(this.backupCronExpression, {
          tz: "UTC",
        });
        nextBackup = backupInterval.next().toISOString();
      } catch (error) {
        console.error("Error calculating next backup time:", error);
      }
    }

    return {
      isRunning: this.isRunning,
      maintenance: {
        lastRun: this.lastRun,
        nextRun: nextRun,
        cronExpression: this.cronExpression || "0 0 * * *",
        stats: this.stats,
      },
      backup: {
        lastBackup: this.backupStats.lastBackup,
        nextBackup: nextBackup,
        cronExpression: this.backupCronExpression || "0 12 * * 5",
        stats: this.backupStats,
      },
      timezone: "UTC",
    };
  }

  /**
   * Schedule a one-time maintenance run at a specific time
   * @param {Date} scheduledTime - When to run the maintenance
   */
  scheduleOneTime(scheduledTime) {
    const cronExpression = `${scheduledTime.getMinutes()} ${scheduledTime.getHours()} ${scheduledTime.getDate()} ${scheduledTime.getMonth() + 1} *`;

    const oneTimeJob = cron.schedule(
      cronExpression,
      async () => {
        await this.runDailyMaintenance();
        oneTimeJob.stop(); // Stop after running once
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

    console.log(`✓ One-time maintenance scheduled for ${scheduledTime.toISOString()}`);
    return oneTimeJob;
  }
}

// Create and export singleton instance
const schedulerService = new SchedulerService();
export default schedulerService;

// Export the class for testing purposes
export { SchedulerService };
