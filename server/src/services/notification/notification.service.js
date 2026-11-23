import mongoose from "mongoose";
import ApiError from "../../utils/api.error.js";
import {
  NOTIFICATION_AUDIENCES,
  NOTIFICATION_BROADCAST_TARGETS,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  PLAN_TYPES,
  USER_ROLES,
} from "../../constants/index.js";
import { Notification } from "../../models/notification.model.js";
import { NotificationPreference } from "../../models/notificationPreference.model.js";
import { NotificationBroadcast } from "../../models/notificationBroadcast.model.js";
import { User } from "../../models/user.model.js";
import { AppUser } from "../../models/appUser.model.js";
import { sendNotificationEmail } from "../email/email.service.js";
import { notificationStreamHub } from "./notificationStream.service.js";

const DEFAULT_RETENTION_DAYS = 90;
const BROADCAST_CHUNK_SIZE = 500;
const EMAIL_BATCH_CONCURRENCY = 10;

export const DEFAULT_PREFERENCES = {
  channels: {
    inApp: true,
    email: true,
  },
  categories: {
    billing: { inApp: true, email: true },
    plan: { inApp: true, email: true },
    referral: { inApp: true, email: true },
    security: { inApp: true, email: true },
    system: { inApp: true, email: false },
    announcement: { inApp: true, email: true },
  },
  toastEnabled: true,
  soundEnabled: false,
};

const VALID_CATEGORIES = Object.values(NOTIFICATION_CATEGORIES);
const VALID_PRIORITIES = Object.values(NOTIFICATION_PRIORITIES);

const USER_ALLOWED_CATEGORIES = [
  NOTIFICATION_CATEGORIES.BILLING,
  NOTIFICATION_CATEGORIES.PLAN,
  NOTIFICATION_CATEGORIES.REFERRAL,
  NOTIFICATION_CATEGORIES.SECURITY,
  NOTIFICATION_CATEGORIES.ANNOUNCEMENT,
];

const ADMIN_ALLOWED_CATEGORIES = [
  NOTIFICATION_CATEGORIES.BILLING,
  NOTIFICATION_CATEGORIES.REFERRAL,
  NOTIFICATION_CATEGORIES.SECURITY,
  NOTIFICATION_CATEGORIES.ANNOUNCEMENT,
];

const SUPER_ADMIN_ALLOWED_CATEGORIES = [
  NOTIFICATION_CATEGORIES.BILLING,
  NOTIFICATION_CATEGORIES.REFERRAL,
  NOTIFICATION_CATEGORIES.SECURITY,
  NOTIFICATION_CATEGORIES.SYSTEM,
  NOTIFICATION_CATEGORIES.ANNOUNCEMENT,
];

export function getAllowedCategories(
  role = USER_ROLES.USER,
  scope = "user"
) {
  if (scope === "admin" && role === USER_ROLES.SUPER_ADMIN) {
    return [...SUPER_ADMIN_ALLOWED_CATEGORIES];
  }
  if (scope === "admin" && role === USER_ROLES.ADMIN) {
    return [...ADMIN_ALLOWED_CATEGORIES];
  }
  return [...USER_ALLOWED_CATEGORIES];
}

/**
 * Allow safe relative paths (starting with '/' but not '//') and http/https URLs only.
 */
export function sanitizeActionUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed || /[\r\n\0]/.test(trimmed)) return null;

  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) return null;
    return trimmed.slice(0, 500);
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString().slice(0, 500);
    }
  } catch {
    return null;
  }

  return null;
}

export function mergePreferences(doc, allowedCategories = null) {
  const plain = doc?.toObject ? doc.toObject() : doc || {};
  const categoryList =
    Array.isArray(allowedCategories) && allowedCategories.length > 0
      ? allowedCategories
      : VALID_CATEGORIES;
  const categories = {};

  for (const cat of categoryList) {
    const def = DEFAULT_PREFERENCES.categories[cat];
    if (!def) continue;
    const custom = plain.categories?.[cat];
    categories[cat] = {
      inApp: true,
      email: typeof custom?.email === "boolean" ? custom.email : def.email,
    };
  }

  return {
    channels: {
      inApp: true,
      email:
        typeof plain.channels?.email === "boolean"
          ? plain.channels.email
          : DEFAULT_PREFERENCES.channels.email,
    },
    categories,
    toastEnabled:
      typeof plain.toastEnabled === "boolean"
        ? plain.toastEnabled
        : DEFAULT_PREFERENCES.toastEnabled,
    soundEnabled:
      typeof plain.soundEnabled === "boolean"
        ? plain.soundEnabled
        : DEFAULT_PREFERENCES.soundEnabled,
  };
}

function mergeStoredPreferencesRaw(doc) {
  const plain = doc?.toObject ? doc.toObject() : doc || {};
  const categories = {};

  for (const cat of VALID_CATEGORIES) {
    const def = DEFAULT_PREFERENCES.categories[cat];
    const custom = plain.categories?.[cat];
    categories[cat] = {
      inApp: typeof custom?.inApp === "boolean" ? custom.inApp : def.inApp,
      email: typeof custom?.email === "boolean" ? custom.email : def.email,
    };
  }

  return {
    channels: {
      inApp:
        typeof plain.channels?.inApp === "boolean"
          ? plain.channels.inApp
          : DEFAULT_PREFERENCES.channels.inApp,
      email:
        typeof plain.channels?.email === "boolean"
          ? plain.channels.email
          : DEFAULT_PREFERENCES.channels.email,
    },
    categories,
    toastEnabled:
      typeof plain.toastEnabled === "boolean"
        ? plain.toastEnabled
        : DEFAULT_PREFERENCES.toastEnabled,
    soundEnabled:
      typeof plain.soundEnabled === "boolean"
        ? plain.soundEnabled
        : DEFAULT_PREFERENCES.soundEnabled,
  };
}

export function serializeNotification(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: (obj._id || obj.id)?.toString?.() || "",
    recipientId: obj.recipientId?.toString?.() || String(obj.recipientId || ""),
    audience: obj.audience || NOTIFICATION_AUDIENCES.USER,
    type: obj.type,
    category: obj.category,
    priority: obj.priority || NOTIFICATION_PRIORITIES.NORMAL,
    title: obj.title,
    message: obj.message,
    actionUrl: obj.actionUrl || null,
    actionLabel: obj.actionLabel || null,
    actor: obj.actor
      ? {
          userId: obj.actor.userId?.toString?.() || obj.actor.userId || null,
          name: obj.actor.name || null,
          email: obj.actor.email || null,
          avatar: obj.actor.avatar || null,
        }
      : null,
    metadata: obj.metadata || {},
    isRead: Boolean(obj.isRead),
    readAt: obj.readAt || null,
    isArchived: Boolean(obj.isArchived),
    archivedAt: obj.archivedAt || null,
    channels: obj.channels || {
      inApp: true,
      email: { sent: false, sentAt: null, error: null },
    },
    broadcastId: obj.broadcastId?.toString?.() || obj.broadcastId || null,
    expiresAt: obj.expiresAt || null,
    createdAt: obj.createdAt || null,
    updatedAt: obj.updatedAt || null,
  };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toObjectId(id) {
  if (mongoose.Types.ObjectId.isValid(String(id))) {
    return new mongoose.Types.ObjectId(String(id));
  }
  return String(id);
}

/**
 * Factory for creating a NotificationService with injectable dependencies for clean testing.
 */
export function createNotificationService(overrides = {}) {
  const hasInjectedModels = Boolean(overrides.NotificationModel);

  const deps = {
    NotificationModel: overrides.NotificationModel || Notification,
    NotificationPreferenceModel:
      overrides.NotificationPreferenceModel || NotificationPreference,
    NotificationBroadcastModel:
      overrides.NotificationBroadcastModel || NotificationBroadcast,
    UserModel: overrides.UserModel || User,
    AppUserModel: overrides.AppUserModel || AppUser,
    streamHub: overrides.streamHub || notificationStreamHub,
    sendEmailFn: overrides.sendEmailFn || sendNotificationEmail,
    nowFn: overrides.nowFn || (() => new Date()),
    isDbReady:
      overrides.isDbReady ||
      (() => hasInjectedModels || mongoose.connection.readyState === 1),
  };

  function resolveAudienceFilter(scope = "user", isAdmin = false) {
    if (!isAdmin) {
      return { audience: NOTIFICATION_AUDIENCES.USER };
    }
    if (scope === "admin") {
      return { audience: NOTIFICATION_AUDIENCES.ADMIN };
    }
    if (scope === "user") {
      return { audience: NOTIFICATION_AUDIENCES.USER };
    }
    if (scope === "all") {
      return {};
    }
    return { audience: NOTIFICATION_AUDIENCES.USER };
  }

  async function computeUnreadSummary(
    recipientId,
    audienceFilter = {},
    allowedCategories = null
  ) {
    const categoryList =
      Array.isArray(allowedCategories) && allowedCategories.length > 0
        ? allowedCategories
        : VALID_CATEGORIES;

    const baseMatch = {
      recipientId: toObjectId(recipientId),
      ...audienceFilter,
      isRead: false,
      isArchived: false,
      ...(Array.isArray(allowedCategories) && allowedCategories.length > 0
        ? { category: { $in: allowedCategories } }
        : {}),
    };

    const byCategory = {};
    for (const cat of categoryList) {
      byCategory[cat] = 0;
    }

    if (typeof deps.NotificationModel.aggregate === "function") {
      const grouped = await deps.NotificationModel.aggregate([
        { $match: baseMatch },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]);
      let unreadCount = 0;
      for (const row of grouped) {
        if (row?._id && Object.prototype.hasOwnProperty.call(byCategory, row._id)) {
          byCategory[row._id] = row.count;
        }
        unreadCount += Number(row?.count) || 0;
      }
      return { unreadCount, byCategory };
    }

    const unreadCount = await deps.NotificationModel.countDocuments(baseMatch);
    return { unreadCount, byCategory };
  }

  async function getRawPreferences(userId) {
    if (!deps.isDbReady() || !userId) {
      return mergeStoredPreferencesRaw(null);
    }
    const existing = await deps.NotificationPreferenceModel.findOne({
      userId,
    }).lean();
    return mergeStoredPreferencesRaw(existing);
  }

  async function getPreferences(
    userId,
    { role = USER_ROLES.USER, scope = "user" } = {}
  ) {
    const allowedCategories = getAllowedCategories(role, scope);
    if (!deps.isDbReady() || !userId) {
      return mergePreferences(null, allowedCategories);
    }
    const existing = await deps.NotificationPreferenceModel.findOne({
      userId,
    }).lean();
    return mergePreferences(existing, allowedCategories);
  }

  async function updatePreferences(
    userId,
    patch = {},
    { role = USER_ROLES.USER, scope = "user" } = {}
  ) {
    const allowedCategories = getAllowedCategories(role, scope);
    const current = await getRawPreferences(userId);

    const nextChannels = {
      inApp: true,
      email:
        typeof patch.channels?.email === "boolean"
          ? patch.channels.email
          : current.channels.email,
    };

    const nextCategories = { ...current.categories };
    if (patch.categories && typeof patch.categories === "object") {
      for (const cat of allowedCategories) {
        const catPatch = patch.categories[cat];
        if (!catPatch || typeof catPatch !== "object") continue;
        nextCategories[cat] = {
          inApp:
            typeof catPatch.inApp === "boolean"
              ? catPatch.inApp
              : true,
          email:
            typeof catPatch.email === "boolean"
              ? catPatch.email
              : current.categories[cat]?.email ?? true,
        };
      }
    }

    const updated = await deps.NotificationPreferenceModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          channels: nextChannels,
          categories: nextCategories,
        },
      },
      { upsert: true, new: true }
    );

    return mergePreferences(updated, allowedCategories);
  }

  async function dispatchEmailAsync({
    notificationId = null,
    recipientId,
    recipientEmail = null,
    recipientName = null,
    title,
    message,
    category,
    priority,
    actionUrl,
    actionLabel,
  }) {
    try {
      let email = recipientEmail;
      let name = recipientName;

      if (!email && recipientId && typeof deps.UserModel.findById === "function") {
        const userDoc = await deps.UserModel.findById(recipientId)
          .select("email name")
          .lean();
        email = userDoc?.email || null;
        name = name || userDoc?.name || null;
      }

      if (!email) return { sent: false, skipped: true };

      const res = await deps.sendEmailFn({
        email,
        name,
        title,
        message,
        category,
        priority,
        actionUrl,
        actionLabel,
      });

      if (
        notificationId &&
        typeof deps.NotificationModel.updateOne === "function"
      ) {
        if (res?.sent) {
          await deps.NotificationModel.updateOne(
            { _id: notificationId },
            {
              $set: {
                "channels.email.sent": true,
                "channels.email.sentAt": deps.nowFn(),
                "channels.email.error": null,
              },
            }
          ).catch(() => {});
        } else if (res?.error) {
          await deps.NotificationModel.updateOne(
            { _id: notificationId },
            { $set: { "channels.email.error": String(res.error).slice(0, 300) } }
          ).catch(() => {});
        }
      }

      return res;
    } catch (err) {
      console.error("[NotificationService] Async email error:", err?.message || err);
      return { sent: false, error: err?.message };
    }
  }

  async function notifyUser(options = {}) {
    if (!deps.isDbReady()) {
      return { skipped: true, reason: "db_not_connected" };
    }

    const {
      recipientId,
      recipientEmail = null,
      recipientName = null,
      audience = NOTIFICATION_AUDIENCES.USER,
      type = "system.general",
      category = NOTIFICATION_CATEGORIES.SYSTEM,
      priority = NOTIFICATION_PRIORITIES.NORMAL,
      title,
      message,
      actionUrl = null,
      actionLabel = null,
      actor = null,
      metadata = {},
      dedupeKey = null,
      sendEmail = false,
      forceDeliver = false,
      expiresAt = undefined,
      broadcastId = null,
    } = options;

    if (!recipientId || !title || !message) {
      return { skipped: true, reason: "invalid_payload" };
    }

    const safeCategory = VALID_CATEGORIES.includes(category)
      ? category
      : NOTIFICATION_CATEGORIES.SYSTEM;
    const safePriority = VALID_PRIORITIES.includes(priority)
      ? priority
      : NOTIFICATION_PRIORITIES.NORMAL;
    const safeAudience =
      audience === NOTIFICATION_AUDIENCES.ADMIN
        ? NOTIFICATION_AUDIENCES.ADMIN
        : NOTIFICATION_AUDIENCES.USER;
    const safeUrl = sanitizeActionUrl(actionUrl);

    const prefs = await getRawPreferences(recipientId);
    const catPref = prefs.categories?.[safeCategory] || { inApp: true, email: false };

    const inAppAllowed = forceDeliver
      ? true
      : Boolean(prefs.channels.inApp && catPref.inApp !== false);
    const emailAllowed = forceDeliver
      ? true
      : Boolean(prefs.channels.email && catPref.email !== false);

    if (!inAppAllowed && !(sendEmail && emailAllowed)) {
      return {
        delivered: false,
        skippedByPreference: true,
        deduplicated: false,
        notification: null,
      };
    }

    const now = deps.nowFn();
    let resolvedExpiresAt = null;
    if (expiresAt === false) {
      resolvedExpiresAt = null;
    } else if (expiresAt instanceof Date) {
      resolvedExpiresAt = expiresAt;
    } else if (typeof expiresAt === "string" || typeof expiresAt === "number") {
      const parsedDate = new Date(expiresAt);
      if (!Number.isNaN(parsedDate.getTime())) {
        resolvedExpiresAt = parsedDate;
      }
    } else {
      resolvedExpiresAt = new Date(
        now.getTime() + DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000
      );
    }

    let createdDoc = null;
    let serialized = null;

    if (inAppAllowed) {
      try {
        createdDoc = await deps.NotificationModel.create({
          recipientId,
          audience: safeAudience,
          type: String(type).trim().slice(0, 100),
          category: safeCategory,
          priority: safePriority,
          title: String(title).trim().slice(0, 160),
          message: String(message).trim().slice(0, 1000),
          actionUrl: safeUrl,
          actionLabel: actionLabel ? String(actionLabel).trim().slice(0, 60) : null,
          actor: actor
            ? {
                userId: actor.userId || null,
                name: actor.name || null,
                email: actor.email || null,
                avatar: actor.avatar || null,
              }
            : {},
          metadata: metadata && typeof metadata === "object" ? metadata : {},
          channels: {
            inApp: true,
            email: { sent: false, sentAt: null, error: null },
          },
          dedupeKey: dedupeKey ? String(dedupeKey).trim().slice(0, 200) : null,
          broadcastId: broadcastId || null,
          expiresAt: resolvedExpiresAt,
        });
      } catch (err) {
        if (err?.code === 11000) {
          return {
            delivered: false,
            deduplicated: true,
            notification: null,
          };
        }
        throw err;
      }

      serialized = serializeNotification(createdDoc);

      const { unreadCount } = await computeUnreadSummary(recipientId, {
        audience: safeAudience,
      });

      deps.streamHub.emitToUser(
        recipientId,
        "notification:new",
        {
          notification: serialized,
          unreadCount,
          audience: safeAudience,
        },
        { audience: safeAudience }
      );
    }

    if (sendEmail && emailAllowed) {
      // Fire-and-forget asynchronous email delivery
      Promise.resolve().then(() =>
        dispatchEmailAsync({
          notificationId: createdDoc?._id || null,
          recipientId,
          recipientEmail,
          recipientName,
          title: String(title).trim().slice(0, 160),
          message: String(message).trim().slice(0, 1000),
          category: safeCategory,
          priority: safePriority,
          actionUrl: safeUrl,
          actionLabel,
        })
      );
    }

    return {
      delivered: true,
      deduplicated: false,
      notification: serialized,
    };
  }

  async function notifyAdmins({
    superAdminOnly = false,
    excludeUserId = null,
    ...payload
  } = {}) {
    if (!deps.isDbReady()) {
      return { skipped: true, reason: "db_not_connected", targeted: 0 };
    }

    const roleFilter = superAdminOnly
      ? USER_ROLES.SUPER_ADMIN
      : { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] };

    const admins = await deps.UserModel.find({
      role: roleFilter,
      isDisabled: { $ne: true },
      isVerified: true,
    })
      .select("_id name email")
      .lean();

    const filteredAdmins = excludeUserId
      ? admins.filter((a) => String(a._id) !== String(excludeUserId))
      : admins;

    const results = await Promise.allSettled(
      filteredAdmins.map((admin) =>
        notifyUser({
          ...payload,
          recipientId: admin._id,
          recipientEmail: admin.email,
          recipientName: admin.name,
          audience: NOTIFICATION_AUDIENCES.ADMIN,
          dedupeKey: payload.dedupeKey
            ? `${payload.dedupeKey}:${admin._id}`
            : null,
        })
      )
    );

    return {
      targeted: filteredAdmins.length,
      results,
    };
  }

  async function listNotifications(
    userId,
    {
      scope = "user",
      isAdmin = false,
      role = USER_ROLES.USER,
      status = "all",
      category = null,
      priority = null,
      search = "",
      page = 1,
      limit = 20,
    } = {}
  ) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const effectiveScope = isAdmin ? scope : "user";
    const audienceFilter = resolveAudienceFilter(effectiveScope, isAdmin);
    const allowedCategories = getAllowedCategories(role, effectiveScope);

    const baseOwnership = {
      recipientId: toObjectId(userId),
      ...audienceFilter,
    };

    const filter = {
      ...baseOwnership,
      category: { $in: allowedCategories },
    };

    if (status === "unread") {
      filter.isRead = false;
      filter.isArchived = false;
    } else if (status === "read") {
      filter.isRead = true;
      filter.isArchived = false;
    } else if (status === "archived") {
      filter.isArchived = true;
    } else {
      filter.isArchived = false;
    }

    if (category && allowedCategories.includes(category)) {
      filter.category = category;
    }

    if (priority && VALID_PRIORITIES.includes(priority)) {
      filter.priority = priority;
    }

    if (typeof search === "string" && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim().slice(0, 120)), "i");
      filter.$or = [{ title: regex }, { message: regex }];
    }

    const skip = (safePage - 1) * safeLimit;

    const [docs, total, unreadSummary] = await Promise.all([
      deps.NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      deps.NotificationModel.countDocuments(filter),
      computeUnreadSummary(userId, audienceFilter, allowedCategories),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return {
      notifications: docs.map(serializeNotification),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
      unreadCount: unreadSummary.unreadCount,
      categoryCounts: unreadSummary.byCategory,
    };
  }

  async function getUnreadCount(
    userId,
    { scope = "user", isAdmin = false, role = USER_ROLES.USER } = {}
  ) {
    const effectiveScope = isAdmin ? scope : "user";
    const audienceFilter = resolveAudienceFilter(effectiveScope, isAdmin);
    const allowedCategories = getAllowedCategories(role, effectiveScope);
    return computeUnreadSummary(userId, audienceFilter, allowedCategories);
  }

  function assertValidNotificationId(notificationId) {
    if (!mongoose.Types.ObjectId.isValid(String(notificationId || ""))) {
      throw new ApiError(400, "Invalid notification ID");
    }
  }

  async function markAsRead(userId, notificationId) {
    assertValidNotificationId(notificationId);
    const now = deps.nowFn();

    const updated = await deps.NotificationModel.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { isRead: true, readAt: now } },
      { new: true }
    );

    if (!updated) {
      throw new ApiError(404, "Notification not found");
    }

    const serialized = serializeNotification(updated);
    const { unreadCount } = await computeUnreadSummary(userId, {
      audience: serialized.audience,
    });

    deps.streamHub.emitToUser(
      userId,
      "notification:updated",
      { notification: serialized, unreadCount, audience: serialized.audience },
      { audience: serialized.audience }
    );

    return { notification: serialized, unreadCount };
  }

  async function markAsUnread(userId, notificationId) {
    assertValidNotificationId(notificationId);

    const updated = await deps.NotificationModel.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { isRead: false, readAt: null } },
      { new: true }
    );

    if (!updated) {
      throw new ApiError(404, "Notification not found");
    }

    const serialized = serializeNotification(updated);
    const { unreadCount } = await computeUnreadSummary(userId, {
      audience: serialized.audience,
    });

    deps.streamHub.emitToUser(
      userId,
      "notification:updated",
      { notification: serialized, unreadCount, audience: serialized.audience },
      { audience: serialized.audience }
    );

    return { notification: serialized, unreadCount };
  }

  async function markAllAsRead(
    userId,
    { scope = "user", isAdmin = false, category = null } = {}
  ) {
    const audienceFilter = resolveAudienceFilter(scope, isAdmin);
    const now = deps.nowFn();

    const filter = {
      recipientId: userId,
      ...audienceFilter,
      isArchived: false,
      isRead: false,
      ...(category && VALID_CATEGORIES.includes(category) ? { category } : {}),
    };

    const result = await deps.NotificationModel.updateMany(filter, {
      $set: { isRead: true, readAt: now },
    });

    const { unreadCount } = await computeUnreadSummary(userId, audienceFilter);

    deps.streamHub.emitToUser(
      userId,
      "notification:bulk",
      {
        action: "read_all",
        scope: isAdmin ? scope : "user",
        category: category || null,
        modifiedCount: result?.modifiedCount || 0,
        unreadCount,
      },
      { audience: audienceFilter.audience || null }
    );

    return {
      modifiedCount: result?.modifiedCount || 0,
      unreadCount,
    };
  }

  async function archiveNotification(userId, notificationId) {
    assertValidNotificationId(notificationId);
    const now = deps.nowFn();

    const updated = await deps.NotificationModel.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      {
        $set: {
          isArchived: true,
          archivedAt: now,
          isRead: true,
          readAt: now,
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new ApiError(404, "Notification not found");
    }

    const serialized = serializeNotification(updated);
    const { unreadCount } = await computeUnreadSummary(userId, {
      audience: serialized.audience,
    });

    deps.streamHub.emitToUser(
      userId,
      "notification:updated",
      { notification: serialized, unreadCount, audience: serialized.audience },
      { audience: serialized.audience }
    );

    return { notification: serialized, unreadCount };
  }

  async function unarchiveNotification(userId, notificationId) {
    assertValidNotificationId(notificationId);

    const updated = await deps.NotificationModel.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { isArchived: false, archivedAt: null } },
      { new: true }
    );

    if (!updated) {
      throw new ApiError(404, "Notification not found");
    }

    const serialized = serializeNotification(updated);
    const { unreadCount } = await computeUnreadSummary(userId, {
      audience: serialized.audience,
    });

    deps.streamHub.emitToUser(
      userId,
      "notification:updated",
      { notification: serialized, unreadCount, audience: serialized.audience },
      { audience: serialized.audience }
    );

    return { notification: serialized, unreadCount };
  }

  async function archiveAllRead(userId, { scope = "user", isAdmin = false } = {}) {
    const audienceFilter = resolveAudienceFilter(scope, isAdmin);
    const now = deps.nowFn();

    const result = await deps.NotificationModel.updateMany(
      {
        recipientId: userId,
        ...audienceFilter,
        isArchived: false,
        isRead: true,
      },
      { $set: { isArchived: true, archivedAt: now } }
    );

    const { unreadCount } = await computeUnreadSummary(userId, audienceFilter);

    deps.streamHub.emitToUser(
      userId,
      "notification:bulk",
      {
        action: "archive_read",
        scope: isAdmin ? scope : "user",
        modifiedCount: result?.modifiedCount || 0,
        unreadCount,
      },
      { audience: audienceFilter.audience || null }
    );

    return {
      modifiedCount: result?.modifiedCount || 0,
      unreadCount,
    };
  }

  async function deleteNotification(userId, notificationId) {
    assertValidNotificationId(notificationId);

    const deleted = await deps.NotificationModel.findOneAndDelete({
      _id: notificationId,
      recipientId: userId,
    });

    if (!deleted) {
      throw new ApiError(404, "Notification not found");
    }

    const audience = deleted.audience || NOTIFICATION_AUDIENCES.USER;
    const { unreadCount } = await computeUnreadSummary(userId, { audience });

    deps.streamHub.emitToUser(
      userId,
      "notification:deleted",
      {
        id: deleted._id.toString(),
        unreadCount,
        audience,
      },
      { audience }
    );

    return { id: deleted._id.toString(), unreadCount };
  }

  async function resolveBroadcastRecipients(target, targetIdentifiers = []) {
    if (target === NOTIFICATION_BROADCAST_TARGETS.ALL_USERS) {
      return deps.UserModel.find({
        isDisabled: { $ne: true },
        isVerified: true,
      })
        .select("_id name email")
        .lean();
    }

    if (target === NOTIFICATION_BROADCAST_TARGETS.ADMINS) {
      return deps.UserModel.find({
        role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] },
        isDisabled: { $ne: true },
        isVerified: true,
      })
        .select("_id name email")
        .lean();
    }

    if (
      target === NOTIFICATION_BROADCAST_TARGETS.SUBSCRIPTION_USERS ||
      target === NOTIFICATION_BROADCAST_TARGETS.CREDIT_USERS ||
      target === NOTIFICATION_BROADCAST_TARGETS.FREE_USERS
    ) {
      const planType =
        target === NOTIFICATION_BROADCAST_TARGETS.SUBSCRIPTION_USERS
          ? PLAN_TYPES.SUBSCRIPTION
          : target === NOTIFICATION_BROADCAST_TARGETS.CREDIT_USERS
            ? PLAN_TYPES.CREDIT
            : PLAN_TYPES.FREE;

      const appUsers = await deps.AppUserModel.find({
        "plan.type": planType,
        isActive: true,
      })
        .select("userId")
        .lean();

      const userIds = appUsers.map((au) => au.userId).filter(Boolean);
      if (userIds.length === 0) return [];

      return deps.UserModel.find({
        _id: { $in: userIds },
        isDisabled: { $ne: true },
        isVerified: true,
      })
        .select("_id name email")
        .lean();
    }

    if (target === NOTIFICATION_BROADCAST_TARGETS.SPECIFIC_USERS) {
      const cleaned = Array.isArray(targetIdentifiers)
        ? targetIdentifiers.map((v) => String(v).trim()).filter(Boolean)
        : [];
      if (cleaned.length === 0) return [];

      const emails = [];
      const objectIds = [];
      for (const identifier of cleaned) {
        if (identifier.includes("@")) {
          emails.push(identifier.toLowerCase());
        } else if (mongoose.Types.ObjectId.isValid(identifier)) {
          objectIds.push(identifier);
        }
      }

      const orConditions = [];
      if (emails.length > 0) orConditions.push({ email: { $in: emails } });
      if (objectIds.length > 0) orConditions.push({ _id: { $in: objectIds } });
      if (orConditions.length === 0) return [];

      return deps.UserModel.find({
        $or: orConditions,
        isDisabled: { $ne: true },
      })
        .select("_id name email")
        .lean();
    }

    return [];
  }

  async function dispatchBroadcastEmailsInBatches({
    broadcastId,
    recipients,
    title,
    message,
    category,
    priority,
    actionUrl,
    actionLabel,
  }) {
    let emailSentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i += EMAIL_BATCH_CONCURRENCY) {
      const batch = recipients.slice(i, i + EMAIL_BATCH_CONCURRENCY);
      const settled = await Promise.allSettled(
        batch.map((recipient) =>
          deps.sendEmailFn({
            email: recipient.email,
            name: recipient.name,
            title,
            message,
            category,
            priority,
            actionUrl,
            actionLabel,
          })
        )
      );

      for (const item of settled) {
        if (item.status === "fulfilled" && item.value?.sent) {
          emailSentCount += 1;
        } else if (
          item.status === "rejected" ||
          (item.status === "fulfilled" && item.value?.error)
        ) {
          failedCount += 1;
        }
      }
    }

    if (
      broadcastId &&
      typeof deps.NotificationBroadcastModel.updateOne === "function"
    ) {
      await deps.NotificationBroadcastModel.updateOne(
        { _id: broadcastId },
        {
          $set: {
            "stats.emailSentCount": emailSentCount,
          },
          $inc: {
            "stats.failedCount": failedCount,
          },
        }
      ).catch(() => {});
    }
  }

  async function sendBroadcast({
    title,
    message,
    category = NOTIFICATION_CATEGORIES.ANNOUNCEMENT,
    priority = NOTIFICATION_PRIORITIES.NORMAL,
    target,
    targetIdentifiers = [],
    actionUrl = null,
    actionLabel = null,
    sendEmail = false,
    expiresInDays = null,
    expiresAt = null,
    createdBy,
    actor = null,
  }) {
    const rawRecipients = await resolveBroadcastRecipients(target, targetIdentifiers);
    const uniqueRecipientsMap = new Map();
    for (const user of rawRecipients) {
      if (user?._id) {
        uniqueRecipientsMap.set(String(user._id), user);
      }
    }
    const recipients = Array.from(uniqueRecipientsMap.values());

    if (recipients.length === 0) {
      throw new ApiError(400, "No active recipients matched the selected target audience");
    }

    const safeUrl = sanitizeActionUrl(actionUrl);
    const now = deps.nowFn();
    let resolvedExpiresAt = null;
    if (expiresAt instanceof Date) {
      resolvedExpiresAt = expiresAt;
    } else if (Number.isFinite(Number(expiresInDays)) && Number(expiresInDays) > 0) {
      resolvedExpiresAt = new Date(
        now.getTime() + Number(expiresInDays) * 24 * 60 * 60 * 1000
      );
    } else {
      resolvedExpiresAt = new Date(
        now.getTime() + DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000
      );
    }

    const audience =
      target === NOTIFICATION_BROADCAST_TARGETS.ADMINS
        ? NOTIFICATION_AUDIENCES.ADMIN
        : NOTIFICATION_AUDIENCES.USER;

    const broadcast = await deps.NotificationBroadcastModel.create({
      title: String(title).trim().slice(0, 160),
      message: String(message).trim().slice(0, 1000),
      category,
      priority,
      target,
      targetUserIds:
        target === NOTIFICATION_BROADCAST_TARGETS.SPECIFIC_USERS
          ? recipients.map((r) => r._id)
          : [],
      actionUrl: safeUrl,
      actionLabel: actionLabel ? String(actionLabel).trim().slice(0, 60) : null,
      sendEmail: Boolean(sendEmail),
      expiresAt: resolvedExpiresAt,
      createdBy,
      stats: {
        targetedCount: recipients.length,
        deliveredCount: 0,
        emailSentCount: 0,
        failedCount: 0,
      },
    });

    const recipientIds = recipients.map((r) => r._id);
    const prefDocs = await deps.NotificationPreferenceModel.find({
      userId: { $in: recipientIds },
    }).lean();

    const prefMap = new Map();
    for (const p of prefDocs) {
      prefMap.set(String(p.userId), mergeStoredPreferencesRaw(p));
    }

    const docsToInsert = [];
    const emailRecipients = [];

    for (const recipient of recipients) {
      const uid = String(recipient._id);
      const prefs = prefMap.get(uid) || mergeStoredPreferencesRaw(null);
      const catPref = prefs.categories?.[category] || { inApp: true, email: false };
      const inAppAllowed = Boolean(prefs.channels.inApp && catPref.inApp !== false);
      const emailAllowed = Boolean(prefs.channels.email && catPref.email !== false);

      if (inAppAllowed) {
        docsToInsert.push({
          recipientId: recipient._id,
          audience,
          type: `broadcast.${category}`,
          category,
          priority,
          title: broadcast.title,
          message: broadcast.message,
          actionUrl: safeUrl,
          actionLabel: broadcast.actionLabel,
          actor: actor || { userId: createdBy },
          metadata: { broadcastId: broadcast._id.toString(), target },
          channels: {
            inApp: true,
            email: { sent: false, sentAt: null, error: null },
          },
          dedupeKey: `broadcast:${broadcast._id}:${uid}`,
          broadcastId: broadcast._id,
          expiresAt: resolvedExpiresAt,
        });
      }

      if (sendEmail && emailAllowed && recipient.email) {
        emailRecipients.push(recipient);
      }
    }

    let deliveredCount = 0;
    let failedCount = 0;
    const insertedDocs = [];

    for (let i = 0; i < docsToInsert.length; i += BROADCAST_CHUNK_SIZE) {
      const chunk = docsToInsert.slice(i, i + BROADCAST_CHUNK_SIZE);
      try {
        const inserted = await deps.NotificationModel.insertMany(chunk, {
          ordered: false,
        });
        deliveredCount += inserted.length;
        insertedDocs.push(...inserted);
      } catch (err) {
        const okCount = Array.isArray(err?.insertedDocs)
          ? err.insertedDocs.length
          : 0;
        deliveredCount += okCount;
        failedCount += Math.max(0, chunk.length - okCount);
        if (Array.isArray(err?.insertedDocs)) {
          insertedDocs.push(...err.insertedDocs);
        }
      }
    }

    await deps.NotificationBroadcastModel.updateOne(
      { _id: broadcast._id },
      {
        $set: {
          "stats.deliveredCount": deliveredCount,
          "stats.failedCount": failedCount,
        },
      }
    );

    // Emit live SSE events to any currently connected recipients
    for (const inserted of insertedDocs) {
      const uid = String(inserted.recipientId);
      if (deps.streamHub.hasActiveClient(uid)) {
        const serialized = serializeNotification(inserted);
        computeUnreadSummary(uid, { audience })
          .then(({ unreadCount }) => {
            deps.streamHub.emitToUser(
              uid,
              "notification:new",
              { notification: serialized, unreadCount, audience },
              { audience }
            );
          })
          .catch(() => {});
      }
    }

    if (sendEmail && emailRecipients.length > 0) {
      Promise.resolve().then(() =>
        dispatchBroadcastEmailsInBatches({
          broadcastId: broadcast._id,
          recipients: emailRecipients,
          title: broadcast.title,
          message: broadcast.message,
          category,
          priority,
          actionUrl: safeUrl,
          actionLabel: broadcast.actionLabel,
        })
      );
    }

    return {
      id: broadcast._id.toString(),
      title: broadcast.title,
      message: broadcast.message,
      category: broadcast.category,
      priority: broadcast.priority,
      target: broadcast.target,
      actionUrl: broadcast.actionUrl,
      actionLabel: broadcast.actionLabel,
      sendEmail: broadcast.sendEmail,
      expiresAt: broadcast.expiresAt,
      createdAt: broadcast.createdAt,
      stats: {
        targetedCount: recipients.length,
        deliveredCount,
        emailSentCount: 0,
        failedCount,
        emailQueuedCount: emailRecipients.length,
      },
    };
  }

  async function getBroadcastHistory({ page = 1, limit = 15 } = {}) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (safePage - 1) * safeLimit;

    const [docs, total] = await Promise.all([
      deps.NotificationBroadcastModel.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate("createdBy", "name email")
        .lean(),
      deps.NotificationBroadcastModel.countDocuments({}),
    ]);

    const broadcastIds = docs.map((d) => d._id);
    const readCountMap = new Map();

    if (
      broadcastIds.length > 0 &&
      typeof deps.NotificationModel.aggregate === "function"
    ) {
      const readStats = await deps.NotificationModel.aggregate([
        {
          $match: {
            broadcastId: { $in: broadcastIds },
            isRead: true,
          },
        },
        {
          $group: {
            _id: "$broadcastId",
            readCount: { $sum: 1 },
          },
        },
      ]);
      for (const row of readStats) {
        if (row?._id) {
          readCountMap.set(String(row._id), row.readCount || 0);
        }
      }
    }

    const broadcasts = docs.map((b) => {
      const id = b._id.toString();
      const deliveredCount = b.stats?.deliveredCount || 0;
      const readCount = readCountMap.get(id) || 0;
      const readRate =
        deliveredCount > 0
          ? Number(((readCount / deliveredCount) * 100).toFixed(1))
          : 0;

      return {
        id,
        title: b.title,
        message: b.message,
        category: b.category,
        priority: b.priority,
        target: b.target,
        actionUrl: b.actionUrl || null,
        actionLabel: b.actionLabel || null,
        sendEmail: Boolean(b.sendEmail),
        expiresAt: b.expiresAt || null,
        createdAt: b.createdAt,
        createdBy: b.createdBy
          ? {
              id: b.createdBy._id?.toString?.() || "",
              name: b.createdBy.name || "Admin",
              email: b.createdBy.email || "",
            }
          : null,
        stats: {
          targetedCount: b.stats?.targetedCount || 0,
          deliveredCount,
          emailSentCount: b.stats?.emailSentCount || 0,
          failedCount: b.stats?.failedCount || 0,
          readCount,
          readRate,
        },
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return {
      broadcasts,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  return {
    sanitizeActionUrl,
    getPreferences,
    updatePreferences,
    notifyUser,
    notifyAdmins,
    listNotifications,
    getUnreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    archiveNotification,
    unarchiveNotification,
    archiveAllRead,
    deleteNotification,
    sendBroadcast,
    getBroadcastHistory,
  };
}

export const notificationService = createNotificationService();
export default notificationService;
