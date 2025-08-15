import cron from "node-cron";
import { CronExpressionParser } from "cron-parser";
import { AppKey } from "../models/appKey.model.js";

/**
 * Scheduler Service for Automatic Daily Maintenance
 * Runs daily at 12:00 AM (midnight) to:
 * 1. Refresh free plan credits
 * 2. Downgrade expired subscriptions
 * 3. Downgrade zero credit plans
 */
class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.cronExpression = "0 0 * * *"; // Daily at midnight UTC
    this.dailyMaintenanceJob = null;
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastResult: null,
    };
  }

  /**
   * Start the daily maintenance scheduler
   * Runs every day at 12:00 AM (00:00)
   */
  start() {
    if (this.isRunning) {
      console.log("Scheduler is already running");
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
      this.isRunning = false;
      console.log("Daily maintenance scheduler stopped");
    }
  }

  /**
   * Run daily maintenance manually
   */
  async runDailyMaintenance() {
    const startTime = new Date();
    console.log(`Starting daily maintenance at ${startTime.toISOString()}`);

    try {
      this.stats.totalRuns++;

      // Execute the daily maintenance
      const result = await AppKey.performDailyMaintenance();

      if (result.success) {
        this.stats.successfulRuns++;
      } else {
        this.stats.failedRuns++;
        console.error("Daily maintenance failed:", result);
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
      console.error("Daily maintenance error:", error);

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

    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: nextRun,
      cronExpression: this.cronExpression || "0 0 * * *",
      timezone: "UTC",
      stats: this.stats,
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

    console.log(
      `One-time maintenance scheduled for ${scheduledTime.toISOString()}`
    );
    return oneTimeJob;
  }
}

// Create and export singleton instance
const schedulerService = new SchedulerService();
export default schedulerService;

// Export the class for testing purposes
export { SchedulerService };
