import cron from "node-cron";
import { AppKey } from "../../models/appKey.model.js";

class PlanManagementSystem {
  constructor() {
    this.isRunning = false;
  }

  // Start the automated system
  start() {
    if (this.isRunning) {
      console.log("Plan management system is already running");
      return;
    }

    console.log("Starting automated plan management system...");

    // Schedule daily tasks at 12:00 AM (00:00)
    cron.schedule("0 0 * * *", async () => {
      console.log("Running daily plan management tasks at 12:00 AM");
      await this.runDailyTasks();
    });

    // Optional: Run every hour to catch expired subscriptions more frequently
    cron.schedule("0 * * * *", async () => {
      console.log("Running hourly subscription expiry check");
      await this.checkExpiredSubscriptions();
    });

    this.isRunning = true;
    console.log("Plan management system started successfully");
  }

  // Stop the system
  stop() {
    this.isRunning = false;
    console.log("Plan management system stopped");
  }

  // Main daily tasks runner
  async runDailyTasks() {
    try {
      console.log("Starting daily plan management tasks...");

      // Run all tasks in parallel for better performance
      const [expiredSubscriptions, expiredCredits, refreshedCredits] =
        await Promise.all([
          this.checkExpiredSubscriptions(),
          this.checkZeroCreditPlans(),
          this.refreshFreePlanCredits(),
        ]);

      console.log("Daily tasks completed:", {
        expiredSubscriptions,
        expiredCredits,
        refreshedCredits,
      });
    } catch (error) {
      console.error("Error in daily tasks:", error);
    }
  }

  // Check and downgrade expired subscriptions
  async checkExpiredSubscriptions() {
    try {
      const now = new Date();

      // Find all subscription plans that have expired
      const expiredSubscriptions = await AppKey.find({
        "plan.type": "subscription",
        expiresAt: { $lte: now },
        isActive: true,
        status: "active",
      });

      console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

      let updatedCount = 0;

      for (const appKey of expiredSubscriptions) {
        try {
          await this.downgradeToPlan(appKey, "free");
          updatedCount++;
          console.log(
            `Downgraded subscription to free plan for user: ${appKey.username}`
          );
        } catch (error) {
          console.error(
            `Error downgrading subscription for ${appKey.username}:`,
            error
          );
        }
      }

      return updatedCount;
    } catch (error) {
      console.error("Error checking expired subscriptions:", error);
      return 0;
    }
  }

  // Check and downgrade zero credit plans
  async checkZeroCreditPlans() {
    try {
      // Find all credit plans with 0 credits
      const zeroCreditPlans = await AppKey.find({
        "plan.type": "credit",
        credit: { $lte: 0 },
        isActive: true,
        status: "active",
      });

      console.log(
        `Found ${zeroCreditPlans.length} credit plans with zero credits`
      );

      let updatedCount = 0;

      for (const appKey of zeroCreditPlans) {
        try {
          await this.downgradeToPlan(appKey, "free");
          updatedCount++;
          console.log(
            `Downgraded credit plan to free plan for user: ${appKey.username}`
          );
        } catch (error) {
          console.error(
            `Error downgrading credit plan for ${appKey.username}:`,
            error
          );
        }
      }

      return updatedCount;
    } catch (error) {
      console.error("Error checking zero credit plans:", error);
      return 0;
    }
  }

  // Refresh daily credits for free plans
  async refreshFreePlanCredits() {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Find all free plans that need credit refresh
      const freePlans = await AppKey.find({
        "plan.type": "free",
        isActive: true,
        status: "active",
        $or: [
          { lastCreditRefresh: { $ne: today } },
          { lastCreditRefresh: { $exists: false } },
        ],
      });

      console.log(
        `Found ${freePlans.length} free plans needing credit refresh`
      );

      let updatedCount = 0;

      for (const appKey of freePlans) {
        try {
          await this.refreshDailyCredits(appKey);
          updatedCount++;
          console.log(`Refreshed daily credits for user: ${appKey.username}`);
        } catch (error) {
          console.error(
            `Error refreshing credits for ${appKey.username}:`,
            error
          );
        }
      }

      return updatedCount;
    } catch (error) {
      console.error("Error refreshing free plan credits:", error);
      return 0;
    }
  }

  // Enhanced downgrade function with better error handling
  async downgradeToPlan(appKey, newPlan) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const currentMonth = `${today.substring(0, 7)}`;

      // Update plan details
      appKey.plan = { type: newPlan };

      if (newPlan === "free") {
        appKey.expiresAt = undefined;
        appKey.credit = 5;
        appKey.lastCreditRefresh = today;

        // Initialize daily process for today if not exists
        if (!appKey.dailyProcess.has(today)) {
          appKey.dailyProcess.set(today, 0);
        }

        // Initialize monthly process if not exists
        if (!appKey.monthlyProcess.has(currentMonth)) {
          appKey.monthlyProcess.set(currentMonth, 0);
        }
      }

      await appKey.save();
      return appKey;
    } catch (error) {
      console.error("Error in downgradeToPlan:", error);
      throw error;
    }
  }

  // Enhanced refresh credits function
  async refreshDailyCredits(appKey) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const currentMonth = `${today.substring(0, 7)}`;

      if (appKey.plan.type === "free" && appKey.lastCreditRefresh !== today) {
        appKey.credit = 5;
        appKey.lastCreditRefresh = today;

        // Initialize daily process for today if not exists
        if (!appKey.dailyProcess.has(today)) {
          appKey.dailyProcess.set(today, 0);
        }

        // Initialize monthly process if not exists
        if (!appKey.monthlyProcess.has(currentMonth)) {
          appKey.monthlyProcess.set(currentMonth, 0);
        }

        await appKey.save();
      }

      return appKey;
    } catch (error) {
      console.error("Error in refreshDailyCredits:", error);
      throw error;
    }
  }

  // Manual trigger for immediate execution (useful for testing)
  async runManualCheck() {
    console.log("Running manual plan management check...");
    return await this.runDailyTasks();
  }

  // Get system status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextScheduledRun: this.isRunning ? "Daily at 12:00 AM" : "Not scheduled",
    };
  }

  // Cleanup old data (optional maintenance task)
  async cleanupOldData() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep last 30 days

      // This would require custom logic based on your needs
      console.log(
        "Cleanup task - implement based on your data retention policy"
      );
    } catch (error) {
      console.error("Error in cleanup task:", error);
    }
  }
}

// Create and export singleton instance
const planManagementSystem = new PlanManagementSystem();

// Auto-start the system when this module is imported
planManagementSystem.start();

export default planManagementSystem;

// Example usage:
// import planManagementSystem from './planManagementSystem.js';
//
// // Manual trigger (for testing)
// planManagementSystem.runManualCheck();
//
// // Get status
// console.log(planManagementSystem.getStatus());
//
// // Stop the system
// planManagementSystem.stop();
