/**
 * Migration: 006_notifications_indexes
 * Description: Establishes indexes on notifications, notificationpreferences, and notificationbroadcasts
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

  console.log("  → Ensuring indexes on notifications collection...");
  const notifications = db.collection("notifications");
  await safeCreateIndex(notifications, {
    recipientId: 1,
    audience: 1,
    isArchived: 1,
    createdAt: -1,
  });
  await safeCreateIndex(notifications, {
    recipientId: 1,
    audience: 1,
    isRead: 1,
    isArchived: 1,
  });
  await safeCreateIndex(notifications, {
    recipientId: 1,
    category: 1,
    isArchived: 1,
    createdAt: -1,
  });
  await safeCreateIndex(
    notifications,
    { recipientId: 1, dedupeKey: 1 },
    {
      unique: true,
      partialFilterExpression: { dedupeKey: { $type: "string" } },
    }
  );
  await safeCreateIndex(notifications, { broadcastId: 1, isRead: 1 });
  await safeCreateIndex(
    notifications,
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  );

  console.log("  → Ensuring indexes on notificationpreferences collection...");
  const preferences = db.collection("notificationpreferences");
  await safeCreateIndex(preferences, { userId: 1 }, { unique: true });

  console.log("  → Ensuring indexes on notificationbroadcasts collection...");
  const broadcasts = db.collection("notificationbroadcasts");
  await safeCreateIndex(broadcasts, { createdAt: -1 });

  console.log("  ✓ Notification indexes verified and established.");
}

export async function down() {
  // Preserve audit & preference indexes on rollback
}
