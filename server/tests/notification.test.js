import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

// Deterministic test env defaults BEFORE importing config-dependent modules
process.env.NODE_ENV = "test";
process.env.GEMINI_ENCODER_KEY ||= "test-encoder-key";
process.env.SESSION_SECRET ||= "test-session-secret";
process.env.ACCESS_TOKEN_SECRET ||= "test-access-secret";
process.env.REFRESH_TOKEN_SECRET ||= "test-refresh-secret";
process.env.EMAIL_VERIFY_TOKEN_SECRET ||= "test-email-verify-secret";

const {
  getAllowedCategories,
  sanitizeActionUrl,
  createNotificationService,
} = await import("../src/services/notification/notification.service.js");

const { NotificationStreamHub } = await import(
  "../src/services/notification/notificationStream.service.js"
);

const {
  updateNotificationPreferencesSchema,
  broadcastNotificationSchema,
} = await import("../src/validations/index.js");

const {
  NOTIFICATION_AUDIENCES,
  NOTIFICATION_BROADCAST_TARGETS,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  USER_ROLES,
} = await import("../src/constants/index.js");

function cloneDoc(val) {
  if (val === null || val === undefined || typeof val !== "object") return val;
  if (val instanceof Date) return new Date(val.getTime());
  if (val instanceof mongoose.Types.ObjectId) {
    return new mongoose.Types.ObjectId(val.toString());
  }
  if (Array.isArray(val)) return val.map(cloneDoc);
  const out = {};
  for (const [k, v] of Object.entries(val)) {
    out[k] = cloneDoc(v);
  }
  return out;
}

function makeInMemoryNotificationEnv({
  users = [],
  appUsers = [],
  preferences = [],
} = {}) {
  const notifStore = [];
  const prefStore = [...preferences];
  const broadcastStore = [];
  const emittedEvents = [];
  const sentEmails = [];

  function matchesFilter(doc, filter) {
    for (const [key, val] of Object.entries(filter || {})) {
      if (key === "$or") {
        const matchedOr = val.some((sub) => matchesFilter(doc, sub));
        if (!matchedOr) return false;
        continue;
      }
      const docVal = doc[key];
      if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof mongoose.Types.ObjectId)) {
        if ("$in" in val) {
          const allowed = val.$in.map(String);
          if (!allowed.includes(String(docVal))) return false;
          continue;
        }
        if ("$ne" in val) {
          if (docVal === val.$ne) return false;
          continue;
        }
      }
      if (String(docVal) !== String(val)) return false;
    }
    return true;
  }

  function makeQuery(items) {
    let result = [...items];
    const chain = {
      select() {
        return chain;
      },
      populate() {
        return chain;
      },
      sort() {
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return chain;
      },
      skip(n) {
        result = result.slice(n);
        return chain;
      },
      limit(n) {
        result = result.slice(0, n);
        return chain;
      },
      lean() {
        return Promise.resolve(cloneDoc(result));
      },
      then(resolve, reject) {
        return Promise.resolve(cloneDoc(result)).then(resolve, reject);
      },
    };
    return chain;
  }

  const NotificationModel = {
    async create(payload) {
      if (payload.dedupeKey) {
        const dup = notifStore.find(
          (n) =>
            String(n.recipientId) === String(payload.recipientId) &&
            n.dedupeKey === payload.dedupeKey
        );
        if (dup) {
          const err = new Error("E11000 duplicate key error");
          err.code = 11000;
          throw err;
        }
      }
      const now = new Date();
      const doc = {
        _id: new mongoose.Types.ObjectId(),
        isRead: false,
        readAt: null,
        isArchived: false,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
        ...payload,
      };
      notifStore.push(doc);
      return cloneDoc(doc);
    },
    async insertMany(docs) {
      const inserted = [];
      for (const item of docs) {
        const doc = await this.create(item);
        inserted.push(doc);
      }
      return inserted;
    },
    find(filter) {
      return makeQuery(notifStore.filter((d) => matchesFilter(d, filter)));
    },
    async countDocuments(filter) {
      return notifStore.filter((d) => matchesFilter(d, filter)).length;
    },
    async findOneAndUpdate(filter, update) {
      const doc = notifStore.find((d) => matchesFilter(d, filter));
      if (!doc) return null;
      if (update.$set) {
        Object.assign(doc, update.$set);
      }
      doc.updatedAt = new Date();
      return cloneDoc(doc);
    },
    async findOneAndDelete(filter) {
      const idx = notifStore.findIndex((d) => matchesFilter(d, filter));
      if (idx < 0) return null;
      const [removed] = notifStore.splice(idx, 1);
      return cloneDoc(removed);
    },
    async updateOne(filter, update) {
      const doc = notifStore.find((d) => matchesFilter(d, filter));
      if (!doc) return { modifiedCount: 0 };
      if (update.$set) {
        for (const [k, v] of Object.entries(update.$set)) {
          const parts = k.split(".");
          let cur = doc;
          for (let i = 0; i < parts.length - 1; i++) {
            cur[parts[i]] ??= {};
            cur = cur[parts[i]];
          }
          cur[parts[parts.length - 1]] = v;
        }
      }
      return { modifiedCount: 1 };
    },
    async updateMany(filter, update) {
      let modifiedCount = 0;
      for (const doc of notifStore) {
        if (matchesFilter(doc, filter)) {
          if (update.$set) Object.assign(doc, update.$set);
          modifiedCount += 1;
        }
      }
      return { modifiedCount };
    },
  };

  const NotificationPreferenceModel = {
    findOne(filter) {
      const found =
        prefStore.find((p) => String(p.userId) === String(filter.userId)) ||
        null;
      return {
        lean: async () => (found ? cloneDoc(found) : null),
      };
    },
    find(filter) {
      const matched = prefStore.filter((p) => matchesFilter(p, filter));
      return makeQuery(matched);
    },
    async findOneAndUpdate(filter, update) {
      let doc = prefStore.find(
        (p) => String(p.userId) === String(filter.userId)
      );
      if (!doc) {
        doc = { _id: new mongoose.Types.ObjectId(), userId: filter.userId };
        prefStore.push(doc);
      }
      if (update.$set) {
        Object.assign(doc, update.$set);
      }
      return cloneDoc(doc);
    },
  };

  const NotificationBroadcastModel = {
    async create(payload) {
      const doc = {
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        ...payload,
      };
      broadcastStore.push(doc);
      return cloneDoc(doc);
    },
    async updateOne(filter, update) {
      const doc = broadcastStore.find(
        (b) => String(b._id) === String(filter._id)
      );
      if (!doc) return { modifiedCount: 0 };
      if (update.$set) {
        for (const [k, v] of Object.entries(update.$set)) {
          const parts = k.split(".");
          let cur = doc;
          for (let i = 0; i < parts.length - 1; i++) {
            cur[parts[i]] ??= {};
            cur = cur[parts[i]];
          }
          cur[parts[parts.length - 1]] = v;
        }
      }
      return { modifiedCount: 1 };
    },
    find() {
      return makeQuery(broadcastStore);
    },
    async countDocuments() {
      return broadcastStore.length;
    },
  };

  const UserModel = {
    find(filter) {
      return makeQuery(users.filter((u) => matchesFilter(u, filter)));
    },
    findById(id) {
      const found = users.find((u) => String(u._id) === String(id)) || null;
      return {
        select() {
          return {
            lean: async () => (found ? cloneDoc(found) : null),
          };
        },
      };
    },
  };

  const AppUserModel = {
    find(filter) {
      return makeQuery(
        appUsers.filter((au) => {
          if (filter["plan.type"]) {
            return au.plan?.type === filter["plan.type"] && au.isActive === filter.isActive;
          }
          return true;
        })
      );
    },
  };

  const streamHub = {
    emitToUser(userId, eventName, payload, opts) {
      emittedEvents.push({
        userId: String(userId),
        eventName,
        payload,
        opts,
      });
      return 1;
    },
    hasActiveClient() {
      return true;
    },
  };

  const sendEmailFn = async (payload) => {
    sentEmails.push(payload);
    return { sent: true };
  };

  const service = createNotificationService({
    NotificationModel,
    NotificationPreferenceModel,
    NotificationBroadcastModel,
    UserModel,
    AppUserModel,
    streamHub,
    sendEmailFn,
  });

  return {
    service,
    notifStore,
    prefStore,
    broadcastStore,
    emittedEvents,
    sentEmails,
  };
}

test("sanitizeActionUrl rejects XSS/open-redirect URLs and allows safe routes", () => {
  assert.equal(sanitizeActionUrl("/dashboard"), "/dashboard");
  assert.equal(sanitizeActionUrl("/admin/referral/123?tab=payouts"), "/admin/referral/123?tab=payouts");
  assert.equal(sanitizeActionUrl("https://genmeta.app/pricing"), "https://genmeta.app/pricing");
  assert.equal(sanitizeActionUrl("http://localhost:3000/dashboard"), "http://localhost:3000/dashboard");

  assert.equal(sanitizeActionUrl("javascript:alert(1)"), null);
  assert.equal(sanitizeActionUrl("data:text/html,<script>alert(1)</script>"), null);
  assert.equal(sanitizeActionUrl("//evil.example.com/phish"), null);
  assert.equal(sanitizeActionUrl("/dashboard\r\nSet-Cookie: evil=1"), null);
  assert.equal(sanitizeActionUrl(""), null);
});

test("notifyUser respects preferences, forceDeliver, dedupeKey, SSE emission, and async email", async () => {
  const userId = new mongoose.Types.ObjectId();
  const env = makeInMemoryNotificationEnv({
    users: [{ _id: userId, name: "Amina", email: "amina@example.com" }],
    preferences: [
      {
        userId,
        channels: { inApp: true, email: true },
        categories: {
          billing: { inApp: false, email: false },
          security: { inApp: false, email: false },
          plan: { inApp: true, email: true },
        },
      },
    ],
  });

  // 1. Blocked by preference
  const skipped = await env.service.notifyUser({
    recipientId: userId,
    type: "payment.completed",
    category: NOTIFICATION_CATEGORIES.BILLING,
    title: "Receipt",
    message: "Your payment succeeded.",
    sendEmail: true,
  });
  assert.equal(skipped.skippedByPreference, true);
  assert.equal(env.notifStore.length, 0);

  // 2. forceDeliver bypasses disabled preference for critical security alerts
  const forced = await env.service.notifyUser({
    recipientId: userId,
    type: "security.password_changed",
    category: NOTIFICATION_CATEGORIES.SECURITY,
    priority: NOTIFICATION_PRIORITIES.URGENT,
    title: "Password Changed",
    message: "Password updated.",
    actionUrl: "/dashboard/profile",
    forceDeliver: true,
    sendEmail: true,
    dedupeKey: "pw_change_1",
  });
  assert.equal(forced.delivered, true);
  assert.equal(env.notifStore.length, 1);
  assert.equal(env.emittedEvents.length, 1);
  assert.equal(env.emittedEvents[0].eventName, "notification:new");

  // Wait a microtask tick for fire-and-forget email dispatch
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(env.sentEmails.length, 1);
  assert.equal(env.sentEmails[0].email, "amina@example.com");

  // 3. Duplicate dedupeKey is silently deduplicated
  const dup = await env.service.notifyUser({
    recipientId: userId,
    type: "security.password_changed",
    category: NOTIFICATION_CATEGORIES.SECURITY,
    title: "Password Changed",
    message: "Password updated.",
    forceDeliver: true,
    dedupeKey: "pw_change_1",
  });
  assert.equal(dup.deduplicated, true);
  assert.equal(env.notifStore.length, 1);
});

test("notifyAdmins filters active verified admins, superAdminOnly, and excludeUserId", async () => {
  const admin1 = {
    _id: new mongoose.Types.ObjectId(),
    name: "Admin One",
    email: "admin1@genmeta.app",
    role: USER_ROLES.ADMIN,
    isDisabled: false,
    isVerified: true,
  };
  const superAdmin1 = {
    _id: new mongoose.Types.ObjectId(),
    name: "Super One",
    email: "super1@genmeta.app",
    role: USER_ROLES.SUPER_ADMIN,
    isDisabled: false,
    isVerified: true,
  };
  const disabledAdmin = {
    _id: new mongoose.Types.ObjectId(),
    name: "Disabled Admin",
    email: "disabled@genmeta.app",
    role: USER_ROLES.ADMIN,
    isDisabled: true,
    isVerified: true,
  };
  const regularUser = {
    _id: new mongoose.Types.ObjectId(),
    name: "User",
    email: "user@example.com",
    role: USER_ROLES.USER,
    isDisabled: false,
    isVerified: true,
  };

  const env = makeInMemoryNotificationEnv({
    users: [admin1, superAdmin1, disabledAdmin, regularUser],
  });

  const adminNotify = await env.service.notifyAdmins({
    type: "admin.withdrawal_requested",
    category: NOTIFICATION_CATEGORIES.REFERRAL,
    title: "New Withdrawal",
    message: "Pending payout",
    dedupeKey: "wd_1",
  });
  assert.equal(adminNotify.targeted, 2);
  assert.equal(env.notifStore.length, 2);
  assert.ok(env.notifStore.every((n) => n.audience === NOTIFICATION_AUDIENCES.ADMIN));

  const superOnly = await env.service.notifyAdmins({
    superAdminOnly: true,
    excludeUserId: superAdmin1._id,
    type: "system.backup_failed",
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    title: "Backup Failed",
    message: "Check backup DB",
  });
  assert.equal(superOnly.targeted, 0);

  const superOnlyDelivered = await env.service.notifyAdmins({
    superAdminOnly: true,
    type: "system.backup_failed",
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    title: "Backup Failed",
    message: "Check backup DB",
  });
  assert.equal(superOnlyDelivered.targeted, 1);
  assert.equal(String(env.notifStore[2].recipientId), String(superAdmin1._id));
});

test("Ownership enforcement blocks reading, archiving, or deleting another user's notification", async () => {
  const ownerId = new mongoose.Types.ObjectId();
  const attackerId = new mongoose.Types.ObjectId();
  const env = makeInMemoryNotificationEnv({
    users: [
      { _id: ownerId, name: "Owner", email: "owner@example.com" },
      { _id: attackerId, name: "Other", email: "other@example.com" },
    ],
  });

  const created = await env.service.notifyUser({
    recipientId: ownerId,
    type: "plan.credits_added",
    category: NOTIFICATION_CATEGORIES.PLAN,
    title: "Credits Added",
    message: "100 credits added.",
  });
  const notifId = created.notification.id;

  await assert.rejects(
    () => env.service.markAsRead(attackerId, notifId),
    (err) => err.statusCode === 404
  );
  await assert.rejects(
    () => env.service.archiveNotification(attackerId, notifId),
    (err) => err.statusCode === 404
  );
  await assert.rejects(
    () => env.service.deleteNotification(attackerId, notifId),
    (err) => err.statusCode === 404
  );
  await assert.rejects(
    () => env.service.markAsRead(ownerId, "not-an-object-id"),
    (err) => err.statusCode === 400
  );

  const readRes = await env.service.markAsRead(ownerId, notifId);
  assert.equal(readRes.notification.isRead, true);
  assert.equal(readRes.unreadCount, 0);

  const archiveRes = await env.service.archiveNotification(ownerId, notifId);
  assert.equal(archiveRes.notification.isArchived, true);

  const deleteRes = await env.service.deleteNotification(ownerId, notifId);
  assert.equal(deleteRes.id, notifId);
  assert.equal(env.notifStore.length, 0);
});

test("sendBroadcast resolves targeted plan segments, respects preferences, and tracks stats", async () => {
  const subUserId = new mongoose.Types.ObjectId();
  const freeUserId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();

  const env = makeInMemoryNotificationEnv({
    users: [
      { _id: subUserId, name: "Pro User", email: "pro@example.com", role: "user", isDisabled: false, isVerified: true },
      { _id: freeUserId, name: "Free User", email: "free@example.com", role: "user", isDisabled: false, isVerified: true },
      { _id: adminId, name: "Admin", email: "admin@genmeta.app", role: "admin", isDisabled: false, isVerified: true },
    ],
    appUsers: [
      { userId: subUserId, plan: { type: "subscription" }, isActive: true },
      { userId: freeUserId, plan: { type: "free" }, isActive: true },
    ],
  });

  const result = await env.service.sendBroadcast({
    title: "Pro Feature Launch",
    message: "Batch video keywording is now live!",
    category: NOTIFICATION_CATEGORIES.ANNOUNCEMENT,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    target: NOTIFICATION_BROADCAST_TARGETS.SUBSCRIPTION_USERS,
    actionUrl: "/dashboard",
    actionLabel: "Try Now",
    sendEmail: true,
    createdBy: adminId,
  });

  assert.equal(result.stats.targetedCount, 1);
  assert.equal(result.stats.deliveredCount, 1);
  assert.equal(env.notifStore.length, 1);
  assert.equal(String(env.notifStore[0].recipientId), String(subUserId));

  await new Promise((r) => setTimeout(r, 20));
  assert.equal(env.sentEmails.length, 1);
  assert.equal(env.sentEmails[0].email, "pro@example.com");
});

test("NotificationStreamHub enforces connection cap, filters by audience, and closes cleanly", () => {
  const hub = new NotificationStreamHub({
    maxConnectionsPerUser: 2,
    heartbeatIntervalMs: 60000,
  });

  const createMockRes = () => {
    const chunks = [];
    return {
      headers: {},
      ended: false,
      writableEnded: false,
      destroyed: false,
      chunks,
      setHeader(k, v) {
        this.headers[k] = v;
      },
      flushHeaders() {},
      write(chunk) {
        chunks.push(chunk);
      },
      end() {
        this.ended = true;
        this.writableEnded = true;
      },
    };
  };

  const userRes = createMockRes();
  const adminRes = createMockRes();
  const allRes = createMockRes();

  hub.addClient({ userId: "u1", role: "admin", scope: "user", res: userRes });
  hub.addClient({ userId: "u1", role: "admin", scope: "admin", res: adminRes });

  // Adding 3rd client should evict oldest (userRes)
  hub.addClient({ userId: "u1", role: "admin", scope: "all", res: allRes });
  assert.equal(userRes.ended, true);
  assert.equal(hub.getStats().totalConnections, 2);

  // Audience-scoped emit should hit adminRes and allRes
  const deliveredAdmin = hub.emitToUser(
    "u1",
    "notification:new",
    { id: "n1" },
    { audience: "admin" }
  );
  assert.equal(deliveredAdmin, 2);
  assert.equal(adminRes.chunks.length, 1);
  assert.equal(allRes.chunks.length, 1);

  // Audience "user" should hit allRes only (since userRes was evicted)
  const deliveredUser = hub.emitToUser(
    "u1",
    "notification:new",
    { id: "n2" },
    { audience: "user" }
  );
  assert.equal(deliveredUser, 1);
  assert.equal(adminRes.chunks.length, 1);
  assert.equal(allRes.chunks.length, 2);

  hub.closeAll();
  assert.equal(adminRes.ended, true);
  assert.equal(allRes.ended, true);
  assert.equal(hub.getStats().totalConnections, 0);
});

test("Notification Zod schemas validate preference updates and broadcast payloads", () => {
  const validPref = updateNotificationPreferencesSchema.safeParse({
    channels: { email: false },
    categories: { billing: { email: true } },
    toastEnabled: false,
  });
  assert.equal(validPref.success, true);

  const invalidPref = updateNotificationPreferencesSchema.safeParse({
    unknownField: true,
  });
  assert.equal(invalidPref.success, false);

  const validBroadcast = broadcastNotificationSchema.safeParse({
    title: "Maintenance Window",
    message: "Scheduled maintenance tonight at 02:00 UTC.",
    category: "system",
    priority: "high",
    target: "all_users",
    actionUrl: "/dashboard",
    sendEmail: false,
  });
  assert.equal(validBroadcast.success, true);

  const xssBroadcast = broadcastNotificationSchema.safeParse({
    title: "Click me",
    message: "Bad link test",
    target: "all_users",
    actionUrl: "javascript:alert(1)",
  });
  assert.equal(xssBroadcast.success, false);

  const missingSpecific = broadcastNotificationSchema.safeParse({
    title: "Targeted",
    message: "Missing targets",
    target: "specific_users",
    targetIdentifiers: [],
  });
  assert.equal(missingSpecific.success, false);
});

test("Role-strict category filtering isolates System alerts to SuperAdmins in admin scope", async () => {
  assert.deepEqual(getAllowedCategories(USER_ROLES.USER, "user"), [
    "billing",
    "plan",
    "referral",
    "security",
    "announcement",
  ]);
  assert.deepEqual(getAllowedCategories(USER_ROLES.ADMIN, "admin"), [
    "billing",
    "referral",
    "security",
    "announcement",
  ]);
  assert.deepEqual(getAllowedCategories(USER_ROLES.SUPER_ADMIN, "admin"), [
    "billing",
    "referral",
    "security",
    "system",
    "announcement",
  ]);

  const userId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const superAdminId = new mongoose.Types.ObjectId();

  const env = makeInMemoryNotificationEnv({
    users: [
      { _id: userId, name: "User", email: "user@example.com", role: USER_ROLES.USER },
      { _id: adminId, name: "Admin", email: "admin@genmeta.app", role: USER_ROLES.ADMIN },
      { _id: superAdminId, name: "Super", email: "super@genmeta.app", role: USER_ROLES.SUPER_ADMIN },
    ],
  });

  // 1. User preferences exclude "system" and ignore attempts to mutate "system"
  const userPrefs = await env.service.getPreferences(userId, {
    role: USER_ROLES.USER,
    scope: "user",
  });
  assert.equal("system" in userPrefs.categories, false);
  assert.equal("plan" in userPrefs.categories, true);

  const updatedUserPrefs = await env.service.updatePreferences(
    userId,
    { categories: { system: { email: true }, billing: { email: false } } },
    { role: USER_ROLES.USER, scope: "user" }
  );
  assert.equal("system" in updatedUserPrefs.categories, false);
  assert.equal(updatedUserPrefs.categories.billing.email, false);

  // 2. Regular admin in admin scope also excludes "system"
  const adminPrefs = await env.service.getPreferences(adminId, {
    role: USER_ROLES.ADMIN,
    scope: "admin",
  });
  assert.equal("system" in adminPrefs.categories, false);

  // 3. SuperAdmin in admin scope sees and updates "system"
  const superPrefs = await env.service.getPreferences(superAdminId, {
    role: USER_ROLES.SUPER_ADMIN,
    scope: "admin",
  });
  assert.equal("system" in superPrefs.categories, true);
  assert.equal(superPrefs.categories.system.email, false);

  const updatedSuperPrefs = await env.service.updatePreferences(
    superAdminId,
    { categories: { system: { email: true } } },
    { role: USER_ROLES.SUPER_ADMIN, scope: "admin" }
  );
  assert.equal(updatedSuperPrefs.categories.system.email, true);

  // Updating user-scope prefs for SuperAdmin must not wipe out admin-scope "system" pref
  await env.service.updatePreferences(
    superAdminId,
    { categories: { billing: { email: false } } },
    { role: USER_ROLES.SUPER_ADMIN, scope: "user" }
  );
  const recheckedSuperPrefs = await env.service.getPreferences(superAdminId, {
    role: USER_ROLES.SUPER_ADMIN,
    scope: "admin",
  });
  assert.equal(recheckedSuperPrefs.categories.system.email, true);

  // 4. listNotifications & getUnreadCount filter out "system" for user and regular admin
  await env.service.notifyUser({
    recipientId: userId,
    audience: NOTIFICATION_AUDIENCES.USER,
    type: "system.maintenance",
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    title: "Internal Maintenance",
    message: "Should not be visible to user",
  });
  await env.service.notifyUser({
    recipientId: userId,
    audience: NOTIFICATION_AUDIENCES.USER,
    type: "payment.completed",
    category: NOTIFICATION_CATEGORIES.BILLING,
    title: "Payment Confirmed",
    message: "Visible billing alert",
  });
  await env.service.notifyUser({
    recipientId: superAdminId,
    audience: NOTIFICATION_AUDIENCES.ADMIN,
    type: "system.backup_completed",
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    title: "Backup Finished",
    message: "Visible to SuperAdmin",
  });

  const userList = await env.service.listNotifications(userId, {
    scope: "user",
    isAdmin: false,
    role: USER_ROLES.USER,
  });
  assert.equal(userList.notifications.length, 1);
  assert.equal(userList.notifications[0].category, "billing");
  assert.equal(userList.unreadCount, 1);

  const superList = await env.service.listNotifications(superAdminId, {
    scope: "admin",
    isAdmin: true,
    role: USER_ROLES.SUPER_ADMIN,
  });
  assert.equal(superList.notifications.length, 1);
  assert.equal(superList.notifications[0].category, "system");
});
