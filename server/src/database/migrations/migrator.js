import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import config from "../../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Schema to track executed migrations
const migrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    batch: { type: Number, required: true },
    executedAt: { type: Date, default: Date.now },
  },
  { collection: "_migrations" }
);

const MigrationRecord =
  mongoose.models._Migration || mongoose.model("_Migration", migrationSchema);

/**
 * Migration Manager Engine
 */
export class MigrationManager {
  constructor() {
    this.migrationsDir = __dirname;
  }

  async connect() {
    if (mongoose.connection.readyState === 1) return;
    try {
      await mongoose.connect(config.mongodb_uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`Connected to database: ${mongoose.connection.name}`);
    } catch (err) {
      console.error(`\n❌ Could not connect to MongoDB at "${config.mongodb_uri}".`);
      console.error(`   Please verify that MongoDB is running and MONGODB_URI in your .env file is correct.\n`);
      throw err;
    }
  }

  async disconnect() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  getMigrationFiles() {
    const files = fs
      .readdirSync(this.migrationsDir)
      .filter((file) => file.endsWith(".js") && file !== "migrator.js")
      .sort();
    return files;
  }

  async getExecutedMigrations() {
    const records = await MigrationRecord.find().sort({ executedAt: 1 }).lean();
    return records;
  }

  async getLatestBatchNumber() {
    const latest = await MigrationRecord.findOne().sort({ batch: -1 }).lean();
    return latest ? latest.batch : 0;
  }

  async up() {
    await this.connect();
    try {
      const allFiles = this.getMigrationFiles();
      const executed = await this.getExecutedMigrations();
      const executedNames = new Set(executed.map((m) => m.name));

      const pending = allFiles.filter((file) => !executedNames.has(file));

      if (pending.length === 0) {
        console.log("✓ No pending migrations. Database schema is up to date.");
        return;
      }

      const nextBatch = (await this.getLatestBatchNumber()) + 1;
      console.log(`\n🚀 Running ${pending.length} pending migration(s) (Batch #${nextBatch})...\n`);

      for (const file of pending) {
        console.log(`▶ Executing: ${file}`);
        const filePath = path.join(this.migrationsDir, file);
        const migrationModule = await import(`file://${filePath}`);

        if (typeof migrationModule.up !== "function") {
          throw new Error(`Migration ${file} must export an 'up' function`);
        }

        const startTime = Date.now();
        await migrationModule.up(mongoose.connection);
        const duration = Date.now() - startTime;

        await MigrationRecord.create({
          name: file,
          batch: nextBatch,
          executedAt: new Date(),
        });

        console.log(`✓ Completed: ${file} (${duration}ms)\n`);
      }

      console.log(`🎉 All ${pending.length} migration(s) applied successfully!`);
    } finally {
      await this.disconnect();
    }
  }

  async down() {
    await this.connect();
    try {
      const latestBatch = await this.getLatestBatchNumber();
      if (latestBatch === 0) {
        console.log("No migrations to rollback.");
        return;
      }

      const lastBatchRecords = await MigrationRecord.find({ batch: latestBatch })
        .sort({ executedAt: -1 })
        .lean();

      console.log(`\nRolling back Batch #${latestBatch} (${lastBatchRecords.length} migrations)...\n`);

      for (const record of lastBatchRecords) {
        console.log(`◀ Rolling back: ${record.name}`);
        const filePath = path.join(this.migrationsDir, record.name);
        const migrationModule = await import(`file://${filePath}`);

        if (typeof migrationModule.down === "function") {
          await migrationModule.down(mongoose.connection);
        } else {
          console.warn(`⚠ Migration ${record.name} does not export a 'down' function. Skipping reverse.`);
        }

        await MigrationRecord.deleteOne({ _id: record._id });
        console.log(`✓ Rolled back: ${record.name}\n`);
      }

      console.log(`✓ Rollback of Batch #${latestBatch} completed.`);
    } finally {
      await this.disconnect();
    }
  }

  async status() {
    await this.connect();
    try {
      const allFiles = this.getMigrationFiles();
      const executed = await this.getExecutedMigrations();
      const executedMap = new Map(executed.map((m) => [m.name, m]));

      console.log("\n=======================================================");
      console.log("               DATABASE MIGRATION STATUS               ");
      console.log("=======================================================");
      console.log(`Database: ${mongoose.connection.name}`);
      console.log("-------------------------------------------------------");

      allFiles.forEach((file) => {
        if (executedMap.has(file)) {
          const rec = executedMap.get(file);
          console.log(` [APPLIED]  Batch #${rec.batch} - ${file} (${new Date(rec.executedAt).toLocaleString()})`);
        } else {
          console.log(` [PENDING]  ${file}`);
        }
      });
      console.log("=======================================================\n");
    } finally {
      await this.disconnect();
    }
  }
}

// CLI Execution Handler
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] || "up";
  const manager = new MigrationManager();

  if (command === "up") {
    manager.up().catch((err) => {
      process.exit(1);
    });
  } else if (command === "down") {
    manager.down().catch((err) => {
      process.exit(1);
    });
  } else if (command === "status") {
    manager.status().catch((err) => {
      process.exit(1);
    });
  } else {
    console.log(`Unknown command: ${command}. Use 'up', 'down', or 'status'.`);
    process.exit(1);
  }
}

export default MigrationManager;
