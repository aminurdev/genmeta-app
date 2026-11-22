/**
 * Migration: 005_payment_transactions_indexes
 * Description: Creates authoritative PaymentTransaction indexes and links AppPayment.transactionId
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

  console.log("  → Ensuring indexes on paymenttransactions collection...");
  const paymentTransactions = db.collection("paymenttransactions");
  await safeCreateIndex(paymentTransactions, { invoiceNumber: 1 }, { unique: true });
  await safeCreateIndex(
    paymentTransactions,
    { trxId: 1 },
    { unique: true, partialFilterExpression: { trxId: { $type: "string" } } }
  );
  await safeCreateIndex(
    paymentTransactions,
    { userId: 1, activeIdempotencyKey: 1 },
    {
      unique: true,
      partialFilterExpression: { activeIdempotencyKey: { $type: "string" } },
    }
  );
  await safeCreateIndex(paymentTransactions, { userId: 1, createdAt: -1 });
  await safeCreateIndex(paymentTransactions, { status: 1, expiresAt: 1 });
  await safeCreateIndex(paymentTransactions, { status: 1, createdAt: -1 });

  console.log("  → Ensuring transactionId index on apppayments collection...");
  const appPayments = db.collection("apppayments");
  await safeCreateIndex(appPayments, { transactionId: 1 });

  console.log("  ✓ Payment transaction indexes verified and established.");
}

export async function down() {
  // Preserve audit & uniqueness indexes on rollback
}
