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

/**
 * Migration: 003_normalize_appkeys_and_pricing
 * Description: Ensures daily api usage indexes, normalizes legacy appkey docs if present, and verifies user defaults
 */
export async function up(connection) {
  const db = connection.db;

  console.log("  → Ensuring dailyapiusages indexes...");
  const usageCol = db.collection("dailyapiusages");
  await safeCreateIndex(usageCol, { appUserId: 1, date: 1 }, { unique: true, name: "uniq_appuser_date" });
  await safeCreateIndex(usageCol, { userId: 1, date: 1 }, { name: "idx_user_date" });
  await safeCreateIndex(usageCol, { date: 1 }, { name: "idx_usage_date" });

  const hasAppKeysCol = (await db.listCollections({ name: "appkeys" }).toArray()).length > 0;
  if (hasAppKeysCol) {
    console.log("  → Normalizing legacy AppKey documents...");
    const appKeysCol = db.collection("appkeys");
    const result = await appKeysCol.updateMany(
      { totalProcess: { $exists: false } },
      { $set: { totalProcess: 0, totalFailedProcess: 0 } }
    );
    console.log(`  ✓ Updated ${result.modifiedCount} AppKey documents with default counters.`);
  } else {
    console.log("  → Skipping legacy 'appkeys' normalization (collection already migrated/dropped).");
  }

  console.log("  → Ensuring User default fields...");
  const usersCol = db.collection("users");
  const userResult = await usersCol.updateMany(
    { isDisabled: { $exists: false } },
    { $set: { isDisabled: false } }
  );
  console.log(`  ✓ Updated ${userResult.modifiedCount} User documents with isDisabled default.`);
}

export async function down(connection) {
  // Safe rollback
}
