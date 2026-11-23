import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { BackupLog } from "../models/backupLog.model.js";
import backupService from "../services/backup.service.js";
import schedulerService from "../services/scheduler.service.js";

function setNoStoreHeaders(res) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatBackupLog(doc) {
  if (!doc) return null;

  return {
    _id: doc._id ? doc._id.toString() : String(doc.timestamp),
    timestamp:
      doc.timestamp instanceof Date
        ? doc.timestamp.toISOString()
        : doc.timestamp,
    success: Boolean(doc.success),
    durationMs: Number(doc.durationMs) || 0,
    duration: doc.duration || "0ms",
    collections: {
      total: doc.collections?.total || 0,
      successful: doc.collections?.successful || 0,
      failed: doc.collections?.failed || 0,
    },
    totalDocuments: doc.totalDocuments || 0,
    results: Array.isArray(doc.results) ? doc.results : [],
    triggeredBy: doc.triggeredBy === "scheduled" ? "scheduled" : "manual",
    triggeredByUser: doc.triggeredByUser?.name || doc.triggeredByUser?.email
      ? {
          id: doc.triggeredByUser.id
            ? doc.triggeredByUser.id.toString()
            : undefined,
          name: doc.triggeredByUser.name || undefined,
          email: doc.triggeredByUser.email || undefined,
        }
      : null,
    sourceDatabase: doc.sourceDatabase || null,
    targetDatabase: doc.targetDatabase || null,
    error: doc.error || null,
  };
}

/**
 * Get backup service status, statistics, scheduler details, and source DB collections
 */
const getBackupStatus = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const refreshed = req.query.refresh === "true";

  const status = backupService.getStatus();
  const schedulerStatus = schedulerService.getStatus();

  const [aggregateResult, latestDoc, sourceCollections] = await Promise.all([
    BackupLog.aggregate([
      {
        $group: {
          _id: null,
          totalBackups: { $sum: 1 },
          successfulBackups: {
            $sum: { $cond: [{ $eq: ["$success", true] }, 1, 0] },
          },
          failedBackups: {
            $sum: { $cond: [{ $eq: ["$success", false] }, 1, 0] },
          },
          avgDurationMs: {
            $avg: {
              $cond: [{ $eq: ["$success", true] }, "$durationMs", null],
            },
          },
        },
      },
    ]).catch(() => []),
    BackupLog.findOne().sort({ timestamp: -1 }).lean().catch(() => null),
    backupService.getSourceCollectionsSummary().catch(() => ({
      database: status.sourceDatabase,
      totalCollections: 0,
      totalDocuments: 0,
      collections: [],
    })),
  ]);

  const dbAgg = aggregateResult?.[0];
  const hasDbLogs = Boolean(dbAgg && dbAgg.totalBackups > 0);

  const totalBackups = hasDbLogs
    ? dbAgg.totalBackups
    : status.stats.totalBackups || 0;
  const successfulBackups = hasDbLogs
    ? dbAgg.successfulBackups
    : status.stats.successfulBackups || 0;
  const failedBackups = hasDbLogs
    ? dbAgg.failedBackups
    : status.stats.failedBackups || 0;
  const avgDurationMs =
    hasDbLogs && dbAgg.avgDurationMs != null
      ? Math.round(dbAgg.avgDurationMs)
      : status.stats.lastBackupResult?.durationMs || 0;

  const successRate =
    totalBackups > 0
      ? Math.round((successfulBackups / totalBackups) * 1000) / 10
      : 0;

  const lastBackup = latestDoc
    ? formatBackupLog(latestDoc)
    : formatBackupLog(status.stats.lastBackupResult);

  const responsePayload = {
    isConfigured: status.isConfigured,
    isRunning: status.isRunning,
    currentRunStartedAt: status.currentRunStartedAt,
    sourceDatabase: status.sourceDatabase,
    targetDatabase: status.targetDatabase,
    lastBackup,
    nextScheduledBackup: schedulerStatus.backup?.nextBackup || null,
    scheduler: {
      isRunning: Boolean(schedulerStatus.isRunning),
      cronExpression: schedulerStatus.backup?.cronExpression || "0 12 * * 5",
      timezone: schedulerStatus.timezone || "UTC",
    },
    totalBackups,
    successfulBackups,
    failedBackups,
    successRate,
    avgDurationMs,
    sourceCollections,
    meta: {
      generatedAt: new Date().toISOString(),
      refreshed,
    },
  };

  return new ApiResponse(
    200,
    true,
    "Backup status retrieved successfully",
    responsePayload
  ).send(res);
});

/**
 * Manually trigger database backup
 * Syncs all data from main database to backup database
 */
const triggerBackup = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);

  // Extend socket timeout for long-running backup operation (5 minutes)
  if (req.setTimeout) req.setTimeout(300000);
  if (res.setTimeout) res.setTimeout(300000);

  const triggeredByUser = req.user
    ? {
        id: req.user._id,
        name: req.user.name || "Admin",
        email: req.user.email || "",
      }
    : null;

  const result = await backupService.performBackup({
    triggeredBy: "manual",
    triggeredByUser,
  });

  if (result.code === "BACKUP_IN_PROGRESS") {
    return new ApiResponse(409, false, result.message, result).send(res);
  }

  if (result.success) {
    return new ApiResponse(
      200,
      true,
      "Database backup completed successfully",
      result
    ).send(res);
  }

  return new ApiResponse(
    200,
    false,
    result.message || result.error || "Database backup failed",
    result
  ).send(res);
});

/**
 * Test backup database connection
 */
const testBackupConnection = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);
  const refreshed = req.query.refresh === "true";

  const result = await backupService.testConnection();
  const payload = {
    ...result,
    meta: {
      generatedAt: new Date().toISOString(),
      refreshed,
    },
  };

  if (result.success) {
    return new ApiResponse(
      200,
      true,
      "Backup database connection test successful",
      payload
    ).send(res);
  }

  return new ApiResponse(
    200,
    false,
    result.message || "Backup database connection test failed",
    payload
  ).send(res);
});

/**
 * Get paginated, filterable backup history and summary statistics
 */
const getBackupHistory = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const statusFilter = String(req.query.status || "all").toLowerCase();
  const triggeredByFilter = String(req.query.triggeredBy || "all").toLowerCase();
  const search = String(req.query.search || "").trim();
  const refreshed = req.query.refresh === "true";

  const query = {};
  if (statusFilter === "success") {
    query.success = true;
  } else if (statusFilter === "failed") {
    query.success = false;
  }

  if (triggeredByFilter === "manual" || triggeredByFilter === "scheduled") {
    query.triggeredBy = triggeredByFilter;
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { sourceDatabase: regex },
      { targetDatabase: regex },
      { error: regex },
      { "triggeredByUser.name": regex },
      { "triggeredByUser.email": regex },
      { "results.collection": regex },
    ];
  }

  const skip = (page - 1) * limit;

  const [docs, total, summaryAgg] = await Promise.all([
    BackupLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    BackupLog.countDocuments(query),
    BackupLog.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: { $sum: { $cond: [{ $eq: ["$success", true] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$success", false] }, 1, 0] } },
          manual: {
            $sum: { $cond: [{ $eq: ["$triggeredBy", "manual"] }, 1, 0] },
          },
          scheduled: {
            $sum: { $cond: [{ $eq: ["$triggeredBy", "scheduled"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const rawSummary = summaryAgg?.[0] || {
    total: 0,
    successful: 0,
    failed: 0,
    manual: 0,
    scheduled: 0,
  };

  let history = docs.map(formatBackupLog);
  let totalCount = total;
  const summary = {
    total: rawSummary.total || 0,
    successful: rawSummary.successful || 0,
    failed: rawSummary.failed || 0,
    manual: rawSummary.manual || 0,
    scheduled: rawSummary.scheduled || 0,
  };

  // Fallback to in-memory runs if DB collection is empty
  if (summary.total === 0) {
    const mem = backupService.getStatus().memoryHistory || [];
    if (mem.length > 0) {
      summary.total = mem.length;
      summary.successful = mem.filter((item) => item.success).length;
      summary.failed = mem.filter((item) => !item.success).length;
      summary.manual = mem.filter((item) => item.triggeredBy === "manual").length;
      summary.scheduled = mem.filter(
        (item) => item.triggeredBy === "scheduled"
      ).length;

      const filteredMem = mem.filter((item) => {
        if (statusFilter === "success" && !item.success) return false;
        if (statusFilter === "failed" && item.success) return false;
        if (
          (triggeredByFilter === "manual" ||
            triggeredByFilter === "scheduled") &&
          item.triggeredBy !== triggeredByFilter
        ) {
          return false;
        }
        if (search) {
          const needle = search.toLowerCase();
          const haystack = [
            item.sourceDatabase,
            item.targetDatabase,
            item.error,
            item.triggeredByUser?.name,
            item.triggeredByUser?.email,
            ...(item.results || []).map((r) => r.collection),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        return true;
      });

      totalCount = filteredMem.length;
      history = filteredMem.slice(skip, skip + limit).map(formatBackupLog);
    }
  }

  return new ApiResponse(200, true, "Backup history retrieved successfully", {
    history,
    summary,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
    meta: {
      generatedAt: new Date().toISOString(),
      refreshed,
    },
  }).send(res);
});

export {
  getBackupStatus,
  triggerBackup,
  testBackupConnection,
  getBackupHistory,
};
