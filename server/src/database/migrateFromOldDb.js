import crypto from "crypto";
import { MongoClient, ObjectId } from "mongodb";

const DEFAULT_SOURCE_URI = "mongodb://localhost:27017";
const DEFAULT_SOURCE_DB = "GenMeta_old";
const DEFAULT_TARGET_URI = "mongodb://127.0.0.1:27017";
const DEFAULT_TARGET_DB = "GenMetaApp";
const DEFAULT_BATCH_SIZE = 1000;

const VALID_ROLES = new Set(["user", "admin", "superAdmin"]);
const VALID_LOGIN_PROVIDERS = new Set(["email", "google"]);
const VALID_PLAN_TYPES = new Set(["free", "credit", "subscription"]);
const VALID_PROMO_APPLIES_TO = new Set(["subscription", "credit", "both"]);
const VALID_WITHDRAWAL_STATUSES = new Set(["pending", "completed", "rejected"]);
const ISO_DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

const APPLIED_MIGRATION_FILES = [
  "001_initial_indexes.js",
  "002_normalize_referrals_and_promocodes.js",
  "003_normalize_appkeys_and_pricing.js",
  "004_migrate_appkeys_to_appusers.js",
  "005_payment_transactions_indexes.js",
  "006_notifications_indexes.js",
];

function toObjectId(value) {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value.trim())) {
    return new ObjectId(value.trim());
  }
  return null;
}

function toValidDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function roundBdt(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function normalizeMongoEndpoint(uri) {
  const raw = String(uri || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    const protocol = parsed.protocol.toLowerCase();
    const hostList = parsed.hostname
      .split(",")
      .map((h) => {
        const lower = h.trim().toLowerCase();
        if (lower === "localhost" || lower === "127.0.0.1" || lower === "::1" || lower === "[::1]") {
          return "127.0.0.1";
        }
        return lower;
      })
      .sort()
      .join(",");
    const port = protocol === "mongodb+srv:" ? "srv" : parsed.port || "27017";
    return `${protocol}//${hostList}:${port}`;
  } catch {
    return raw.replace(/localhost/gi, "127.0.0.1").replace(/\/+$/, "").toLowerCase();
  }
}

function assertSourceAndTargetDistinct(sourceUri, sourceDbName, targetUri, targetDbName) {
  const srcEndpoint = normalizeMongoEndpoint(sourceUri);
  const tgtEndpoint = normalizeMongoEndpoint(targetUri);
  if (srcEndpoint === tgtEndpoint && sourceDbName === targetDbName) {
    throw new Error(
      `Refusing to migrate: source database [${sourceDbName}] and target database [${targetDbName}] resolve to the same MongoDB endpoint (${srcEndpoint}).`
    );
  }
}

/**
 * Wraps a MongoDB Db instance exposing ONLY read-only operations so source
 * collections can never be mutated by migration code.
 */
function createReadOnlyDb(db) {
  return {
    databaseName: db.databaseName,
    listCollections(filter = {}, options = {}) {
      return db.listCollections(filter, options);
    },
    collection(name) {
      const col = db.collection(name);
      return {
        collectionName: name,
        find: (query = {}, options = {}) => col.find(query, options),
        findOne: (query = {}, options = {}) => col.findOne(query, options),
        countDocuments: (query = {}, options = {}) => col.countDocuments(query, options),
        aggregate: (pipeline = [], options = {}) => col.aggregate(pipeline, options),
        distinct: (key, query = {}, options = {}) => col.distinct(key, query, options),
        indexes: (options = {}) => col.indexes(options),
      };
    },
  };
}

async function captureCollectionSnapshot(db) {
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const snapshot = {};
  for (const { name } of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    if (name.startsWith("system.")) continue;
    snapshot[name] = await db.collection(name).countDocuments();
  }
  return snapshot;
}

function verifySourceSnapshotUnchanged(beforeSnapshot, afterSnapshot) {
  const beforeKeys = Object.keys(beforeSnapshot);
  const afterKeys = Object.keys(afterSnapshot);
  if (beforeKeys.length !== afterKeys.length) {
    throw new Error(
      `Source database integrity check failed: collection count changed (${beforeKeys.length} -> ${afterKeys.length}).`
    );
  }
  for (const name of beforeKeys) {
    if (beforeSnapshot[name] !== afterSnapshot[name]) {
      throw new Error(
        `Source database integrity check failed: collection [${name}] document count changed (${beforeSnapshot[name]} -> ${afterSnapshot[name]}).`
      );
    }
  }
  return true;
}

async function safeCreateIndex(collection, keySpec, options = {}) {
  try {
    await collection.createIndex(keySpec, options);
  } catch (err) {
    if (err.code === 85 || err.codeName === "IndexOptionsConflict") {
      return;
    }
    throw err;
  }
}

async function insertInBatches(collection, docs, batchSize, dryRun) {
  if (!docs || docs.length === 0 || dryRun) {
    return docs ? docs.length : 0;
  }
  let inserted = 0;
  for (let i = 0; i < docs.length; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize);
    await collection.insertMany(chunk, { ordered: true });
    inserted += chunk.length;
  }
  return inserted;
}

function collectDeviceIds(doc) {
  const ids = [];
  const seen = new Set();
  const pushId = (val) => {
    if (typeof val !== "string") return;
    const trimmed = val.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      ids.push(trimmed);
    }
  };

  if (Array.isArray(doc?.devices)) {
    for (const d of doc.devices) {
      pushId(d?.deviceId);
    }
  }
  if (Array.isArray(doc?.allowedDevices)) {
    for (const id of doc.allowedDevices) {
      pushId(id);
    }
  }
  pushId(doc?.deviceId);
  return ids;
}

function buildDevicesArray(existingDevices, deviceIds, firstDate, lastDate) {
  const byId = new Map();
  if (Array.isArray(existingDevices)) {
    for (const d of existingDevices) {
      if (d?.deviceId && typeof d.deviceId === "string") {
        const trimmedId = d.deviceId.trim();
        if (trimmedId && !byId.has(trimmedId)) {
          byId.set(trimmedId, {
            deviceId: trimmedId,
            fingerprint: d.fingerprint || null,
            deviceName: d.deviceName || "Desktop Device",
            platform: d.platform || "unknown",
            osVersion: d.osVersion || "",
            arch: d.arch || "",
            cpuModel: d.cpuModel || "",
            appVersion: d.appVersion || "",
            ipAddress: d.ipAddress || "",
            firstLoginAt: toValidDate(d.firstLoginAt) || firstDate,
            lastActiveAt: toValidDate(d.lastActiveAt) || lastDate,
          });
        }
      }
    }
  }

  return deviceIds.map((id) => {
    if (byId.has(id)) {
      return byId.get(id);
    }
    return {
      deviceId: id,
      fingerprint: null,
      deviceName: "Registered Device",
      platform: "unknown",
      osVersion: "",
      arch: "",
      cpuModel: "",
      appVersion: "",
      ipAddress: "",
      firstLoginAt: firstDate,
      lastActiveAt: lastDate,
    };
  });
}

function mergeNumericMaps(docs, fieldName) {
  const merged = {};
  for (const doc of docs) {
    const src = doc?.[fieldName];
    if (!src || typeof src !== "object") continue;
    const entries = src instanceof Map ? src.entries() : Object.entries(src);
    for (const [k, v] of entries) {
      if (!k) continue;
      const num = Number(v);
      if (!Number.isFinite(num)) continue;
      merged[k] = (merged[k] || 0) + Math.max(0, num);
    }
  }
  return merged;
}

function mergeFailedProcessMaps(docs) {
  const merged = {};
  for (const doc of docs) {
    const src = doc?.failedProcess;
    if (!src || typeof src !== "object") continue;
    const entries = src instanceof Map ? src.entries() : Object.entries(src);
    for (const [dayKey, val] of entries) {
      if (!dayKey) continue;
      if (!merged[dayKey]) {
        merged[dayKey] = { count: 0, errorMessages: [] };
      }
      if (typeof val === "number" && Number.isFinite(val)) {
        merged[dayKey].count += Math.max(0, val);
      } else if (val && typeof val === "object") {
        const count = Number(val.count);
        if (Number.isFinite(count)) {
          merged[dayKey].count += Math.max(0, count);
        }
        if (Array.isArray(val.errorMessages)) {
          for (const msg of val.errorMessages) {
            if (typeof msg === "string" && msg.trim()) {
              merged[dayKey].errorMessages.push(msg.trim());
            }
          }
        }
      }
    }
  }
  return merged;
}

function getPlanRank(planType) {
  if (planType === "subscription") return 2;
  if (planType === "credit") return 1;
  return 0;
}

function resolvePaymentPlanSnapshot(pay, pricingById) {
  const rawPlan = pay?.plan;
  const payerRef = String(pay?.paymentDetails?.payerReference || "").trim();
  const payerRefParts = payerRef.split("-").filter(Boolean);
  const payerRefPlanId =
    payerRefParts.length >= 2 && ObjectId.isValid(payerRefParts[1]) ? payerRefParts[1] : null;

  if (typeof rawPlan === "string") {
    const rawStr = rawPlan.trim();
    const pricing = payerRefPlanId ? pricingById.get(payerRefPlanId) : null;
    const inferredType =
      pricing?.type || (rawStr.toLowerCase().includes("credit") ? "credit" : "subscription");
    const inferredName =
      pricing?.name || (rawStr.toLowerCase() === "monthly" ? "Monthly Subscription" : rawStr || "Plan");
    return {
      repaired: true,
      id: payerRefPlanId || `legacy-${rawStr.toLowerCase().replace(/\s+/g, "-") || "plan"}`,
      type: inferredType,
      name: inferredName,
      planDuration: pricing?.planDuration ?? null,
      credit: pricing?.credit ?? null,
    };
  }

  if (rawPlan && typeof rawPlan === "object") {
    const rawId = rawPlan.id ? String(rawPlan.id).trim() : payerRefPlanId;
    const pricing = rawId ? pricingById.get(rawId) : null;
    const rawType = typeof rawPlan.type === "string" ? rawPlan.type.trim() : "";
    const rawName = typeof rawPlan.name === "string" ? rawPlan.name.trim() : "";

    const validType = VALID_PLAN_TYPES.has(rawType) && rawType !== "free"
      ? rawType
      : pricing?.type ||
        (rawType.toLowerCase().includes("credit") ? "credit" : "subscription");

    const resolvedName =
      rawName ||
      pricing?.name ||
      (rawType && !VALID_PLAN_TYPES.has(rawType) ? rawType : "Plan");

    const resolvedId = rawId || "legacy-plan";
    const wasRepaired = !rawPlan.id || !VALID_PLAN_TYPES.has(rawType) || !rawName;

    return {
      repaired: wasRepaired,
      id: resolvedId,
      type: validType,
      name: resolvedName,
      planDuration: pricing?.planDuration ?? pay?.paymentDetails?.checkoutItems?.planDuration ?? null,
      credit: pricing?.credit ?? pay?.paymentDetails?.checkoutItems?.credit ?? null,
    };
  }

  const pricing = payerRefPlanId ? pricingById.get(payerRefPlanId) : null;
  return {
    repaired: true,
    id: payerRefPlanId || "legacy-plan",
    type: pricing?.type || "subscription",
    name: pricing?.name || "Plan",
    planDuration: pricing?.planDuration ?? null,
    credit: pricing?.credit ?? null,
  };
}

async function buildAllTargetIndexes(targetDb) {
  // 1. users
  await targetDb.collection("users").createIndexes([
    { key: { email: 1 }, unique: true, name: "uniq_email" },
    {
      key: { googleId: 1 },
      unique: true,
      partialFilterExpression: { googleId: { $type: "string" } },
      name: "uniq_googleId",
    },
    { key: { role: 1, isVerified: 1, createdAt: -1 }, name: "idx_role_verified_created" },
    { key: { isVerified: 1 }, name: "idx_users_verified" },
    { key: { isDisabled: 1 }, name: "idx_users_disabled" },
    { key: { referred: 1 }, name: "idx_users_referred" },
  ]);

  // 2. apppricings
  await targetDb.collection("apppricings").createIndexes([
    { key: { isActive: 1, type: 1, basePrice: 1 }, name: "idx_pricing_active_type" },
    { key: { name: 1 }, name: "idx_pricing_name" },
    { key: { type: 1 }, name: "idx_pricing_type" },
  ]);

  // 3. appusers
  await targetDb.collection("appusers").createIndexes([
    { key: { userId: 1 }, unique: true, name: "uniq_appuser_userId" },
    { key: { key: 1 }, unique: true, name: "uniq_appuser_key" },
    { key: { username: 1 }, unique: true, name: "uniq_appuser_username" },
    { key: { "plan.type": 1, expiresAt: 1 }, name: "idx_appuser_plan_expires" },
    { key: { "plan.type": 1, credit: 1 }, name: "idx_appuser_plan_credit" },
    { key: { "plan.type": 1, lastCreditRefresh: 1 }, name: "idx_appuser_plan_refresh" },
    { key: { isActive: 1, status: 1 }, name: "idx_appuser_active_status" },
    { key: { userId: 1, isActive: 1 }, name: "idx_appuser_user_active" },
    { key: { createdAt: -1 }, name: "idx_appuser_created" },
  ]);

  // 4. dailyapiusages
  await targetDb.collection("dailyapiusages").createIndexes([
    { key: { appUserId: 1, date: 1 }, unique: true, name: "uniq_appuser_date" },
    { key: { userId: 1, date: 1 }, name: "idx_user_date" },
    { key: { date: 1 }, name: "idx_usage_date" },
  ]);

  // 5. apppayments
  await targetDb.collection("apppayments").createIndexes([
    { key: { paymentID: 1 }, unique: true, name: "uniq_paymentID" },
    { key: { trxID: 1 }, unique: true, name: "uniq_trxID" },
    { key: { userId: 1, createdAt: -1 }, name: "idx_payment_user_created" },
    { key: { createdAt: -1, status: 1 }, name: "idx_payment_created_status" },
    { key: { gateway: 1, createdAt: -1 }, name: "idx_payment_gateway_created" },
    { key: { transactionId: 1 }, name: "idx_payment_transactionId" },
  ]);

  // 6. paymenttransactions
  await targetDb.collection("paymenttransactions").createIndexes([
    { key: { invoiceNumber: 1 }, unique: true, name: "uniq_tx_invoiceNumber" },
    {
      key: { trxId: 1 },
      unique: true,
      partialFilterExpression: { trxId: { $type: "string" } },
      name: "uniq_tx_trxId",
    },
    {
      key: { userId: 1, activeIdempotencyKey: 1 },
      unique: true,
      partialFilterExpression: { activeIdempotencyKey: { $type: "string" } },
      name: "uniq_tx_user_activeIdempotencyKey",
    },
    { key: { userId: 1, createdAt: -1 }, name: "idx_tx_user_created" },
    { key: { status: 1, expiresAt: 1 }, name: "idx_tx_status_expires" },
    { key: { status: 1, createdAt: -1 }, name: "idx_tx_status_created" },
  ]);

  // 7. promocodes
  await targetDb.collection("promocodes").createIndexes([
    { key: { code: 1 }, unique: true, name: "uniq_promocode_code" },
    { key: { isActive: 1, validFrom: 1, validUntil: 1 }, name: "idx_promo_active_validity" },
  ]);

  // 8. promocoderedemptions
  await targetDb.collection("promocoderedemptions").createIndexes([
    { key: { promoCodeId: 1, userId: 1 }, unique: true, name: "uniq_promo_user_redemption" },
    { key: { userId: 1, createdAt: -1 }, name: "idx_redemption_user_created" },
    { key: { code: 1 }, name: "idx_redemption_code" },
  ]);

  // 9. referrals
  await targetDb.collection("referrals").createIndexes([
    { key: { referralCode: 1 }, unique: true, name: "uniq_referral_code" },
    { key: { referrer: 1 }, unique: true, name: "uniq_referral_referrer" },
    { key: { availableBalance: -1 }, name: "idx_referral_balance" },
  ]);

  // 10. referralearnings
  await targetDb.collection("referralearnings").createIndexes([
    { key: { referralId: 1, referredUserId: 1 }, unique: true, name: "uniq_ref_earning" },
    { key: { referrerId: 1, createdAt: -1 }, name: "idx_referrer_created" },
    { key: { referredUserId: 1 }, name: "idx_ref_earning_referred" },
  ]);

  // 11. referralwithdrawals
  await targetDb.collection("referralwithdrawals").createIndexes([
    { key: { status: 1, requestedAt: -1 }, name: "idx_withdrawal_status_req" },
    { key: { userId: 1, requestedAt: -1 }, name: "idx_withdrawal_user_req" },
    { key: { referralId: 1 }, name: "idx_withdrawal_referralId" },
  ]);

  // 12. aiapis
  await targetDb.collection("aiapis").createIndexes([
    { key: { isActive: 1 }, name: "idx_aiapi_active" },
  ]);

  // 13. sessions (new v2 collection)
  await safeCreateIndex(
    targetDb.collection("sessions"),
    { userId: 1, revokedAt: 1, expiresAt: 1 },
    { name: "idx_session_user_revoked_exp" }
  );
  await safeCreateIndex(targetDb.collection("sessions"), { tokenHash: 1 }, { name: "idx_session_tokenHash" });
  await safeCreateIndex(targetDb.collection("sessions"), { tokenFamily: 1 }, { name: "idx_session_tokenFamily" });
  await safeCreateIndex(
    targetDb.collection("sessions"),
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "ttl_session_expiresAt" }
  );

  // 14. authtokens (new v2 collection)
  await safeCreateIndex(
    targetDb.collection("authtokens"),
    { userId: 1, type: 1, usedAt: 1 },
    { name: "idx_authtoken_user_type_used" }
  );
  await safeCreateIndex(targetDb.collection("authtokens"), { email: 1 }, { name: "idx_authtoken_email" });
  await safeCreateIndex(targetDb.collection("authtokens"), { codeHash: 1 }, { name: "idx_authtoken_codeHash" });
  await safeCreateIndex(targetDb.collection("authtokens"), { linkTokenHash: 1 }, { name: "idx_authtoken_linkTokenHash" });
  await safeCreateIndex(
    targetDb.collection("authtokens"),
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "ttl_authtoken_expiresAt" }
  );

  // 15. backuplogs (new v2 collection)
  await safeCreateIndex(targetDb.collection("backuplogs"), { timestamp: -1 }, { name: "idx_backuplog_ts" });
  await safeCreateIndex(
    targetDb.collection("backuplogs"),
    { success: 1, timestamp: -1 },
    { name: "idx_backuplog_success_ts" }
  );
  await safeCreateIndex(
    targetDb.collection("backuplogs"),
    { triggeredBy: 1, timestamp: -1 },
    { name: "idx_backuplog_trigger_ts" }
  );

  // 16. notifications (new v2 collection)
  await safeCreateIndex(
    targetDb.collection("notifications"),
    { recipientId: 1, audience: 1, isArchived: 1, createdAt: -1 },
    { name: "idx_notif_recipient_feed" }
  );
  await safeCreateIndex(
    targetDb.collection("notifications"),
    { recipientId: 1, audience: 1, isRead: 1, isArchived: 1 },
    { name: "idx_notif_recipient_unread" }
  );
  await safeCreateIndex(
    targetDb.collection("notifications"),
    { recipientId: 1, category: 1, isArchived: 1, createdAt: -1 },
    { name: "idx_notif_recipient_category" }
  );
  await safeCreateIndex(
    targetDb.collection("notifications"),
    { recipientId: 1, dedupeKey: 1 },
    {
      unique: true,
      partialFilterExpression: { dedupeKey: { $type: "string" } },
      name: "uniq_notif_recipient_dedupe",
    }
  );
  await safeCreateIndex(
    targetDb.collection("notifications"),
    { broadcastId: 1, isRead: 1 },
    { name: "idx_notif_broadcast_read" }
  );
  await safeCreateIndex(
    targetDb.collection("notifications"),
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "ttl_notif_expiresAt" }
  );

  // 17. notificationpreferences (new v2 collection)
  await safeCreateIndex(
    targetDb.collection("notificationpreferences"),
    { userId: 1 },
    { unique: true, name: "uniq_notifpref_userId" }
  );

  // 18. notificationbroadcasts (new v2 collection)
  await safeCreateIndex(
    targetDb.collection("notificationbroadcasts"),
    { createdAt: -1 },
    { name: "idx_notifbroadcast_created" }
  );
}

/**
 * Migrates data from the legacy GenMeta MongoDB database (e.g. `GenMeta_old`)
 * into a target v2 MongoDB database while keeping the source database completely untouched.
 *
 * @param {Object} [options]
 * @param {string} [options.sourceUri]
 * @param {string} [options.sourceDbName]
 * @param {string} [options.targetUri]
 * @param {string} [options.targetDbName]
 * @param {boolean} [options.dropTarget=false]
 * @param {boolean} [options.dryRun=false]
 * @param {boolean} [options.includeLegacyOrders=true]
 * @param {boolean} [options.includePaymentTransactions=true]
 * @param {number} [options.batchSize=1000]
 * @param {Console} [options.logger=console]
 */
export async function migrateFromOldDatabase(options = {}) {
  const {
    sourceUri = process.env.SOURCE_URI || DEFAULT_SOURCE_URI,
    sourceDbName = process.env.SOURCE_DB || DEFAULT_SOURCE_DB,
    targetUri = process.env.TARGET_URI || process.env.MONGODB_URI || DEFAULT_TARGET_URI,
    targetDbName = process.env.TARGET_DB || process.env.DB_NAME || DEFAULT_TARGET_DB,
    dropTarget = false,
    dryRun = false,
    includeLegacyOrders = true,
    includePaymentTransactions = true,
    batchSize = DEFAULT_BATCH_SIZE,
    logger = console,
  } = options;

  assertSourceAndTargetDistinct(sourceUri, sourceDbName, targetUri, targetDbName);

  const effectiveBatchSize = Math.max(100, Number(batchSize) || DEFAULT_BATCH_SIZE);
  const startedAt = Date.now();
  const warnings = [];
  const log = (...args) => logger?.log?.(...args);
  const warn = (msg) => {
    warnings.push(msg);
    logger?.warn?.(`   ⚠ ${msg}`);
  };

  log("======================================================================");
  log("          GENMETA LEGACY -> V2 DATABASE MIGRATION                     ");
  log("======================================================================");
  log(`Mode:            ${dryRun ? "DRY RUN (NO WRITES)" : "LIVE MIGRATION"}`);
  log(`Source (RO):     ${sourceUri} [${sourceDbName}]`);
  log(`Target (WRITE):  ${targetUri} [${targetDbName}]`);
  log("======================================================================\n");

  const sourceClient = new MongoClient(sourceUri, {
    readPreference: "secondaryPreferred",
    serverSelectionTimeoutMS: 8000,
  });
  const targetClient = dryRun
    ? null
    : new MongoClient(targetUri, { serverSelectionTimeoutMS: 8000 });

  const stats = {
    users: { source: 0, migrated: 0, skippedDuplicatesOrInvalid: 0 },
    apppricings: { source: 0, migrated: 0 },
    appusers: {
      sourceLegacyDocs: 0,
      migratedFromLegacy: 0,
      duplicatesConsolidated: 0,
      orphansSkipped: 0,
      backfilledMissingUsers: 0,
      totalMigrated: 0,
      dailyUsageLogsExtracted: 0,
    },
    apppayments: {
      sourcePayments: 0,
      migratedFromPayments: 0,
      malformedPlansRepaired: 0,
      migratedFromCompletedOrders: 0,
      totalMigrated: 0,
    },
    orders: {
      source: 0,
      completedConvertedToPayments: 0,
      cancelledConvertedToTransactions: 0,
      pendingConvertedToExpiredTransactions: 0,
    },
    paymenttransactions: { totalMigrated: 0 },
    promocodes: { source: 0, migrated: 0, redemptionsExtracted: 0 },
    referrals: {
      source: 0,
      migrated: 0,
      earningsExtracted: 0,
      withdrawalsExtracted: 0,
    },
    aiapis: { source: 0, migrated: 0 },
    bkashtokens: { source: 0, skippedDeprecated: 0 },
  };

  try {
    await sourceClient.connect();
    if (targetClient) {
      await targetClient.connect();
    }

    const sourceDb = createReadOnlyDb(sourceClient.db(sourceDbName));
    const targetDb = targetClient ? targetClient.db(targetDbName) : null;

    // Snapshot source before any work
    const sourceBeforeSnapshot = await captureCollectionSnapshot(sourceDb);
    log("✓ Source read-only snapshot captured.");

    // Target overwrite protection
    if (!dryRun && targetDb) {
      const existingTargetCollections = await targetDb
        .listCollections({}, { nameOnly: true })
        .toArray();
      const nonEmptyCollections = [];
      for (const { name } of existingTargetCollections) {
        if (name.startsWith("system.")) continue;
        const cnt = await targetDb.collection(name).countDocuments();
        if (cnt > 0) {
          nonEmptyCollections.push(`${name}(${cnt})`);
        }
      }
      if (nonEmptyCollections.length > 0 && !dropTarget) {
        throw new Error(
          `Target database [${targetDbName}] is not empty (${nonEmptyCollections.join(", ")}). Pass dropTarget: true (or --drop-target) to replace it, or specify a fresh target database.`
        );
      }
      if (dropTarget) {
        log(`Resetting target database [${targetDbName}]...`);
        await targetDb.dropDatabase();
        log(`✓ Clean target database initialized.\n`);
      }
    }

    // ------------------------------------------------------------------
    // STEP 1: USERS
    // ------------------------------------------------------------------
    log("▶ [1/8] Transforming & Migrating Users...");
    const usersById = new Map();
    const seenEmails = new Set();
    const seenGoogleIds = new Set();
    const userDocsToInsert = [];

    const usersCursor = sourceDb.collection("users").find({});
    for await (const user of usersCursor) {
      stats.users.source++;
      const uid = toObjectId(user._id);
      const email = String(user.email || "").trim().toLowerCase();

      if (!uid || !email || seenEmails.has(email)) {
        stats.users.skippedDuplicatesOrInvalid++;
        warn(`Skipped invalid or duplicate user email (${user._id} / ${email || "empty"})`);
        continue;
      }
      seenEmails.add(email);

      let name = String(user.name || "").trim();
      if (name.length < 2) {
        name = email.split("@")[0] || "User";
        if (name.length < 2) name = "User";
      }

      const googleId =
        typeof user.googleId === "string" && user.googleId.trim() !== ""
          ? user.googleId.trim()
          : null;

      let loginProvider = Array.isArray(user.loginProvider)
        ? user.loginProvider.filter((p) => VALID_LOGIN_PROVIDERS.has(p))
        : [];
      if (loginProvider.length === 0) {
        loginProvider = googleId ? ["google"] : ["email"];
      }

      const role = VALID_ROLES.has(user.role) ? user.role : "user";
      const createdAt = toValidDate(user.createdAt) || new Date();
      const updatedAt = toValidDate(user.updatedAt) || createdAt;
      const referredObjId = toObjectId(user.referred);

      const transformedUser = {
        _id: uid,
        name,
        email,
        avatar: user.avatar || user.profilePicture || null,
        isVerified: Boolean(user.isVerified),
        isDisabled: Boolean(user.isDisabled),
        referred: referredObjId || null,
        ipAddress: user.ipAddress ? String(user.ipAddress).trim() : null,
        verificationToken: user.verificationToken || null,
        loginProvider,
        refreshToken: user.refreshToken || null,
        role,
        passwordChangedAt: toValidDate(user.passwordChangedAt) || null,
        failedLoginAttempts: Number(user.failedLoginAttempts) || 0,
        lockUntil: toValidDate(user.lockUntil) || null,
        lastLoginAt: toValidDate(user.lastLoginAt) || null,
        createdAt,
        updatedAt,
      };

      if (typeof user.password === "string" && user.password.length > 0) {
        transformedUser.password = user.password;
      }

      if (googleId && !seenGoogleIds.has(googleId)) {
        seenGoogleIds.add(googleId);
        transformedUser.googleId = googleId;
      } else if (googleId && seenGoogleIds.has(googleId)) {
        warn(`Duplicate googleId ignored on user ${uid.toString()} (${email})`);
      }

      usersById.set(uid.toString(), transformedUser);
      userDocsToInsert.push(transformedUser);
    }

    stats.users.migrated = await insertInBatches(
      targetDb?.collection("users"),
      userDocsToInsert,
      effectiveBatchSize,
      dryRun
    );
    log(`   ✓ Migrated ${stats.users.migrated} users.`);

    // ------------------------------------------------------------------
    // STEP 2: APP PRICINGS
    // ------------------------------------------------------------------
    log("\n▶ [2/8] Transforming & Migrating App Pricings...");
    const pricingById = new Map();
    const pricingDocsToInsert = [];

    const pricingCursor = sourceDb.collection("apppricings").find({});
    for await (const plan of pricingCursor) {
      stats.apppricings.source++;
      const pid = toObjectId(plan._id);
      if (!pid) continue;

      const type = plan.type === "credit" ? "credit" : "subscription";
      const basePrice = Math.max(0, Number(plan.basePrice) || 0);
      const discountPercent = Math.min(100, Math.max(0, Number(plan.discountPercent) || 0));
      const discountPrice =
        plan.discountPrice !== undefined &&
        plan.discountPrice !== null &&
        Number.isFinite(Number(plan.discountPrice))
          ? Math.max(0, Number(plan.discountPrice))
          : roundBdt(basePrice * (1 - discountPercent / 100));
      const planDuration =
        Number.isFinite(Number(plan.planDuration)) && Number(plan.planDuration) >= 1
          ? Number(plan.planDuration)
          : 30;
      const createdAt = toValidDate(plan.createdAt) || new Date();
      const updatedAt = toValidDate(plan.updatedAt) || createdAt;

      const transformedPlan = {
        _id: pid,
        name: String(plan.name || "Plan").trim(),
        type,
        basePrice,
        discountPercent,
        discountPrice,
        isActive: plan.isActive !== false,
        planDuration,
        createdAt,
        updatedAt,
      };

      if (type === "credit") {
        transformedPlan.credit =
          Number.isFinite(Number(plan.credit)) && Number(plan.credit) >= 1
            ? Number(plan.credit)
            : 1;
      }

      pricingById.set(pid.toString(), transformedPlan);
      pricingDocsToInsert.push(transformedPlan);
    }

    stats.apppricings.migrated = await insertInBatches(
      targetDb?.collection("apppricings"),
      pricingDocsToInsert,
      effectiveBatchSize,
      dryRun
    );
    log(`   ✓ Migrated ${stats.apppricings.migrated} pricing plans.`);

    // ------------------------------------------------------------------
    // STEP 3: APPKEYS -> APPUSERS + DAILYAPIUSAGES + BACKFILL
    // ------------------------------------------------------------------
    log("\n▶ [3/8] Transforming AppKeys -> AppUsers & DailyApiUsages...");
    const sourceCols = await sourceDb.listCollections({}, { nameOnly: true }).toArray();
    const sourceColNames = new Set(sourceCols.map((c) => c.name));
    const appSourceCol = sourceColNames.has("appkeys")
      ? "appkeys"
      : sourceColNames.has("appusers")
        ? "appusers"
        : null;

    const groupedByUserId = new Map();
    if (appSourceCol) {
      for await (const doc of sourceDb.collection(appSourceCol).find({})) {
        stats.appusers.sourceLegacyDocs++;
        const uid = toObjectId(doc.userId);
        if (!uid || !usersById.has(uid.toString())) {
          stats.appusers.orphansSkipped++;
          continue;
        }
        const uidStr = uid.toString();
        if (!groupedByUserId.has(uidStr)) {
          groupedByUserId.set(uidStr, []);
        }
        groupedByUserId.get(uidStr).push(doc);
      }
    }

    const seenAppUserKeys = new Set();
    const seenAppUsernames = new Set();
    const appUsersToInsert = [];
    const dailyUsageDocsToInsert = [];
    const migratedAppUserIds = new Set();

    for (const [uidStr, docs] of groupedByUserId.entries()) {
      docs.sort((a, b) => {
        const rankDiff = getPlanRank(b.plan?.type) - getPlanRank(a.plan?.type);
        if (rankDiff !== 0) return rankDiff;
        const procDiff = (Number(b.totalProcess) || 0) - (Number(a.totalProcess) || 0);
        if (procDiff !== 0) return procDiff;
        const devDiff = collectDeviceIds(b).length - collectDeviceIds(a).length;
        if (devDiff !== 0) return devDiff;
        const tA = toValidDate(a.createdAt)?.getTime() || 0;
        const tB = toValidDate(b.createdAt)?.getTime() || 0;
        return tA - tB;
      });

      const [primaryDoc, ...duplicateDocs] = docs;
      if (duplicateDocs.length > 0) {
        stats.appusers.duplicatesConsolidated += duplicateDocs.length;
      }

      const userDoc = usersById.get(uidStr);
      const rawPlanType = primaryDoc.plan?.type;
      const validPlanType = VALID_PLAN_TYPES.has(rawPlanType) ? rawPlanType : "free";
      const planId = primaryDoc.plan?.id ? String(primaryDoc.plan.id).trim() : null;
      const pricingDoc = planId ? pricingById.get(planId) : null;
      const planName =
        primaryDoc.plan?.name ||
        pricingDoc?.name ||
        (validPlanType === "subscription"
          ? "Subscription"
          : validPlanType === "credit"
            ? "Credit Pack"
            : "Free Tier");

      let resolvedCredit;
      if (validPlanType === "subscription") {
        resolvedCredit = Infinity;
      } else if (typeof primaryDoc.credit === "number" && Number.isFinite(primaryDoc.credit)) {
        resolvedCredit = primaryDoc.credit;
      } else {
        resolvedCredit = validPlanType === "free" ? 5 : 0;
      }

      const combinedDeviceIds = [];
      const seenDev = new Set();
      for (const d of [primaryDoc, ...duplicateDocs]) {
        for (const devId of collectDeviceIds(d)) {
          if (!seenDev.has(devId)) {
            seenDev.add(devId);
            combinedDeviceIds.push(devId);
          }
        }
      }

      const allDocsOrdered = [...docs].reverse();
      const createdAt = toValidDate(primaryDoc.createdAt) || userDoc.createdAt || new Date();
      const updatedAt = toValidDate(primaryDoc.updatedAt) || createdAt;
      const devices = buildDevicesArray(primaryDoc.devices, combinedDeviceIds, createdAt, updatedAt);

      const dailyProcess = mergeNumericMaps(allDocsOrdered, "dailyProcess");
      const monthlyProcess = mergeNumericMaps(allDocsOrdered, "monthlyProcess");
      const failedProcess = mergeFailedProcessMaps(allDocsOrdered);

      const totalProcess = docs.reduce((sum, d) => sum + Math.max(0, Number(d.totalProcess) || 0), 0);
      const totalFailedProcess = docs.reduce(
        (sum, d) => sum + Math.max(0, Number(d.totalFailedProcess) || 0),
        0
      );

      const mergedPlanHistory = docs
        .flatMap((d) => (Array.isArray(d.planHistory) ? d.planHistory : []))
        .map((item) => ({
          planType: String(item?.planType || "free"),
          changedAt: toValidDate(item?.changedAt) || createdAt,
          reason: item?.reason ? String(item.reason) : "legacy",
        }))
        .sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

      let appKeyStr = typeof primaryDoc.key === "string" ? primaryDoc.key.trim() : "";
      if (!appKeyStr || seenAppUserKeys.has(appKeyStr)) {
        appKeyStr = crypto.randomBytes(32).toString("hex");
      }
      seenAppUserKeys.add(appKeyStr);

      let normalizedUsername = userDoc.email;
      if (seenAppUsernames.has(normalizedUsername)) {
        normalizedUsername = `${userDoc.email}#${uidStr.slice(-6)}`;
      }
      seenAppUsernames.add(normalizedUsername);

      const appUserId = toObjectId(primaryDoc._id) || new ObjectId();
      const transformedAppUser = {
        _id: appUserId,
        userId: userDoc._id,
        username: normalizedUsername,
        key: appKeyStr,
        credit: resolvedCredit,
        isActive: primaryDoc.isActive !== false,
        status: primaryDoc.status === "suspended" ? "suspended" : "active",
        suspendedAt: toValidDate(primaryDoc.suspendedAt),
        maxDevices: Math.max(1, Number(primaryDoc.maxDevices) || 2),
        allowedDevices: combinedDeviceIds,
        devices,
        lastDeviceRemovalAt: toValidDate(primaryDoc.lastDeviceRemovalAt),
        plan: {
          type: validPlanType,
          id: planId,
          name: planName,
        },
        totalProcess,
        monthlyProcess,
        dailyProcess,
        lastCreditRefresh: primaryDoc.lastCreditRefresh || null,
        lastPlanChange: toValidDate(primaryDoc.lastPlanChange) || createdAt,
        planHistory: mergedPlanHistory,
        failedProcess,
        totalFailedProcess,
        createdAt,
        updatedAt,
      };

      const expiresAt = toValidDate(primaryDoc.expiresAt);
      if (expiresAt) {
        transformedAppUser.expiresAt = expiresAt;
      }

      appUsersToInsert.push(transformedAppUser);
      migratedAppUserIds.add(uidStr);
      stats.appusers.migratedFromLegacy++;

      // Merge dailyProcess and failedProcess by YYYY-MM-DD into dailyapiusages
      const dateKeys = new Set([
        ...Object.keys(dailyProcess).filter((k) => ISO_DATE_KEY_RE.test(k)),
        ...Object.keys(failedProcess).filter((k) => ISO_DATE_KEY_RE.test(k)),
      ]);

      for (const dateStr of dateKeys) {
        const processCount = Math.max(0, Number(dailyProcess[dateStr]) || 0);
        const failEntry = failedProcess[dateStr];
        const failedCount = Math.max(0, Number(failEntry?.count) || 0);
        const errors = Array.isArray(failEntry?.errorMessages)
          ? failEntry.errorMessages.slice(0, 50)
          : [];

        if (processCount > 0 || failedCount > 0) {
          const logDate = toValidDate(dateStr) || createdAt;
          dailyUsageDocsToInsert.push({
            appUserId,
            userId: userDoc._id,
            date: dateStr,
            processCount,
            fileCount: 0,
            failedCount,
            errors,
            createdAt: logDate,
            updatedAt: logDate,
          });
        }
      }
    }

    // Backfill missing AppUser profiles for registered users lacking one
    const todayIso = new Date().toISOString().split("T")[0];
    const nowDate = new Date();
    for (const [uidStr, userDoc] of usersById.entries()) {
      if (migratedAppUserIds.has(uidStr)) continue;

      let keyStr = crypto.randomBytes(32).toString("hex");
      while (seenAppUserKeys.has(keyStr)) {
        keyStr = crypto.randomBytes(32).toString("hex");
      }
      seenAppUserKeys.add(keyStr);

      let username = userDoc.email;
      if (seenAppUsernames.has(username)) {
        username = `${userDoc.email}#${uidStr.slice(-6)}`;
      }
      seenAppUsernames.add(username);

      appUsersToInsert.push({
        _id: new ObjectId(),
        userId: userDoc._id,
        username,
        key: keyStr,
        credit: 5,
        isActive: true,
        status: userDoc.isDisabled ? "suspended" : "active",
        suspendedAt: null,
        maxDevices: 2,
        allowedDevices: [],
        devices: [],
        lastDeviceRemovalAt: null,
        plan: {
          type: "free",
          id: null,
          name: "Free Tier",
        },
        totalProcess: 0,
        monthlyProcess: {},
        dailyProcess: {},
        lastCreditRefresh: todayIso,
        lastPlanChange: userDoc.createdAt,
        planHistory: [],
        failedProcess: {},
        totalFailedProcess: 0,
        createdAt: userDoc.createdAt,
        updatedAt: nowDate,
      });
      migratedAppUserIds.add(uidStr);
      stats.appusers.backfilledMissingUsers++;
    }

    if (appUsersToInsert.length !== userDocsToInsert.length) {
      throw new Error(
        `AppUser 1:1 parity check failed before insert: users=${userDocsToInsert.length}, appusers=${appUsersToInsert.length}.`
      );
    }

    stats.appusers.totalMigrated = await insertInBatches(
      targetDb?.collection("appusers"),
      appUsersToInsert,
      effectiveBatchSize,
      dryRun
    );
    stats.appusers.dailyUsageLogsExtracted = await insertInBatches(
      targetDb?.collection("dailyapiusages"),
      dailyUsageDocsToInsert,
      effectiveBatchSize,
      dryRun
    );
    log(
      `   ✓ Migrated ${stats.appusers.totalMigrated} AppUsers (${stats.appusers.migratedFromLegacy} legacy, ${stats.appusers.duplicatesConsolidated} duplicates consolidated, ${stats.appusers.backfilledMissingUsers} backfilled).`
    );
    log(`   ✓ Extracted ${stats.appusers.dailyUsageLogsExtracted} daily usage records into [dailyapiusages].`);

    // ------------------------------------------------------------------
    // STEP 4: APPPAYMENTS & ORDERS -> APPPAYMENTS + PAYMENTTRANSACTIONS
    // ------------------------------------------------------------------
    log("\n▶ [4/8] Transforming AppPayments & Orders...");
    const appPaymentsToInsert = [];
    const paymentTransactionsToInsert = [];
    const seenPaymentIds = new Set();
    const seenTrxIds = new Set();

    for await (const pay of sourceDb.collection("apppayments").find({})) {
      stats.apppayments.sourcePayments++;
      const payId = toObjectId(pay._id) || new ObjectId();
      const userId = toObjectId(pay.userId);
      if (!userId) {
        warn(`Skipped AppPayment ${pay._id} with invalid userId`);
        continue;
      }

      const paymentID = String(pay.paymentID || `LEGACY-PAY-${payId.toString()}`).trim();
      const trxID = String(pay.trxID || `LEGACY-TRX-${payId.toString()}`).trim();
      if (seenPaymentIds.has(paymentID) || seenTrxIds.has(trxID)) {
        warn(`Skipped duplicate AppPayment (paymentID=${paymentID}, trxID=${trxID})`);
        continue;
      }
      seenPaymentIds.add(paymentID);
      seenTrxIds.add(trxID);

      const resolvedPlan = resolvePaymentPlanSnapshot(pay, pricingById);
      if (resolvedPlan.repaired) {
        stats.apppayments.malformedPlansRepaired++;
      }

      const isPaystation =
        pay.paymentDetails?.gateway === "paystation" || paymentID.startsWith("INV-");
      const gateway = isPaystation ? "paystation" : "bkash";
      const paymentMethod = isPaystation
        ? pay.paymentDetails?.paymentMethod || null
        : pay.paymentDetails?.paymentMethod || "bKash";
      const status = isPaystation
        ? "Completed"
        : pay.status || pay.paymentDetails?.transactionStatus || "Completed";
      const amount = Math.max(0, Number(pay.amount) || 0);
      const currency = pay.paymentDetails?.currency || pay.currency || "BDT";
      const createdAt = toValidDate(pay.createdAt) || new Date();
      const updatedAt = toValidDate(pay.updatedAt) || createdAt;
      const txId = includePaymentTransactions ? new ObjectId() : null;

      appPaymentsToInsert.push({
        _id: payId,
        userId,
        paymentID,
        trxID,
        gateway,
        plan: {
          id: resolvedPlan.id,
          type: resolvedPlan.type,
          name: resolvedPlan.name,
        },
        amount,
        currency,
        status,
        transactionId: txId,
        paymentMethod,
        paymentDetails: pay.paymentDetails || {},
        createdAt,
        updatedAt,
      });
      stats.apppayments.migratedFromPayments++;

      if (includePaymentTransactions) {
        const userDoc = usersById.get(userId.toString());
        const payerMobileNo =
          pay.paymentDetails?.payerMobileNo ||
          pay.paymentDetails?.customerMsisdn ||
          pay.paymentDetails?.payerAccount ||
          null;

        paymentTransactionsToInsert.push({
          _id: txId,
          invoiceNumber: paymentID,
          userId,
          gateway,
          status: "completed",
          idempotencyKey: null,
          plan: {
            id: resolvedPlan.id,
            name: resolvedPlan.name,
            type: resolvedPlan.type,
            planDuration: resolvedPlan.planDuration,
            credit: resolvedPlan.credit,
          },
          promoCode: {
            id: null,
            code: pay.paymentDetails?.checkoutItems?.promoCode || null,
            discountPercent: 0,
          },
          pricing: {
            basePrice: amount,
            priceAfterPlanDiscount: amount,
            planDiscountAmount: 0,
            promoDiscountAmount: 0,
            expectedAmount: Math.max(1, amount),
            paidAmount: amount,
            currency,
            payWithCharge: 0,
          },
          customer: {
            name: userDoc?.name || "",
            email: userDoc?.email || "",
            phone: payerMobileNo ? String(payerMobileNo).trim() : "",
          },
          paymentUrl: null,
          trxId: trxID,
          paymentMethod,
          payerMobileNo: payerMobileNo ? String(payerMobileNo).trim() : null,
          gatewayStatus:
            pay.paymentDetails?.trxStatus ||
            pay.paymentDetails?.transactionStatus ||
            "Completed",
          gatewayInitMeta: null,
          gatewayResponse: pay.paymentDetails || null,
          appPaymentId: payId,
          fulfillmentSteps: {
            paymentRecorded: true,
            planUpdated: true,
            referralProcessed: true,
            promoRecorded: true,
            emailSent: true,
          },
          processingStartedAt: null,
          callbackReceivedAt: createdAt,
          ipnReceivedAt: null,
          verifiedAt: createdAt,
          fulfilledAt: createdAt,
          expiresAt: createdAt,
          failureReason: null,
          events: [
            {
              type: "migrated_from_legacy",
              source: "migration",
              message: "Migrated from GenMeta_old.apppayments",
              meta: { legacyPaymentId: payId.toString() },
              at: createdAt,
            },
          ],
          createdAt,
          updatedAt,
        });
      }
    }

    if (includeLegacyOrders && sourceColNames.has("orders")) {
      for await (const order of sourceDb.collection("orders").find({})) {
        stats.orders.source++;
        const orderId = toObjectId(order._id);
        const userId = toObjectId(order.userId);
        if (!orderId || !userId) continue;

        const planIdStr = order.planId ? String(order.planId) : "legacy-order-plan";
        const pricing = pricingById.get(planIdStr);
        const userDoc = usersById.get(userId.toString());
        const planType =
          order.planSnapshot?.type && VALID_PLAN_TYPES.has(order.planSnapshot.type)
            ? order.planSnapshot.type
            : pricing?.type || "subscription";
        const planName = order.planSnapshot?.name || pricing?.name || "Plan";
        const amount = Math.max(0, Number(order.amount) || 0);
        const invoiceNumber = `LEGACY-ORDER-${orderId.toString()}`;
        const createdAt = toValidDate(order.createdAt) || new Date();
        const updatedAt = toValidDate(order.updatedAt) || createdAt;

        if (order.status === "completed") {
          if (seenPaymentIds.has(invoiceNumber) || seenTrxIds.has(invoiceNumber)) {
            continue;
          }
          seenPaymentIds.add(invoiceNumber);
          seenTrxIds.add(invoiceNumber);

          const payId = new ObjectId();
          const txId = includePaymentTransactions ? new ObjectId() : null;

          appPaymentsToInsert.push({
            _id: payId,
            userId,
            paymentID: invoiceNumber,
            trxID: invoiceNumber,
            gateway: "manual",
            plan: {
              id: planIdStr,
              type: planType,
              name: planName,
            },
            amount,
            currency: "BDT",
            status: "Completed",
            transactionId: txId,
            paymentMethod: "Manual Order",
            paymentDetails: {
              source: "legacy_order",
              legacyOrderId: orderId.toString(),
              notes: order.notes || null,
              promoCodeUsed: order.promoCodeUsed || null,
              referralCode: order.referralCode || null,
            },
            createdAt,
            updatedAt,
          });
          stats.apppayments.migratedFromCompletedOrders++;
          stats.orders.completedConvertedToPayments++;

          if (includePaymentTransactions) {
            paymentTransactionsToInsert.push({
              _id: txId,
              invoiceNumber,
              userId,
              gateway: "manual",
              status: "completed",
              idempotencyKey: null,
              plan: {
                id: planIdStr,
                name: planName,
                type: planType,
                planDuration: pricing?.planDuration ?? null,
                credit: pricing?.credit ?? null,
              },
              promoCode: {
                id: toObjectId(order.promoCodeId),
                code: order.promoCodeUsed || null,
                discountPercent: 0,
              },
              pricing: {
                basePrice: amount,
                priceAfterPlanDiscount: amount,
                planDiscountAmount: 0,
                promoDiscountAmount: 0,
                expectedAmount: Math.max(1, amount),
                paidAmount: amount,
                currency: "BDT",
                payWithCharge: 0,
              },
              customer: {
                name: userDoc?.name || "",
                email: userDoc?.email || "",
                phone: "",
              },
              paymentUrl: null,
              trxId: invoiceNumber,
              paymentMethod: "Manual Order",
              payerMobileNo: null,
              gatewayStatus: "Completed",
              gatewayInitMeta: null,
              gatewayResponse: {
                source: "legacy_order",
                legacyOrderId: orderId.toString(),
                notes: order.notes || null,
              },
              appPaymentId: payId,
              fulfillmentSteps: {
                paymentRecorded: true,
                planUpdated: true,
                referralProcessed: true,
                promoRecorded: true,
                emailSent: true,
              },
              processingStartedAt: null,
              callbackReceivedAt: createdAt,
              ipnReceivedAt: null,
              verifiedAt: createdAt,
              fulfilledAt: createdAt,
              expiresAt: createdAt,
              failureReason: null,
              events: [
                {
                  type: "migrated_from_legacy_order",
                  source: "migration",
                  message: "Migrated completed order from GenMeta_old.orders",
                  meta: { legacyOrderId: orderId.toString() },
                  at: createdAt,
                },
              ],
              createdAt,
              updatedAt,
            });
          }
        } else if (includePaymentTransactions) {
          const txStatus = order.status === "cancelled" ? "canceled" : "expired";
          if (txStatus === "canceled") {
            stats.orders.cancelledConvertedToTransactions++;
          } else {
            stats.orders.pendingConvertedToExpiredTransactions++;
          }

          paymentTransactionsToInsert.push({
            _id: new ObjectId(),
            invoiceNumber,
            userId,
            gateway: "manual",
            status: txStatus,
            idempotencyKey: null,
            plan: {
              id: planIdStr,
              name: planName,
              type: planType,
              planDuration: pricing?.planDuration ?? null,
              credit: pricing?.credit ?? null,
            },
            promoCode: {
              id: toObjectId(order.promoCodeId),
              code: order.promoCodeUsed || null,
              discountPercent: 0,
            },
            pricing: {
              basePrice: amount,
              priceAfterPlanDiscount: amount,
              planDiscountAmount: 0,
              promoDiscountAmount: 0,
              expectedAmount: Math.max(1, amount),
              paidAmount: null,
              currency: "BDT",
              payWithCharge: 0,
            },
            customer: {
              name: userDoc?.name || "",
              email: userDoc?.email || "",
              phone: "",
            },
            paymentUrl: null,
            paymentMethod: "Manual Order",
            payerMobileNo: null,
            gatewayStatus: order.status || txStatus,
            gatewayInitMeta: null,
            gatewayResponse: {
              source: "legacy_order",
              legacyOrderId: orderId.toString(),
              legacyStatus: order.status || null,
            },
            appPaymentId: null,
            fulfillmentSteps: {
              paymentRecorded: false,
              planUpdated: false,
              referralProcessed: false,
              promoRecorded: false,
              emailSent: false,
            },
            processingStartedAt: null,
            callbackReceivedAt: null,
            ipnReceivedAt: null,
            verifiedAt: null,
            fulfilledAt: null,
            expiresAt: updatedAt,
            failureReason:
              order.notes ||
              (order.status === "cancelled"
                ? "Legacy manual order cancelled"
                : "Legacy manual order expired"),
            events: [
              {
                type: "migrated_from_legacy_order",
                source: "migration",
                message: `Migrated ${order.status || "non-completed"} order as ${txStatus}`,
                meta: { legacyOrderId: orderId.toString() },
                at: createdAt,
              },
            ],
            createdAt,
            updatedAt,
          });
        }
      }
    }

    stats.apppayments.totalMigrated = await insertInBatches(
      targetDb?.collection("apppayments"),
      appPaymentsToInsert,
      effectiveBatchSize,
      dryRun
    );
    if (includePaymentTransactions) {
      stats.paymenttransactions.totalMigrated = await insertInBatches(
        targetDb?.collection("paymenttransactions"),
        paymentTransactionsToInsert,
        effectiveBatchSize,
        dryRun
      );
    }
    log(
      `   ✓ Migrated ${stats.apppayments.totalMigrated} payments (${stats.apppayments.migratedFromPayments} legacy + ${stats.apppayments.migratedFromCompletedOrders} completed orders; ${stats.apppayments.malformedPlansRepaired} malformed plan shapes repaired).`
    );
    log(`   ✓ Migrated ${stats.paymenttransactions.totalMigrated} records into [paymenttransactions].`);

    // ------------------------------------------------------------------
    // STEP 5: PROMOCODES & PROMOCODEREDEMPTIONS
    // ------------------------------------------------------------------
    log("\n▶ [5/8] Transforming PromoCodes & Redemptions Ledger...");
    const promoDocsToInsert = [];
    const redemptionDocsToInsert = [];

    for await (const promo of sourceDb.collection("promocodes").find({})) {
      stats.promocodes.source++;
      const promoId = toObjectId(promo._id);
      const code = String(promo.code || "").trim().toUpperCase();
      if (!promoId || !code) continue;

      const discountPercent = Math.min(100, Math.max(1, Number(promo.discountPercent) || 1));
      const appliesTo = VALID_PROMO_APPLIES_TO.has(promo.appliesTo) ? promo.appliesTo : "both";
      const usageLimit =
        promo.usageLimit !== null &&
        promo.usageLimit !== undefined &&
        Number.isFinite(Number(promo.usageLimit)) &&
        Number(promo.usageLimit) >= 1
          ? Number(promo.usageLimit)
          : null;

      const rawUsed = Array.isArray(promo.usedCount) ? promo.usedCount : [];
      const uniqueUsedStrs = [];
      const seenRedeemers = new Set();
      for (const rawUid of rawUsed) {
        if (!rawUid) continue;
        const uidStr = String(rawUid).trim();
        if (!uidStr || seenRedeemers.has(uidStr)) continue;
        seenRedeemers.add(uidStr);
        uniqueUsedStrs.push(uidStr);
      }

      const createdAt = toValidDate(promo.createdAt) || new Date();
      const updatedAt = toValidDate(promo.updatedAt) || createdAt;
      const validFrom = toValidDate(promo.validFrom) || createdAt;
      const validUntil =
        toValidDate(promo.validUntil) || new Date(validFrom.getTime() + 30 * 86400000);

      promoDocsToInsert.push({
        _id: promoId,
        code,
        description: promo.description ? String(promo.description).trim() : "",
        discountPercent,
        isActive: promo.isActive !== false,
        appliesTo,
        usageLimit,
        usedCount: uniqueUsedStrs,
        validFrom,
        validUntil,
        createdAt,
        updatedAt,
      });

      for (const uidStr of uniqueUsedStrs) {
        const userObjId = toObjectId(uidStr);
        if (!userObjId) {
          warn(`Skipped promo redemption for non-ObjectId user (${uidStr}) on code ${code}`);
          continue;
        }
        redemptionDocsToInsert.push({
          promoCodeId: promoId,
          code,
          userId: userObjId,
          discountPercent,
          discountAmount: 0,
          createdAt,
          updatedAt: createdAt,
        });
      }
    }

    stats.promocodes.migrated = await insertInBatches(
      targetDb?.collection("promocodes"),
      promoDocsToInsert,
      effectiveBatchSize,
      dryRun
    );
    stats.promocodes.redemptionsExtracted = await insertInBatches(
      targetDb?.collection("promocoderedemptions"),
      redemptionDocsToInsert,
      effectiveBatchSize,
      dryRun
    );
    log(
      `   ✓ Migrated ${stats.promocodes.migrated} promo codes and ${stats.promocodes.redemptionsExtracted} redemptions.`
    );

    // ------------------------------------------------------------------
    // STEP 6: REFERRALS, EARNINGS & WITHDRAWALS
    // ------------------------------------------------------------------
    log("\n▶ [6/8] Transforming Referrals & Normalized Ledgers...");
    const referralDocsToInsert = [];
    const earningDocsToInsert = [];
    const withdrawalDocsToInsert = [];
    const seenReferralCodes = new Set();
    const seenReferrers = new Set();

    for await (const ref of sourceDb.collection("referrals").find({})) {
      stats.referrals.source++;
      const refId = toObjectId(ref._id);
      const referrerId = toObjectId(ref.referrer);
      const referralCode = String(ref.referralCode || "").trim().toUpperCase();

      if (!refId || !referrerId || !referralCode) {
        warn(`Skipped invalid referral record (${ref._id})`);
        continue;
      }
      if (seenReferrers.has(referrerId.toString()) || seenReferralCodes.has(referralCode)) {
        warn(`Skipped duplicate referral record (${refId} / ${referralCode})`);
        continue;
      }
      seenReferrers.add(referrerId.toString());
      seenReferralCodes.add(referralCode);

      const createdAt = toValidDate(ref.createdAt) || new Date();
      const updatedAt = toValidDate(ref.updatedAt) || createdAt;
      const withdrawAccount = ref.withdrawAccount ? String(ref.withdrawAccount).trim() : null;

      // Deduplicate referredUsers
      const referredUsers = [];
      const seenRefUsers = new Set();
      if (Array.isArray(ref.referredUsers)) {
        for (const ru of ref.referredUsers) {
          const ruId = toObjectId(ru);
          if (ruId && !seenRefUsers.has(ruId.toString())) {
            seenRefUsers.add(ruId.toString());
            referredUsers.push(ruId);
          }
        }
      }

      // Normalize earnedHistory & extract referralearnings
      const earnedHistory = [];
      const seenEarningUsers = new Set();
      if (Array.isArray(ref.earnedHistory)) {
        for (const item of ref.earnedHistory) {
          const referredUserId = toObjectId(item?.user);
          if (!referredUserId) continue;
          const earnedAt = toValidDate(item.createdAt) || createdAt;
          const amount = Math.max(0, Number(item.amount) || 0);
          earnedHistory.push({
            _id: toObjectId(item._id) || new ObjectId(),
            user: referredUserId,
            amount,
            createdAt: earnedAt,
          });

          if (!seenEarningUsers.has(referredUserId.toString())) {
            seenEarningUsers.add(referredUserId.toString());
            earningDocsToInsert.push({
              referralId: refId,
              referrerId,
              referredUserId,
              amount,
              createdAt: earnedAt,
              updatedAt: earnedAt,
            });
          }
        }
      }

      // Normalize withdrawHistory & extract referralwithdrawals preserving _id
      const withdrawHistory = [];
      if (Array.isArray(ref.withdrawHistory)) {
        for (const w of ref.withdrawHistory) {
          const wId = toObjectId(w?._id) || new ObjectId();
          const amount = Math.max(1, Number(w?.amount) || 1);
          const status = VALID_WITHDRAWAL_STATUSES.has(w?.status) ? w.status : "pending";
          const account = String(w?.withdrawAccount || withdrawAccount || "N/A").trim() || "N/A";
          const trx = w?.trx ? String(w.trx).trim() : null;
          const notes = w?.notes ? String(w.notes).trim() : null;
          const itemCreatedAt = toValidDate(w?.createdAt) || createdAt;
          const requestedAt = toValidDate(w?.requestedAt) || itemCreatedAt;
          const issuedAt = toValidDate(w?.issuedAt) || null;

          withdrawHistory.push({
            _id: wId,
            amount,
            status,
            withdrawAccount: account,
            trx,
            notes,
            requestedAt,
            createdAt: itemCreatedAt,
            issuedAt,
          });

          withdrawalDocsToInsert.push({
            _id: wId,
            referralId: refId,
            userId: referrerId,
            amount,
            status,
            withdrawAccount: account,
            trx,
            notes,
            requestedAt,
            issuedAt,
            createdAt: itemCreatedAt,
            updatedAt: issuedAt || itemCreatedAt,
          });
        }
      }

      referralDocsToInsert.push({
        _id: refId,
        referrer: referrerId,
        withdrawAccount,
        referralCode,
        availableBalance: Math.max(0, Number(ref.availableBalance) || 0),
        referredUsers,
        earnedHistory,
        withdrawHistory,
        createdAt,
        updatedAt,
      });
    }

    stats.referrals.migrated = await insertInBatches(
      targetDb?.collection("referrals"),
      referralDocsToInsert,
      effectiveBatchSize,
      dryRun
    );
    stats.referrals.earningsExtracted = await insertInBatches(
      targetDb?.collection("referralearnings"),
      earningDocsToInsert,
      effectiveBatchSize,
      dryRun
    );
    stats.referrals.withdrawalsExtracted = await insertInBatches(
      targetDb?.collection("referralwithdrawals"),
      withdrawalDocsToInsert,
      effectiveBatchSize,
      dryRun
    );
    log(
      `   ✓ Migrated ${stats.referrals.migrated} referrals, ${stats.referrals.earningsExtracted} earnings, and ${stats.referrals.withdrawalsExtracted} withdrawals.`
    );

    // ------------------------------------------------------------------
    // STEP 7: AI API KEYS (skip deprecated bkashtokens)
    // ------------------------------------------------------------------
    log("\n▶ [7/8] Migrating AI API Keys (skipping deprecated bkashtokens)...");
    const aiApiDocsToInsert = [];
    if (sourceColNames.has("aiapis")) {
      for await (const doc of sourceDb.collection("aiapis").find({})) {
        stats.aiapis.source++;
        if (!doc.ai_api_key) continue;
        const createdAt = toValidDate(doc.createdAt) || new Date();
        const updatedAt = toValidDate(doc.updatedAt) || createdAt;
        aiApiDocsToInsert.push({
          _id: toObjectId(doc._id) || new ObjectId(),
          ai_api_key: doc.ai_api_key,
          name: doc.name ? String(doc.name).trim() : "Gemini API Key",
          isActive: doc.isActive !== false,
          createdAt,
          updatedAt,
        });
      }
    }
    if (sourceColNames.has("bkashtokens")) {
      const bkashCount = await sourceDb.collection("bkashtokens").countDocuments();
      stats.bkashtokens.source = bkashCount;
      stats.bkashtokens.skippedDeprecated = bkashCount;
    }

    stats.aiapis.migrated = await insertInBatches(
      targetDb?.collection("aiapis"),
      aiApiDocsToInsert,
      effectiveBatchSize,
      dryRun
    );
    log(
      `   ✓ Migrated ${stats.aiapis.migrated} AI API keys (skipped ${stats.bkashtokens.skippedDeprecated} deprecated bkashtokens).`
    );

    // ------------------------------------------------------------------
    // STEP 8: INDEXES & MIGRATION HISTORY
    // ------------------------------------------------------------------
    const targetCounts = {};
    if (!dryRun && targetDb) {
      log("\n▶ [8/8] Building Production Indexes & Recording Migration History...");
      await buildAllTargetIndexes(targetDb);

      const now = new Date();
      await targetDb.collection("_migrations").insertMany(
        APPLIED_MIGRATION_FILES.map((name) => ({
          name,
          batch: 1,
          executedAt: now,
        })),
        { ordered: true }
      );
      log("   ✓ All production indexes & _migrations records established.");

      const targetCols = await targetDb.listCollections({}, { nameOnly: true }).toArray();
      for (const { name } of targetCols.sort((a, b) => a.name.localeCompare(b.name))) {
        if (name.startsWith("system.")) continue;
        targetCounts[name] = await targetDb.collection(name).countDocuments();
      }
    } else {
      log("\n▶ [8/8] Dry run — skipping index creation and database writes.");
    }

    // ------------------------------------------------------------------
    // STEP 9: POST-MIGRATION SOURCE INTEGRITY CHECK
    // ------------------------------------------------------------------
    const sourceAfterSnapshot = await captureCollectionSnapshot(sourceDb);
    const sourceUntouched = verifySourceSnapshotUnchanged(
      sourceBeforeSnapshot,
      sourceAfterSnapshot
    );

    const durationMs = Date.now() - startedAt;
    log("\n======================================================================");
    log("                     MIGRATION VERIFICATION AUDIT                     ");
    log("======================================================================");
    log(`Source [${sourceDbName}] untouched: ${sourceUntouched ? "YES (100% verified)" : "NO"}`);
    if (!dryRun) {
      for (const [name, count] of Object.entries(targetCounts)) {
        log(` • ${name.padEnd(25)} : ${String(count).padStart(6)} docs`);
      }
    }
    log(`Duration: ${durationMs}ms`);
    log("======================================================================\n");

    return {
      success: true,
      dryRun,
      source: { uri: sourceUri, dbName: sourceDbName, snapshot: sourceBeforeSnapshot },
      target: { uri: targetUri, dbName: targetDbName },
      sourceUntouched,
      durationMs,
      stats,
      targetCounts,
      warnings,
    };
  } finally {
    await Promise.allSettled([
      sourceClient?.close(),
      targetClient?.close(),
    ]);
  }
}

export default migrateFromOldDatabase;
