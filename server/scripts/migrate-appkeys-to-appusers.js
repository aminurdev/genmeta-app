import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { up as runAppKeysToAppUsersMigration } from "../src/database/migrations/004_migrate_appkeys_to_appusers.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.DB_NAME || "GenMetaApp";

async function migrateAppKeysToAppUsers() {
  console.log("==================================================");
  console.log("   MIGRATING APPKEYS TO UNIFIED APPUSERS MODEL    ");
  console.log("==================================================");
  console.log(`• Target Database: ${DB_NAME}`);

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(DB_NAME);

  try {
    await runAppKeysToAppUsersMigration({ db });

    const [finalUsersCount, finalAppUsersCount] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("appusers").countDocuments(),
    ]);

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
