/**
 * Migration: 007_api_usage_error_indexes
 * Description: Establishes error triage and query indexes on dailyapiusages collection
 */

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

export async function up(connection) {
  const db = connection.db;

  console.log("  → Ensuring error triage indexes on dailyapiusages collection...");
  const usageLogs = db.collection("dailyapiusages");

  await safeCreateIndex(usageLogs, { failedCount: 1, date: -1 });
  await safeCreateIndex(usageLogs, { errorStatus: 1, date: -1 });
  await safeCreateIndex(usageLogs, { date: -1, updatedAt: -1 });

  console.log("  ✓ ApiUsageLog error indexes verified and established.");
}

export async function down() {
  // Preserve query indexes on rollback
}
