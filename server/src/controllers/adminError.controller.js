import mongoose from "mongoose";
import { ApiUsageLog } from "../models/apiUsageLog.model.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PLAN_TYPES, PROCESS_ERROR_STATUS } from "../constants/index.js";
import {
  aggregateTopErrorMessages,
  buildErrorStatusFilter,
  buildHasErrorsFilter,
  getEffectiveErrorStatus,
  normalizeErrorMessages,
} from "../utils/processError.utils.js";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toUtcDateKey = (date) => new Date(date).toISOString().split("T")[0];

function setNoStoreHeaders(res) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
}

function formatErrorLog(doc) {
  const normalizedErrors = normalizeErrorMessages(doc.errors);
  const failedCount = Number(doc.failedCount) || 0;
  const processCount = Number(doc.processCount) || 0;
  const fileCount = Number(doc.fileCount) || 0;
  const completedBasis = Math.max(fileCount, processCount);
  const totalAttempted = completedBasis + failedCount;
  const failureRate =
    totalAttempted > 0
      ? Number(((failedCount / totalAttempted) * 100).toFixed(1))
      : failedCount > 0
      ? 100
      : 0;

  const userDoc = doc.user || (doc.userId && typeof doc.userId === "object" && doc.userId._id ? doc.userId : null);
  const appUserDoc =
    doc.appUser ||
    (doc.appUserId && typeof doc.appUserId === "object" && doc.appUserId._id ? doc.appUserId : null);

  const resolvedUserId = userDoc?._id
    ? userDoc._id.toString()
    : doc.userId
    ? String(doc.userId)
    : "";
  const resolvedAppUserId = appUserDoc?._id
    ? appUserDoc._id.toString()
    : doc.appUserId
    ? String(doc.appUserId)
    : "";

  const resolvedBy =
    doc.resolvedBy && (doc.resolvedBy.id || doc.resolvedBy.name || doc.resolvedBy.email)
      ? {
          id: doc.resolvedBy.id ? String(doc.resolvedBy.id) : null,
          name: doc.resolvedBy.name || null,
          email: doc.resolvedBy.email || null,
        }
      : null;

  return {
    _id: doc._id ? doc._id.toString() : "",
    date: doc.date,
    failedCount,
    processCount,
    fileCount,
    failureRate,
    errors: normalizedErrors,
    errorCount: normalizedErrors.length,
    errorStatus: getEffectiveErrorStatus(doc),
    lastErrorAt: doc.lastErrorAt || doc.updatedAt || doc.createdAt || null,
    resolvedAt: doc.resolvedAt || null,
    resolvedBy,
    resolutionNote: doc.resolutionNote || null,
    user: {
      _id: resolvedUserId,
      name: userDoc?.name || appUserDoc?.username || "Unknown User",
      email: userDoc?.email || appUserDoc?.username || "N/A",
      avatar: userDoc?.avatar || null,
    },
    appUser: {
      _id: resolvedAppUserId,
      username: appUserDoc?.username || userDoc?.email || "N/A",
      status: appUserDoc?.status || "active",
      plan: appUserDoc?.plan || { type: PLAN_TYPES.FREE, id: null, name: "Free Tier" },
      totalFailedProcess: Number(appUserDoc?.totalFailedProcess) || 0,
      devicesCount: Array.isArray(appUserDoc?.devices) ? appUserDoc.devices.length : 0,
    },
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

/**
 * GET /api/v1/admin/errors
 * Paginated, filterable desktop app processing error logs with summary & trend
 */
export const getAdminProcessErrors = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);

  const now = new Date();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const statusParam = String(req.query.status || "all").toLowerCase().trim();
  const planTypeParam = String(req.query.planType || "all").toLowerCase().trim();
  const search = String(req.query.search || "").trim();
  const startDate = String(req.query.startDate || "").trim();
  const endDate = String(req.query.endDate || "").trim();
  const sortBy = String(req.query.sortBy || "recent").trim();
  const sortOrder = String(req.query.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;
  const refreshed = req.query.refresh === "true" || req.query.refresh === "1";

  const hasErrorsMatch = buildHasErrorsFilter();
  const listAndConditions = [hasErrorsMatch];

  const statusFilter = buildErrorStatusFilter(statusParam);
  if (statusFilter) {
    listAndConditions.push(statusFilter);
  }

  if (
    (startDate && DATE_KEY_RE.test(startDate)) ||
    (endDate && DATE_KEY_RE.test(endDate))
  ) {
    const dateRange = {};
    if (startDate && DATE_KEY_RE.test(startDate)) dateRange.$gte = startDate;
    if (endDate && DATE_KEY_RE.test(endDate)) dateRange.$lte = endDate;
    listAndConditions.push({ date: dateRange });
  }

  const baseListMatch =
    listAndConditions.length === 1 ? listAndConditions[0] : { $and: listAndConditions };

  const postLookupConditions = [];
  if (
    planTypeParam &&
    planTypeParam !== "all" &&
    Object.values(PLAN_TYPES).includes(planTypeParam)
  ) {
    postLookupConditions.push({ "appUser.plan.type": planTypeParam });
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    postLookupConditions.push({
      $or: [
        { "user.name": regex },
        { "user.email": regex },
        { "appUser.username": regex },
        { errors: regex },
        { resolutionNote: regex },
        { date: regex },
      ],
    });
  }

  let sortStage;
  if (sortBy === "failedCount") {
    sortStage = { failedCount: sortOrder, date: -1, updatedAt: -1 };
  } else if (sortBy === "date") {
    sortStage = { date: sortOrder, lastErrorAt: sortOrder, updatedAt: sortOrder };
  } else {
    sortStage = { date: -1, lastErrorAt: -1, updatedAt: -1 };
  }

  const skip = (page - 1) * limit;

  const listPipeline = [
    { $match: baseListMatch },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "appusers",
        localField: "appUserId",
        foreignField: "_id",
        pipeline: [
          { $project: { username: 1, status: 1, plan: 1, totalFailedProcess: 1, devices: 1 } },
        ],
        as: "appUser",
      },
    },
    { $unwind: { path: "$appUser", preserveNullAndEmptyArrays: true } },
    ...(postLookupConditions.length > 0
      ? [{ $match: postLookupConditions.length === 1 ? postLookupConditions[0] : { $and: postLookupConditions } }]
      : []),
    {
      $facet: {
        total: [{ $count: "count" }],
        items: [{ $sort: sortStage }, { $skip: skip }, { $limit: limit }],
      },
    },
  ];

  const todayKey = toUtcDateKey(now);
  const last7DateKeys = Array.from({ length: 7 }, (_, i) =>
    toUtcDateKey(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (6 - i)))
    )
  );

  const summaryPipeline = [
    { $match: hasErrorsMatch },
    {
      $addFields: {
        effectiveStatus: {
          $cond: [
            {
              $in: [
                "$errorStatus",
                [PROCESS_ERROR_STATUS.RESOLVED, PROCESS_ERROR_STATUS.IGNORED],
              ],
            },
            "$errorStatus",
            PROCESS_ERROR_STATUS.UNRESOLVED,
          ],
        },
      },
    },
    {
      $facet: {
        counts: [
          {
            $group: {
              _id: null,
              totalErrorLogs: { $sum: 1 },
              unresolvedLogs: {
                $sum: {
                  $cond: [{ $eq: ["$effectiveStatus", PROCESS_ERROR_STATUS.UNRESOLVED] }, 1, 0],
                },
              },
              resolvedLogs: {
                $sum: {
                  $cond: [{ $eq: ["$effectiveStatus", PROCESS_ERROR_STATUS.RESOLVED] }, 1, 0],
                },
              },
              ignoredLogs: {
                $sum: {
                  $cond: [{ $eq: ["$effectiveStatus", PROCESS_ERROR_STATUS.IGNORED] }, 1, 0],
                },
              },
              totalFailures: { $sum: { $ifNull: ["$failedCount", 0] } },
              unresolvedFailures: {
                $sum: {
                  $cond: [
                    { $eq: ["$effectiveStatus", PROCESS_ERROR_STATUS.UNRESOLVED] },
                    { $ifNull: ["$failedCount", 0] },
                    0,
                  ],
                },
              },
              todayFailures: {
                $sum: {
                  $cond: [{ $eq: ["$date", todayKey] }, { $ifNull: ["$failedCount", 0] }, 0],
                },
              },
              last7DaysFailures: {
                $sum: {
                  $cond: [
                    { $in: ["$date", last7DateKeys] },
                    { $ifNull: ["$failedCount", 0] },
                    0,
                  ],
                },
              },
              affectedUserIds: {
                $addToSet: {
                  $cond: [
                    { $eq: ["$effectiveStatus", PROCESS_ERROR_STATUS.UNRESOLVED] },
                    "$userId",
                    "$$REMOVE",
                  ],
                },
              },
              totalAffectedUserIds: { $addToSet: "$userId" },
            },
          },
        ],
        trend: [
          { $match: { date: { $in: last7DateKeys } } },
          {
            $group: {
              _id: "$date",
              failedCount: { $sum: { $ifNull: ["$failedCount", 0] } },
              logCount: { $sum: 1 },
            },
          },
        ],
      },
    },
  ];

  const [listAgg, summaryAgg, recentMessageDocs] = await Promise.all([
    ApiUsageLog.aggregate(listPipeline),
    ApiUsageLog.aggregate(summaryPipeline),
    ApiUsageLog.find(hasErrorsMatch)
      .sort({ date: -1, updatedAt: -1 })
      .limit(300)
      .select("userId errors")
      .lean(),
  ]);

  const listFacet = listAgg[0] || {};
  const totalCount = listFacet.total?.[0]?.count || 0;
  const rawItems = listFacet.items || [];
  const logs = rawItems.map(formatErrorLog);

  const summaryFacet = summaryAgg[0] || {};
  const rawCounts = summaryFacet.counts?.[0] || {};
  const trendMap = new Map(
    (summaryFacet.trend || []).map((row) => [
      row._id,
      {
        failedCount: row.failedCount || 0,
        logCount: row.logCount || 0,
      },
    ])
  );

  const last7DaysTrend = last7DateKeys.map((date) => {
    const point = trendMap.get(date) || { failedCount: 0, logCount: 0 };
    return {
      date,
      failedCount: point.failedCount,
      logCount: point.logCount,
    };
  });

  const topErrorMessages = aggregateTopErrorMessages(recentMessageDocs, 6);

  const summary = {
    totalErrorLogs: rawCounts.totalErrorLogs || 0,
    unresolvedLogs: rawCounts.unresolvedLogs || 0,
    resolvedLogs: rawCounts.resolvedLogs || 0,
    ignoredLogs: rawCounts.ignoredLogs || 0,
    totalFailures: rawCounts.totalFailures || 0,
    unresolvedFailures: rawCounts.unresolvedFailures || 0,
    todayFailures: rawCounts.todayFailures || 0,
    last7DaysFailures: rawCounts.last7DaysFailures || 0,
    affectedUsersCount: Array.isArray(rawCounts.affectedUserIds)
      ? rawCounts.affectedUserIds.filter(Boolean).length
      : 0,
    totalAffectedUsersCount: Array.isArray(rawCounts.totalAffectedUserIds)
      ? rawCounts.totalAffectedUserIds.filter(Boolean).length
      : 0,
    last7DaysTrend,
    topErrorMessages,
  };

  return new ApiResponse(200, true, "App processing errors retrieved", {
    logs,
    summary,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
    meta: {
      generatedAt: now.toISOString(),
      refreshed,
    },
  }).send(res);
});

/**
 * PATCH /api/v1/admin/errors/:errorLogId/status
 * Update triage status & optional note on a single ApiUsageLog error record
 */
export const updateAdminProcessErrorStatus = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);

  const { errorLogId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(errorLogId)) {
    throw new ApiError(400, "Invalid error log ID");
  }

  const { status, resolutionNote } = req.body;
  const logDoc = await ApiUsageLog.findById(errorLogId);
  if (!logDoc) {
    throw new ApiError(404, "Error log record not found");
  }

  logDoc.errorStatus = status;
  if (resolutionNote !== undefined) {
    logDoc.resolutionNote = resolutionNote ? String(resolutionNote).trim() : null;
  }

  if (
    status === PROCESS_ERROR_STATUS.RESOLVED ||
    status === PROCESS_ERROR_STATUS.IGNORED
  ) {
    logDoc.resolvedAt = new Date();
    logDoc.resolvedBy = {
      id: req.user._id,
      name: req.user.name || "Admin",
      email: req.user.email || "",
    };
  } else {
    logDoc.resolvedAt = null;
    logDoc.resolvedBy = { id: null, name: null, email: null };
  }

  await logDoc.save();
  await logDoc.populate([
    { path: "userId", select: "name email avatar" },
    { path: "appUserId", select: "username status plan totalFailedProcess devices" },
  ]);

  return new ApiResponse(
    200,
    true,
    `Error log marked as ${status}`,
    formatErrorLog(logDoc.toObject())
  ).send(res);
});

/**
 * PATCH /api/v1/admin/errors/bulk-status
 * Bulk update triage status for selected error logs or all unresolved error logs
 */
export const bulkUpdateAdminProcessErrorStatus = asyncHandler(async (req, res) => {
  setNoStoreHeaders(res);

  const { ids = [], resolveAllUnresolved = false, status, resolutionNote } = req.body;

  let filter;
  if (resolveAllUnresolved) {
    filter = {
      $and: [
        buildHasErrorsFilter(),
        buildErrorStatusFilter(PROCESS_ERROR_STATUS.UNRESOLVED),
      ],
    };
  } else {
    const validIds = ids
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validIds.length === 0 || validIds.length !== ids.length) {
      throw new ApiError(400, "One or more provided error log IDs are invalid");
    }

    filter = { _id: { $in: validIds } };
  }

  const setFields = {
    errorStatus: status,
  };

  if (resolutionNote !== undefined) {
    setFields.resolutionNote = resolutionNote ? String(resolutionNote).trim() : null;
  }

  if (
    status === PROCESS_ERROR_STATUS.RESOLVED ||
    status === PROCESS_ERROR_STATUS.IGNORED
  ) {
    setFields.resolvedAt = new Date();
    setFields.resolvedBy = {
      id: req.user._id,
      name: req.user.name || "Admin",
      email: req.user.email || "",
    };
  } else {
    setFields.resolvedAt = null;
    setFields.resolvedBy = { id: null, name: null, email: null };
  }

  const updateResult = await ApiUsageLog.updateMany(filter, { $set: setFields });

  return new ApiResponse(200, true, `Updated ${updateResult.modifiedCount || 0} error logs`, {
    matchedCount: updateResult.matchedCount || 0,
    modifiedCount: updateResult.modifiedCount || 0,
  }).send(res);
});
