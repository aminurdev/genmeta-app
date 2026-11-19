/**
 * Migration: 001_initial_indexes
 * Description: Sets up optimized compound indexes across all core collections
 */

async function safeCreateIndex(collection, keySpec, options = {}) {
  try {
    await collection.createIndex(keySpec, options);
  } catch (err) {
    // Code 85: IndexOptionsConflict (e.g. index already exists with a different name)
    if (err.code === 85 || err.codeName === "IndexOptionsConflict") {
      return;
    }
    throw err;
  }
}

export async function up(connection) {
  const db = connection.db;

  console.log("  → Ensuring indexes on users collection...");
  const users = db.collection("users");
  await safeCreateIndex(users, { email: 1 }, { unique: true });
  await safeCreateIndex(
    users,
    { googleId: 1 },
    { unique: true, partialFilterExpression: { googleId: { $type: "string" } } }
  );
  await safeCreateIndex(users, { role: 1, isVerified: 1, createdAt: -1 });

  console.log("  → Ensuring indexes on appkeys collection...");
  const appkeys = db.collection("appkeys");
  await safeCreateIndex(appkeys, { key: 1 }, { unique: true });
  await safeCreateIndex(appkeys, { userId: 1 });
  await safeCreateIndex(appkeys, { username: 1 });
  await safeCreateIndex(appkeys, { "plan.type": 1, expiresAt: 1 });
  await safeCreateIndex(appkeys, { "plan.type": 1, credit: 1 });
  await safeCreateIndex(appkeys, { "plan.type": 1, lastCreditRefresh: 1 });
  await safeCreateIndex(appkeys, { isActive: 1, status: 1 });

  console.log("  → Ensuring indexes on apppricings collection...");
  const apppricings = db.collection("apppricings");
  await safeCreateIndex(apppricings, { isActive: 1, type: 1, basePrice: 1 });

  console.log("  → Ensuring indexes on apppayments collection...");
  const apppayments = db.collection("apppayments");
  await safeCreateIndex(apppayments, { paymentID: 1 }, { unique: true });
  await safeCreateIndex(apppayments, { trxID: 1 }, { unique: true });
  await safeCreateIndex(apppayments, { userId: 1, createdAt: -1 });
  await safeCreateIndex(apppayments, { createdAt: -1, status: 1 });

  console.log("  → Ensuring indexes on orders collection...");
  const orders = db.collection("orders");
  await safeCreateIndex(orders, { userId: 1, createdAt: -1 });
  await safeCreateIndex(orders, { status: 1, createdAt: -1 });
  await safeCreateIndex(orders, { planId: 1 });

  console.log("  → Ensuring indexes on promocodes collection...");
  const promocodes = db.collection("promocodes");
  await safeCreateIndex(promocodes, { code: 1 }, { unique: true });
  await safeCreateIndex(promocodes, { isActive: 1, validFrom: 1, validUntil: 1 });

  console.log("  → Ensuring indexes on referrals collection...");
  const referrals = db.collection("referrals");
  await safeCreateIndex(referrals, { referralCode: 1 }, { unique: true });
  await safeCreateIndex(referrals, { referrer: 1 }, { unique: true });
  await safeCreateIndex(referrals, { availableBalance: -1 });

  console.log("  ✓ All core indexes verified and established successfully.");
}

export async function down(connection) {
  // Rollback intentionally preserves critical unique constraints
}
