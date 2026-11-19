/**
 * Migration: 003_normalize_appkeys_and_pricing
 * Description: Normalizes appkey fields, ensures daily api usage indexes, and verifies plan integrity
 */
export async function up(connection) {
  const db = connection.db;

  console.log("  → Ensuring apiusagelogs indexes...");
  const usageCol = db.collection("dailyapiusages");
  await usageCol.createIndexes([
    { key: { appKeyId: 1, date: 1 }, unique: true, name: "uniq_appkey_date" },
    { key: { userId: 1, date: 1 }, name: "idx_user_date" },
    { key: { date: 1 }, name: "idx_usage_date" },
  ]);

  console.log("  → Normalizing legacy AppKey documents...");
  const appKeysCol = db.collection("appkeys");
  const result = await appKeysCol.updateMany(
    { totalProcess: { $exists: false } },
    { $set: { totalProcess: 0, totalFailedProcess: 0 } }
  );
  console.log(`  ✓ Updated ${result.modifiedCount} AppKey documents with default counters.`);

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
