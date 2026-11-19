import { MongoClient, ObjectId } from "mongodb";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.DB_NAME || "GenMetaApp_v2";

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

async function migrateAppKeysToAppUsers() {
  console.log("==================================================");
  console.log(" MIGRATING APP KEYS TO APP USERS (LOCAL DB ONLY)  ");
  console.log("==================================================");
  console.log(`• Target Database: ${MONGODB_URI}/${DB_NAME}`);

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(DB_NAME);

  try {
    const appKeysCol = db.collection("appkeys");
    const appUsersCol = db.collection("appusers");
    const usersCol = db.collection("users");
    const usageCol = db.collection("dailyapiusages");

    // 1. Fetch legacy keys
    const legacyKeys = await appKeysCol.find().toArray();
    console.log(`→ Found ${legacyKeys.length} documents in legacy 'appkeys' collection.`);

    // 2. Deduplicate legacy keys by userId
    const seenUserIds = new Set();
    const validAppUsers = [];

    for (const doc of legacyKeys) {
      const uidStr = doc.userId?.toString();
      if (!uidStr) continue;

      if (seenUserIds.has(uidStr)) {
        console.log(`  [Deduplicate] Skipping duplicate app key for userId: ${uidStr}`);
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

    if (validAppUsers.length > 0) {
      console.log(`→ Upserting ${validAppUsers.length} records into 'appusers' collection...`);
      const bulkOps = validAppUsers.map((u) => ({
        replaceOne: {
          filter: { _id: u._id },
          replacement: u,
          upsert: true,
        },
      }));
      await appUsersCol.bulkWrite(bulkOps, { ordered: false });
    }

    // 3. Populate missing AppUser documents for registered users in 'users'
    const allUsers = await usersCol
      .find({}, { projection: { _id: 1, email: 1, isDisabled: 1, createdAt: 1 } })
      .toArray();
    const existingAppUserIds = new Set(
      (await appUsersCol.find({}, { projection: { userId: 1 } }).toArray()).map((u) => u.userId.toString())
    );

    const missingUsers = allUsers.filter((u) => !existingAppUserIds.has(u._id.toString()));
    console.log(`→ Found ${missingUsers.length} users in 'users' lacking an 'appusers' document.`);

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
      console.log(`✓ Created ${newAppUsers.length} new AppUser profiles.`);
    }

    // 4. Update dailyapiusages
    console.log("→ Linking appUserId in 'dailyapiusages'...");
    await usageCol.updateMany(
      { appUserId: { $exists: false } },
      [{ $set: { appUserId: "$appKeyId" } }]
    );
    await safeCreateIndex(usageCol, { appUserId: 1, date: 1 }, { unique: true });

    // 5. Build optimized compound indexes on appusers
    console.log("→ Building indexes on 'appusers' collection...");
    await safeCreateIndex(appUsersCol, { userId: 1 }, { unique: true });
    await safeCreateIndex(appUsersCol, { key: 1 }, { unique: true });
    await safeCreateIndex(appUsersCol, { username: 1 }, { unique: true });
    await safeCreateIndex(appUsersCol, { "plan.type": 1, expiresAt: 1 });
    await safeCreateIndex(appUsersCol, { "plan.type": 1, credit: 1 });
    await safeCreateIndex(appUsersCol, { "plan.type": 1, lastCreditRefresh: 1 });
    await safeCreateIndex(appUsersCol, { isActive: 1, status: 1 });
    await safeCreateIndex(appUsersCol, { userId: 1, isActive: 1 });
    await safeCreateIndex(appUsersCol, { createdAt: -1 });

    const finalAppUsersCount = await appUsersCol.countDocuments();
    const finalUsersCount = await usersCol.countDocuments();

    console.log("==================================================");
    console.log(" MIGRATION SUCCESSFUL!                            ");
    console.log(` • Total Users in 'users':       ${finalUsersCount}`);
    console.log(` • Total App Users in 'appusers': ${finalAppUsersCount}`);
    console.log("==================================================");
  } finally {
    await client.close();
  }
}

migrateAppKeysToAppUsers().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
