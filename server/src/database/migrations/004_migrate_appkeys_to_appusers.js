import crypto from "crypto";
import { ObjectId } from "mongodb";

/**
 * Migration: 004_migrate_appkeys_to_appusers
 * Description: Evolves legacy "appkeys" collection into unified "appusers" collection,
 *              merges overlaps, normalizes devices/usernames/plans/credits, backfills missing users,
 *              cleans dailyapiusages indexes, verifies 1:1 parity, and drops legacy "appkeys".
 */

const BATCH_SIZE = 1000;
const VALID_PLAN_TYPES = new Set(["free", "credit", "subscription"]);

async function safeCreateIndex(collection, keys, options = {}) {
  try {
    await collection.createIndex(keys, options);
  } catch (err) {
    if (err.code === 85 || err.codeName === "IndexOptionsConflict") {
      return;
    }
    throw err;
  }
}

async function safeDropIndex(collection, indexName) {
  try {
    await collection.dropIndex(indexName);
  } catch (err) {
    if (err.code === 27 || err.codeName === "IndexNotFound" || err.code === 26) {
      return;
    }
    throw err;
  }
}

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  return null;
}

function toValidDate(val) {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
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
      if (d?.deviceId && typeof d.deviceId === "string" && !byId.has(d.deviceId)) {
        byId.set(d.deviceId, d);
      }
    }
  }

  const result = [];
  for (const id of deviceIds) {
    if (byId.has(id)) {
      result.push(byId.get(id));
    } else {
      result.push({
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
      });
    }
  }
  return result;
}

function mergeNumericMaps(mapA = {}, mapB = {}) {
  const merged = {};
  for (const src of [mapA, mapB]) {
    if (!src || typeof src !== "object") continue;
    const entries = src instanceof Map ? src.entries() : Object.entries(src);
    for (const [k, v] of entries) {
      if (!k) continue;
      const num = Number(v) || 0;
      merged[k] = (merged[k] || 0) + num;
    }
  }
  return merged;
}

function mergeFailedProcessMaps(mapA = {}, mapB = {}) {
  const merged = {};
  for (const src of [mapA, mapB]) {
    if (!src || typeof src !== "object") continue;
    const entries = src instanceof Map ? src.entries() : Object.entries(src);
    for (const [dayKey, val] of entries) {
      if (!dayKey) continue;
      if (!merged[dayKey]) {
        merged[dayKey] = { count: 0, errorMessages: [] };
      }
      if (typeof val === "number") {
        merged[dayKey].count += val;
      } else if (val && typeof val === "object") {
        merged[dayKey].count += Number(val.count) || 0;
        if (Array.isArray(val.errorMessages)) {
          for (const msg of val.errorMessages) {
            if (typeof msg === "string" && msg.trim()) {
              merged[dayKey].errorMessages.push(msg);
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

function isPlaceholderAppUser(doc) {
  if (!doc) return false;
  const planType = doc.plan?.type || "free";
  const hasDevices =
    (Array.isArray(doc.devices) && doc.devices.length > 0) ||
    (Array.isArray(doc.allowedDevices) && doc.allowedDevices.length > 0);
  const hasHistory = Array.isArray(doc.planHistory) && doc.planHistory.length > 0;
  return (
    planType === "free" &&
    (Number(doc.totalProcess) || 0) === 0 &&
    !hasDevices &&
    !hasHistory
  );
}

function transformLegacyDoc(primaryDoc, duplicateDocs, usersById, pricingById) {
  const userIdObj = toObjectId(primaryDoc.userId);
  const userDoc = userIdObj ? usersById.get(userIdObj.toString()) : null;

  const rawPlanType = primaryDoc.plan?.type;
  const validPlanType = VALID_PLAN_TYPES.has(rawPlanType) ? rawPlanType : "free";
  const planId = primaryDoc.plan?.id ? String(primaryDoc.plan.id) : null;
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

  // Merge unique devices across primary + any duplicate legacy docs
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

  const createdAt = toValidDate(primaryDoc.createdAt) || new Date();
  const updatedAt = toValidDate(primaryDoc.updatedAt) || createdAt;
  const devices = buildDevicesArray(primaryDoc.devices, combinedDeviceIds, createdAt, updatedAt);

  const normalizedUsername = (userDoc?.email || primaryDoc.username || "")
    .toLowerCase()
    .trim();

  const expiresAt = toValidDate(primaryDoc.expiresAt);

  const transformed = {
    _id: toObjectId(primaryDoc._id) || new ObjectId(),
    userId: userIdObj,
    username: normalizedUsername,
    key: primaryDoc.key || crypto.randomBytes(32).toString("hex"),
    credit: resolvedCredit,
    isActive: primaryDoc.isActive !== false,
    status: primaryDoc.status === "suspended" ? "suspended" : "active",
    suspendedAt: toValidDate(primaryDoc.suspendedAt),
    maxDevices: Number(primaryDoc.maxDevices) || 2,
    allowedDevices: combinedDeviceIds,
    devices,
    lastDeviceRemovalAt: toValidDate(primaryDoc.lastDeviceRemovalAt),
    plan: {
      type: validPlanType,
      id: planId,
      name: planName,
    },
    totalProcess: Number(primaryDoc.totalProcess) || 0,
    monthlyProcess:
      primaryDoc.monthlyProcess && typeof primaryDoc.monthlyProcess === "object"
        ? primaryDoc.monthlyProcess
        : {},
    dailyProcess:
      primaryDoc.dailyProcess && typeof primaryDoc.dailyProcess === "object"
        ? primaryDoc.dailyProcess
        : {},
    lastCreditRefresh: primaryDoc.lastCreditRefresh || null,
    lastPlanChange: toValidDate(primaryDoc.lastPlanChange) || createdAt,
    planHistory: Array.isArray(primaryDoc.planHistory) ? primaryDoc.planHistory : [],
    failedProcess:
      primaryDoc.failedProcess && typeof primaryDoc.failedProcess === "object"
        ? primaryDoc.failedProcess
        : {},
    totalFailedProcess: Number(primaryDoc.totalFailedProcess) || 0,
    createdAt,
    updatedAt,
  };

  if (expiresAt) {
    transformed.expiresAt = expiresAt;
  }

  return transformed;
}

export async function up(connection) {
  const db = connection.db;

  console.log("  → Transitioning 'appkeys' to unified 'appusers' collection...");
  const appUsersCol = db.collection("appusers");
  const usersCol = db.collection("users");
  const usageCol = db.collection("dailyapiusages");
  const pricingCol = db.collection("apppricings");

  const [allUsers, allPricings, hasAppKeysCol] = await Promise.all([
    usersCol
      .find({}, { projection: { _id: 1, email: 1, isDisabled: 1, createdAt: 1 } })
      .toArray(),
    pricingCol.find({}, { projection: { _id: 1, name: 1, type: 1 } }).toArray(),
    db.listCollections({ name: "appkeys" }).toArray().then((cols) => cols.length > 0),
  ]);

  const usersById = new Map(allUsers.map((u) => [u._id.toString(), u]));
  const pricingById = new Map(allPricings.map((p) => [p._id.toString(), p]));

  if (hasAppKeysCol) {
    const appKeysCol = db.collection("appkeys");
    const legacyKeys = await appKeysCol.find().toArray();
    console.log(`    Found ${legacyKeys.length} legacy records in 'appkeys'.`);

    // Group legacy records by userId so duplicates are deterministically deduplicated
    const groupedByUserId = new Map();
    for (const doc of legacyKeys) {
      const uidObj = toObjectId(doc.userId);
      if (!uidObj) continue;
      const uidStr = uidObj.toString();
      if (!groupedByUserId.has(uidStr)) {
        groupedByUserId.set(uidStr, []);
      }
      groupedByUserId.get(uidStr).push(doc);
    }

    const existingAppUsers = await appUsersCol.find().toArray();
    const existingByUserId = new Map(
      existingAppUsers
        .filter((doc) => doc.userId)
        .map((doc) => [doc.userId.toString(), doc])
    );

    const toInsert = [];
    let deduplicatedCount = 0;
    let replacedPlaceholders = 0;
    let mergedOverlaps = 0;

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
        deduplicatedCount += duplicateDocs.length;
      }

      const transformedLegacy = transformLegacyDoc(
        primaryDoc,
        duplicateDocs,
        usersById,
        pricingById
      );

      const existing = existingByUserId.get(uidStr);
      if (!existing) {
        toInsert.push(transformedLegacy);
        continue;
      }

      if (isPlaceholderAppUser(existing)) {
        await appUsersCol.deleteOne({ _id: existing._id });
        await appUsersCol.insertOne(transformedLegacy);
        replacedPlaceholders++;
      } else {
        // Active newer AppUser profile exists: preserve active key/plan/devices, merge historical telemetry
        const existingPlanType = VALID_PLAN_TYPES.has(existing.plan?.type)
          ? existing.plan.type
          : "free";
        const mergedPlanId = existing.plan?.id || transformedLegacy.plan?.id || null;
        const mergedPlanName =
          existing.plan?.name ||
          (mergedPlanId ? pricingById.get(String(mergedPlanId))?.name : null) ||
          transformedLegacy.plan?.name ||
          "Free Tier";

        const mergedTotalProcess =
          (Number(existing.totalProcess) || 0) + (Number(transformedLegacy.totalProcess) || 0);
        const mergedTotalFailed =
          (Number(existing.totalFailedProcess) || 0) +
          (Number(transformedLegacy.totalFailedProcess) || 0);

        const mergedDaily = mergeNumericMaps(
          transformedLegacy.dailyProcess,
          existing.dailyProcess
        );
        const mergedMonthly = mergeNumericMaps(
          transformedLegacy.monthlyProcess,
          existing.monthlyProcess
        );
        const mergedFailed = mergeFailedProcessMaps(
          transformedLegacy.failedProcess,
          existing.failedProcess
        );

        const mergedPlanHistory = [
          ...(Array.isArray(transformedLegacy.planHistory) ? transformedLegacy.planHistory : []),
          ...(Array.isArray(existing.planHistory) ? existing.planHistory : []),
        ].sort(
          (a, b) =>
            (toValidDate(a?.changedAt)?.getTime() || 0) -
            (toValidDate(b?.changedAt)?.getTime() || 0)
        );

        const existingCreated = toValidDate(existing.createdAt);
        const legacyCreated = toValidDate(transformedLegacy.createdAt);
        const earliestCreated =
          existingCreated && legacyCreated
            ? existingCreated <= legacyCreated
              ? existingCreated
              : legacyCreated
            : existingCreated || legacyCreated || new Date();

        const existingDeviceIds = collectDeviceIds(existing);
        const mergedDevices = buildDevicesArray(
          existing.devices,
          existingDeviceIds,
          earliestCreated,
          new Date()
        );

        const updateFields = {
          username: transformedLegacy.username || (existing.username || "").toLowerCase().trim(),
          plan: {
            type: existingPlanType,
            id: mergedPlanId,
            name: mergedPlanName,
          },
          credit:
            existingPlanType === "subscription"
              ? Infinity
              : typeof existing.credit === "number" && Number.isFinite(existing.credit)
              ? existing.credit
              : existingPlanType === "free"
              ? 5
              : 0,
          allowedDevices: existingDeviceIds,
          devices: mergedDevices,
          totalProcess: mergedTotalProcess,
          totalFailedProcess: mergedTotalFailed,
          dailyProcess: mergedDaily,
          monthlyProcess: mergedMonthly,
          failedProcess: mergedFailed,
          planHistory: mergedPlanHistory,
          createdAt: earliestCreated,
          updatedAt: new Date(),
        };

        await appUsersCol.updateOne(
          { _id: existing._id },
          {
            $set: updateFields,
            $unset: { deviceId: "" },
          }
        );
        mergedOverlaps++;
      }
    }

    if (toInsert.length > 0) {
      console.log(`  → Inserting ${toInsert.length} migrated AppUser records in batches...`);
      for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const chunk = toInsert.slice(i, i + BATCH_SIZE);
        await appUsersCol.insertMany(chunk, { ordered: false });
      }
    }

    console.log(
      `  ✓ AppKeys processed: ${toInsert.length} inserted, ${replacedPlaceholders} placeholders replaced, ${mergedOverlaps} overlaps merged, ${deduplicatedCount} duplicate(s) consolidated.`
    );
  } else {
    console.log("  → Legacy 'appkeys' collection not found; skipping legacy document merge.");
  }

  // 2. Backfill AppUser profiles for registered users lacking one
  console.log("  → Checking for users lacking an AppUser record...");
  const existingAppUserIds = new Set(
    (await appUsersCol.find({}, { projection: { userId: 1 } }).toArray())
      .filter((u) => u.userId)
      .map((u) => u.userId.toString())
  );

  const missingUsers = allUsers.filter((u) => !existingAppUserIds.has(u._id.toString()));
  console.log(`    Found ${missingUsers.length} registered users without an AppUser profile.`);

  if (missingUsers.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const newAppUsers = missingUsers.map((u) => ({
      userId: u._id,
      username: (u.email || "").toLowerCase().trim(),
      key: crypto.randomBytes(32).toString("hex"),
      credit: 5,
      isActive: true,
      status: u.isDisabled ? "suspended" : "active",
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
      lastCreditRefresh: today,
      lastPlanChange: toValidDate(u.createdAt) || now,
      planHistory: [],
      failedProcess: {},
      totalFailedProcess: 0,
      createdAt: toValidDate(u.createdAt) || now,
      updatedAt: now,
    }));

    for (let i = 0; i < newAppUsers.length; i += BATCH_SIZE) {
      const chunk = newAppUsers.slice(i, i + BATCH_SIZE);
      await appUsersCol.insertMany(chunk, { ordered: false });
    }
    console.log(`  ✓ Successfully initialized ${newAppUsers.length} new AppUser records.`);
  }

  // 3. Clean up dailyapiusages: ensure appUserId, remove appKeyId field and stale appKeyId indexes
  console.log("  → Updating 'dailyapiusages' to use appUserId cleanly...");
  await usageCol.updateMany(
    { appUserId: { $exists: false }, appKeyId: { $exists: true } },
    [{ $set: { appUserId: "$appKeyId" } }]
  );
  await usageCol.updateMany(
    { appKeyId: { $exists: true } },
    { $unset: { appKeyId: "" } }
  );
  await safeDropIndex(usageCol, "appKeyId_1");
  await safeDropIndex(usageCol, "appKeyId_1_date_1");
  await safeDropIndex(usageCol, "uniq_appkey_date");
  await safeDropIndex(usageCol, "idx_appkey_date");
  await safeCreateIndex(usageCol, { appUserId: 1, date: 1 }, { unique: true });
  await safeCreateIndex(usageCol, { userId: 1, date: 1 });
  await safeCreateIndex(usageCol, { date: 1 });

  // 4. Build optimized compound indexes on appusers
  console.log("  → Ensuring indexes on 'appusers' collection...");
  await safeCreateIndex(appUsersCol, { userId: 1 }, { unique: true });
  await safeCreateIndex(appUsersCol, { key: 1 }, { unique: true });
  await safeCreateIndex(appUsersCol, { username: 1 }, { unique: true });
  await safeCreateIndex(appUsersCol, { "plan.type": 1, expiresAt: 1 });
  await safeCreateIndex(appUsersCol, { "plan.type": 1, credit: 1 });
  await safeCreateIndex(appUsersCol, { "plan.type": 1, lastCreditRefresh: 1 });
  await safeCreateIndex(appUsersCol, { isActive: 1, status: 1 });
  await safeCreateIndex(appUsersCol, { userId: 1, isActive: 1 });
  await safeCreateIndex(appUsersCol, { createdAt: -1 });

  // 5. Strict parity check before dropping legacy 'appkeys'
  const [totalUsers, totalAppUsers, finalAppUserIds] = await Promise.all([
    usersCol.countDocuments(),
    appUsersCol.countDocuments(),
    appUsersCol.find({}, { projection: { userId: 1 } }).toArray(),
  ]);

  const finalIdSet = new Set(
    finalAppUserIds.filter((d) => d.userId).map((d) => d.userId.toString())
  );
  const stillMissing = allUsers.filter((u) => !finalIdSet.has(u._id.toString()));

  if (totalAppUsers !== totalUsers || stillMissing.length > 0) {
    throw new Error(
      `Pre-drop parity verification failed: users=${totalUsers}, appusers=${totalAppUsers}, missing=${stillMissing.length}. Preserving 'appkeys'.`
    );
  }

  if (hasAppKeysCol) {
    await db.collection("appkeys").drop();
    console.log("  ✓ Verified 1:1 parity and dropped legacy 'appkeys' collection.");
  }

  console.log(`  ✓ 'appusers' migration complete. Total app users: ${totalAppUsers}`);
}

export async function down() {
  // Reversible without data loss
  console.log("  → Rollback 004: keeping appusers for safety");
}
