import crypto from "crypto";
import { ObjectId } from "mongodb";

/**
 * Migration: 004_migrate_appkeys_to_appusers
 * Description: Evolves legacy static "appkeys" collection into unified "appusers" collection.
 *              Guarantees 1:1 user-to-app-profile relationship with proper indexes and default plans.
 */

async function safeCreateIndex(collection, keys, options = {}) {
  try {
    await collection.createIndex(keys, options);
  } catch (err) {
    if (err.code === 85 || err.message?.includes("already exists")) {
      return;
    }
    throw err;
  }
}

export async function up(connection) {
  const db = connection.db;

  console.log("  → Transitioning 'appkeys' to 'appusers' collection...");
  const appKeysCol = db.collection("appkeys");
  const appUsersCol = db.collection("appusers");
  const usersCol = db.collection("users");
  const usageCol = db.collection("dailyapiusages");

  // 1. Fetch all existing app keys
  const legacyKeys = await appKeysCol.find().toArray();
  console.log(`    Found ${legacyKeys.length} legacy app key records to migrate.`);

  // Deduplicate by userId if any exist
  const seenUserIds = new Set();
  const validAppUsers = [];

  for (const doc of legacyKeys) {
    let uidStr = doc.userId?.toString();
    if (!uidStr) continue;

    if (seenUserIds.has(uidStr)) {
      console.log(`    [Deduplicate] Skipping duplicate app key document for userId: ${uidStr}`);
      continue;
    }
    seenUserIds.add(uidStr);

    validAppUsers.push({
      ...doc,
      userId: doc.userId instanceof ObjectId ? doc.userId : new ObjectId(doc.userId),
      username: (doc.username || "").toLowerCase().trim(),
      updatedAt: doc.updatedAt || new Date(),
    });
  }

  // 2. Insert or upsert into appusers
  if (validAppUsers.length > 0) {
    console.log(`  → Populating 'appusers' with ${validAppUsers.length} verified app user records...`);
    const bulkOps = validAppUsers.map((u) => ({
      replaceOne: {
        filter: { _id: u._id },
        replacement: u,
        upsert: true,
      },
    }));
    await appUsersCol.bulkWrite(bulkOps, { ordered: false });
  }

  // 3. Populate appusers for registered users in 'users' who don't have an appuser record
  console.log("  → Checking for users lacking an AppUser record...");
  const allUsers = await usersCol.find({}, { projection: { _id: 1, email: 1, isDisabled: 1, createdAt: 1 } }).toArray();
  const existingAppUserIds = new Set(
    (await appUsersCol.find({}, { projection: { userId: 1 } }).toArray()).map((u) => u.userId.toString())
  );

  const missingUsers = allUsers.filter((u) => !existingAppUserIds.has(u._id.toString()));
  console.log(`    Found ${missingUsers.length} registered users without an AppUser profile.`);

  if (missingUsers.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const newAppUsers = missingUsers.map((u) => ({
      userId: u._id,
      username: (u.email || "").toLowerCase().trim(),
      key: crypto.randomBytes(32).toString("hex"),
      credit: 5,
      isActive: true,
      status: u.isDisabled ? "suspended" : "active",
      suspendedAt: null,
      expiresAt: null,
      allowedDevices: [],
      plan: {
        type: "free",
        id: null,
        name: "Free Tier",
      },
      totalProcess: 0,
      monthlyProcess: {},
      dailyProcess: {},
      lastCreditRefresh: today,
      lastPlanChange: u.createdAt || new Date(),
      planHistory: [],
      failedProcess: {},
      totalFailedProcess: 0,
      createdAt: u.createdAt || new Date(),
      updatedAt: new Date(),
    }));

    await appUsersCol.insertMany(newAppUsers, { ordered: false });
    console.log(`  ✓ Successfully initialized ${newAppUsers.length} new AppUser records.`);
  }

  // 4. Update dailyapiusages to link appUserId = appKeyId
  console.log("  → Updating 'dailyapiusages' to index appUserId...");
  await usageCol.updateMany(
    { appUserId: { $exists: false } },
    [{ $set: { appUserId: "$appKeyId" } }]
  );
  await safeCreateIndex(usageCol, { appUserId: 1, date: 1 }, { unique: true });

  // 5. Build optimized compound indexes on appusers
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

  const totalAppUsers = await appUsersCol.countDocuments();
  console.log(`  ✓ 'appusers' migration complete. Total app users: ${totalAppUsers}`);
}

export async function down(connection) {
  // Reversible without data loss
  console.log("  → Rollback 004: keeping appusers for safety");
}
