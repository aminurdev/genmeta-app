import cron from "node-cron";
import { CronExpressionParser } from "cron-parser";
import config from "../config/index.js";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  PLAN_TYPES,
} from "../constants/index.js";
import { AppUser } from "../models/appUser.model.js";
import backupService from "./backup.service.js";
import paymentService from "./payment/payment.service.js";
import notificationService from "./notification/notification.service.js";

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
    this.paymentReconcileCronExpression =
      config.paystation?.reconcile_cron || "*/10 * * * *";
    this.dailyMaintenanceJob = null;
    this.weeklyBackupJob = null;
    this.paymentReconciliationJob = null;
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
    this.paymentReconciliationStats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastRun: null,
      lastResult: null,
    };
  }

  /**
   * Start the daily maintenance scheduler and weekly backup scheduler
   */
  start() {
    if (this.isRunning) {
      console.log("⚠ Scheduler already running");
      return;
    }

    this.dailyMaintenanceJob = cron.schedule(
      this.cronExpression,
      async () => {
        await this.runDailyMaintenance();
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

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

    this.paymentReconciliationJob = cron.schedule(
      this.paymentReconcileCronExpression,
      async () => {
        await this.runPaymentReconciliation();
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

    this.isRunning = true;
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

    if (this.paymentReconciliationJob) {
      this.paymentReconciliationJob.stop();
    }

    this.isRunning = false;
    console.log("✓ Scheduler stopped");
  }

  /**
   * Send 3-day and 1-day plan expiry reminders without duplicating notifications.
   */
  async sendPlanExpiryReminders() {
    try {
      const now = new Date();
      const inThreeAndHalfDays = new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000);

      const expiringAppUsers = await AppUser.find({
        "plan.type": { $in: [PLAN_TYPES.SUBSCRIPTION, PLAN_TYPES.CREDIT] },
        isActive: true,
        status: "active",
        expiresAt: { $gt: now, $lte: inThreeAndHalfDays },
      })
        .select("userId plan expiresAt")
        .lean();

      for (const appUser of expiringAppUsers) {
        if (!appUser.userId || !appUser.expiresAt) continue;
        const expiryDate = new Date(appUser.expiresAt);
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        const threshold = daysLeft <= 1 ? 1 : daysLeft <= 3 ? 3 : null;
        if (!threshold) continue;

        const expiryIsoDate = expiryDate.toISOString().split("T")[0];
        const planName = appUser.plan?.name || appUser.plan?.type || "GenMeta Plan";

        await notificationService.notifyUser({
          recipientId: appUser.userId,
          type: "plan.expiring_soon",
          category: NOTIFICATION_CATEGORIES.PLAN,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          sendEmail: true,
          title:
            threshold === 1
              ? `Your ${planName} expires tomorrow`
              : `Your ${planName} expires in ${threshold} days`,
          message: `Your ${planName} is scheduled to expire on ${expiryIsoDate}. Renew early to avoid interruption in desktop app processing.`,
          actionUrl: "/pricing",
          actionLabel: "Renew Plan",
          dedupeKey: `plan_expiring:${appUser.userId}:${expiryIsoDate}:${threshold}d`,
          metadata: {
            planType: appUser.plan?.type,
            planName,
            expiresAt: expiryDate.toISOString(),
            daysLeft: threshold,
          },
        });
      }
    } catch (err) {
      console.error("[SchedulerService] Expiry reminder error:", err?.message || err);
    }
  }

  /**
   * Run daily maintenance manually
   */
  async runDailyMaintenance() {
    const startTime = new Date();
    console.log(`→ Daily maintenance started`);

    try {
      this.stats.totalRuns++;

      const result = await AppUser.performDailyMaintenance();

      if (result.success) {
        this.stats.successfulRuns++;
        console.log(`✓ Daily maintenance completed`);

        const today = startTime.toISOString().split("T")[0];
        if (Array.isArray(result.downgradedUsers) && result.downgradedUsers.length > 0) {
          Promise.allSettled(
            result.downgradedUsers.map((entry) => {
              const reasonLabel =
                entry.reason === "zero_credit_auto"
                  ? "all credits were used"
                  : "the plan period ended";
              return notificationService.notifyUser({
                recipientId: entry.userId,
                type: "plan.downgraded",
                category: NOTIFICATION_CATEGORIES.PLAN,
                priority: NOTIFICATION_PRIORITIES.HIGH,
                sendEmail: true,
                title: "Plan Downgraded to Free Tier",
                message: `Your ${entry.planName || entry.planType} has moved to the Free Tier because ${reasonLabel}. You continue to receive 5 daily free credits.`,
                actionUrl: "/pricing",
                actionLabel: "Upgrade Plan",
                dedupeKey: `plan_downgraded:${entry.userId}:${today}:${entry.reason}`,
                metadata: entry,
              });
            })
          ).catch(() => {});
        }

        await this.sendPlanExpiryReminders();
      } else {
        this.stats.failedRuns++;
        console.error("✗ Daily maintenance failed:", result);
        notificationService
          .notifyAdmins({
            superAdminOnly: true,
            type: "system.maintenance_failed",
            category: NOTIFICATION_CATEGORIES.SYSTEM,
            priority: NOTIFICATION_PRIORITIES.URGENT,
            forceDeliver: true,
            sendEmail: true,
            title: "Daily Maintenance Job Failed",
            message: `Scheduled daily maintenance returned an error: ${result.error || "Unknown failure"}`,
            actionUrl: "/admin/scheduler",
            actionLabel: "Open Scheduler",
          })
          .catch(() => {});
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

      notificationService
        .notifyAdmins({
          superAdminOnly: true,
          type: "system.maintenance_error",
          category: NOTIFICATION_CATEGORIES.SYSTEM,
          priority: NOTIFICATION_PRIORITIES.URGENT,
          forceDeliver: true,
          sendEmail: true,
          title: "Daily Maintenance Exception",
          message: `Daily maintenance crashed with error: ${error.message}`,
          actionUrl: "/admin/scheduler",
          actionLabel: "Open Scheduler",
        })
        .catch(() => {});

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

      const result = await backupService.performBackup();

      if (result.success) {
        this.backupStats.successfulBackups++;
        console.log(`✓ Weekly backup completed`);
        notificationService
          .notifyAdmins({
            superAdminOnly: true,
            type: "system.backup_completed",
            category: NOTIFICATION_CATEGORIES.SYSTEM,
            priority: NOTIFICATION_PRIORITIES.LOW,
            title: "Weekly Database Backup Completed",
            message: `Synced ${result.totalDocuments || 0} documents across ${result.collections?.successful || 0} collections in ${result.duration || "0ms"}.`,
            actionUrl: "/admin/backup",
            actionLabel: "View Backup Logs",
          })
          .catch(() => {});
      } else {
        this.backupStats.failedBackups++;
        console.error("✗ Weekly backup failed:", result);
        notificationService
          .notifyAdmins({
            superAdminOnly: true,
            type: "system.backup_failed",
            category: NOTIFICATION_CATEGORIES.SYSTEM,
            priority: NOTIFICATION_PRIORITIES.URGENT,
            forceDeliver: true,
            sendEmail: true,
            title: "Weekly Database Backup Failed",
            message: `Database backup encountered errors: ${result.error || result.message || "Unknown backup error"}`,
            actionUrl: "/admin/backup",
            actionLabel: "Inspect Backups",
          })
          .catch(() => {});
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

      notificationService
        .notifyAdmins({
          superAdminOnly: true,
          type: "system.backup_error",
          category: NOTIFICATION_CATEGORIES.SYSTEM,
          priority: NOTIFICATION_PRIORITIES.URGENT,
          forceDeliver: true,
          sendEmail: true,
          title: "Weekly Database Backup Exception",
          message: `Weekly backup threw an unhandled error: ${error.message}`,
          actionUrl: "/admin/backup",
          actionLabel: "Inspect Backups",
        })
        .catch(() => {});

      return errorResult;
    }
  }

  /**
   * Reconcile pending PayStation transactions
   */
  async runPaymentReconciliation() {
    const startTime = new Date();
    try {
      this.paymentReconciliationStats.totalRuns++;
      const result = await paymentService.reconcilePendingTransactions();
      this.paymentReconciliationStats.successfulRuns++;
      this.paymentReconciliationStats.lastRun = startTime;
      this.paymentReconciliationStats.lastResult = result;
      if (result.completed > 0 || result.errors > 0) {
        console.log("✓ PayStation reconciliation sweep:", result);
      }
      return result;
    } catch (error) {
      this.paymentReconciliationStats.failedRuns++;
      const errorResult = {
        success: false,
        error: error.message,
        timestamp: startTime.toISOString(),
      };
      this.paymentReconciliationStats.lastRun = startTime;
      this.paymentReconciliationStats.lastResult = errorResult;
      console.error("✗ PayStation reconciliation error:", error.message);
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
    let nextPaymentReconcile = null;

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

    if (this.isRunning && this.paymentReconcileCronExpression) {
      try {
        const reconcileInterval = CronExpressionParser.parse(
          this.paymentReconcileCronExpression,
          { tz: "UTC" }
        );
        nextPaymentReconcile = reconcileInterval.next().toISOString();
      } catch (error) {
        console.error("Error calculating next reconciliation time:", error);
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
      paymentReconciliation: {
        lastRun: this.paymentReconciliationStats.lastRun,
        nextRun: nextPaymentReconcile,
        cronExpression: this.paymentReconcileCronExpression || "*/10 * * * *",
        stats: this.paymentReconciliationStats,
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
        oneTimeJob.stop();
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

const schedulerService = new SchedulerService();
export default schedulerService;
export { SchedulerService };
