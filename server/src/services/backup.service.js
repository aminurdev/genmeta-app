import mongoose from "mongoose";
import config from "../config/index.js";
import { BackupLog } from "../models/backupLog.model.js";

/**
 * Backup Service for MongoDB Database
 * Handles syncing data from main database to backup database
 */
class BackupService {
  constructor() {
    this.backupConnection = null;
    this.isConnected = false;
    this.isRunning = false;
    this.currentRunStartedAt = null;
    this.memoryHistory = [];
    this.stats = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      lastBackup: null,
      lastBackupResult: null,
    };
  }

  /**
   * Resolve main (source) database name
   */
  getSourceDbName() {
    return mongoose.connection?.name || config.db_name;
  }

  /**
   * Resolve target backup database name
   */
  getBackupDbName() {
    return config.backup_db_name;
  }

  /**
   * Whether backup connection URI is configured
   */
  isConfigured() {
    return Boolean(config.mongodb_backup_uri);
  }

  /**
   * Get backup database URI from environment
   */
  getBackupUri() {
    const rawUri = config.mongodb_backup_uri;
    const backupDbName = this.getBackupDbName();
    const [basePart, queryPart] = rawUri.split("?");
    const cleanBase = basePart.replace(/\/+$/, "");

    return queryPart
      ? `${cleanBase}/${backupDbName}?${queryPart}`
      : `${cleanBase}/${backupDbName}`;
  }

  /**
   * Format millisecond duration cleanly for logs & UI
   */
  formatDuration(ms) {
    const safeMs = Math.max(0, Number(ms) || 0);
    if (safeMs < 1000) return `${safeMs}ms`;
    if (safeMs < 60000) return `${(safeMs / 1000).toFixed(2)}s`;
    const minutes = Math.floor(safeMs / 60000);
    const seconds = ((safeMs % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Keep bounded in-memory history as fallback if DB logging is unavailable
   */
  recordMemoryHistory(entry) {
    this.memoryHistory.unshift(entry);
    if (this.memoryHistory.length > 50) {
      this.memoryHistory.length = 50;
    }
  }

  /**
   * Connect to backup database
   */
  async connectToBackup() {
    try {
      const backupUri = this.getBackupUri();

      if (!backupUri) {
        throw new Error(
          "MONGODB_BACKUP_URI is not defined in environment variables"
        );
      }

      // Always create a fresh connection
      const connection = await mongoose
        .createConnection(backupUri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
        })
        .asPromise();

      this.backupConnection = connection;
      this.isConnected = true;

      return this.backupConnection;
    } catch (error) {
      this.isConnected = false;
      this.backupConnection = null;
      throw error;
    }
  }

  /**
   * Disconnect from backup database
   */
  async disconnectFromBackup() {
    try {
      if (this.backupConnection) {
        await this.backupConnection.close();
      }
    } catch (error) {
      console.log(error?.message);
      // Ignore errors during disconnect
    } finally {
      this.isConnected = false;
      this.backupConnection = null;
    }
  }

  /**
   * Get all collection names from main database
   */
  async getCollections() {
    const mainDb = mongoose.connection.db;
    if (!mainDb) {
      throw new Error("Main database connection is not ready");
    }
    const collections = await mainDb.listCollections().toArray();
    return collections.map((col) => col.name);
  }

  /**
   * Get live collection inventory and estimated document counts from main DB
   */
  async getSourceCollectionsSummary() {
    const database = this.getSourceDbName();
    const mainDb = mongoose.connection?.db;

    if (!mainDb) {
      return {
        database,
        totalCollections: 0,
        totalDocuments: 0,
        collections: [],
      };
    }

    const rawCollections = await mainDb.listCollections().toArray();
    const userCollectionNames = rawCollections
      .map((col) => col.name)
      .filter((name) => !name.startsWith("system."));

    const collectionCounts = await Promise.all(
      userCollectionNames.map(async (name) => {
        try {
          const count = await mainDb.collection(name).estimatedDocumentCount();
          return { name, documentsCount: count };
        } catch {
          return { name, documentsCount: 0 };
        }
      })
    );

    collectionCounts.sort((a, b) => {
      if (b.documentsCount !== a.documentsCount) {
        return b.documentsCount - a.documentsCount;
      }
      return a.name.localeCompare(b.name);
    });

    const totalDocuments = collectionCounts.reduce(
      (sum, item) => sum + (item.documentsCount || 0),
      0
    );

    return {
      database,
      totalCollections: collectionCounts.length,
      totalDocuments,
      collections: collectionCounts,
    };
  }

  /**
   * Sync a single collection from main to backup database
   */
  async syncCollection(collectionName, backupDb) {
    try {
      const mainDb = mongoose.connection.db;
      const mainCollection = mainDb.collection(collectionName);
      const backupCollection = backupDb.collection(collectionName);

      // Get all documents from main collection
      const documents = await mainCollection.find({}).toArray();

      // Always clear backup collection so emptied source collections don't leave stale docs
      await backupCollection.deleteMany({});

      if (documents.length === 0) {
        return {
          collection: collectionName,
          success: true,
          documentsCount: 0,
          message: "Collection is empty (synced)",
          error: null,
        };
      }

      // Insert all documents into backup collection
      const result = await backupCollection.insertMany(documents, {
        ordered: false,
      });

      return {
        collection: collectionName,
        success: true,
        documentsCount: result.insertedCount,
        message: `Successfully backed up ${result.insertedCount} documents`,
        error: null,
      };
    } catch (error) {
      return {
        collection: collectionName,
        success: false,
        documentsCount: 0,
        error: error.message,
        message: `Failed to backup collection: ${error.message}`,
      };
    }
  }

  /**
   * Persist backup run record into BackupLog without breaking backup return flow
   */
  async persistBackupLog(payload) {
    try {
      const created = await BackupLog.create(payload);
      return created?._id?.toString() || null;
    } catch (logError) {
      console.error("Failed to persist BackupLog:", logError?.message);
      return null;
    }
  }

  /**
   * Perform full database backup
   * Syncs all collections from main database to backup database
   */
  async performBackup(options = {}) {
    const { triggeredBy = "manual", triggeredByUser = null } = options;
    const normalizedTrigger =
      triggeredBy === "scheduled" ? "scheduled" : "manual";

    if (this.isRunning) {
      return {
        success: false,
        code: "BACKUP_IN_PROGRESS",
        message:
          "A database backup is already in progress. Please wait for it to finish.",
        timestamp: new Date().toISOString(),
        startedAt: this.currentRunStartedAt,
      };
    }

    const startTime = new Date();
    const sourceDatabase = this.getSourceDbName();
    const targetDatabase = this.getBackupDbName();

    this.isRunning = true;
    this.currentRunStartedAt = startTime.toISOString();
    this.stats.totalBackups++;

    console.log(`→ Database backup started (${normalizedTrigger})`);

    try {
      // Connect to backup database
      const backupConn = await this.connectToBackup();
      const backupDb = backupConn.db;

      // Get all collections from main database
      const collections = await this.getCollections();

      // Filter out system collections
      const userCollections = collections.filter(
        (name) => !name.startsWith("system.")
      );

      console.log(`  • Backing up ${userCollections.length} collections`);

      // Sync each collection sequentially to avoid saturating backup DB pool
      const results = [];
      let totalDocuments = 0;
      let successCount = 0;
      let failCount = 0;

      for (const collectionName of userCollections) {
        const result = await this.syncCollection(collectionName, backupDb);
        results.push(result);

        if (result.success) {
          successCount++;
          totalDocuments += result.documentsCount || 0;
        } else {
          failCount++;
        }
      }

      const endTime = new Date();
      const durationMs = Math.max(0, endTime - startTime);
      const duration = this.formatDuration(durationMs);
      const allSucceeded = failCount === 0;
      const errorSummary = allSucceeded
        ? null
        : `${failCount} of ${userCollections.length} collections failed to sync`;

      const logPayload = {
        timestamp: startTime,
        success: allSucceeded,
        durationMs,
        duration,
        collections: {
          total: userCollections.length,
          successful: successCount,
          failed: failCount,
        },
        totalDocuments,
        results,
        triggeredBy: normalizedTrigger,
        triggeredByUser:
          normalizedTrigger === "manual" && triggeredByUser
            ? {
                id: triggeredByUser.id || null,
                name: triggeredByUser.name || null,
                email: triggeredByUser.email || null,
              }
            : null,
        sourceDatabase,
        targetDatabase,
        error: errorSummary,
      };

      const savedId = await this.persistBackupLog(logPayload);

      const backupResult = {
        _id: savedId || startTime.toISOString(),
        success: allSucceeded,
        timestamp: startTime.toISOString(),
        durationMs,
        duration,
        collections: logPayload.collections,
        totalDocuments,
        results,
        triggeredBy: logPayload.triggeredBy,
        triggeredByUser: logPayload.triggeredByUser,
        sourceDatabase,
        targetDatabase,
        error: errorSummary,
        message: allSucceeded
          ? `Database backup completed (${totalDocuments} documents in ${duration})`
          : errorSummary,
      };

      if (backupResult.success) {
        this.stats.successfulBackups++;
        console.log(
          `✓ Database backup completed (${totalDocuments} documents in ${duration})`
        );
      } else {
        this.stats.failedBackups++;
        console.log(`✗ Database backup completed with errors`);
      }

      this.stats.lastBackup = startTime;
      this.stats.lastBackupResult = backupResult;
      this.recordMemoryHistory(backupResult);

      return backupResult;
    } catch (error) {
      this.stats.failedBackups++;
      const endTime = new Date();
      const durationMs = Math.max(0, endTime - startTime);
      const duration = this.formatDuration(durationMs);

      const errorPayload = {
        timestamp: startTime,
        success: false,
        durationMs,
        duration,
        collections: {
          total: 0,
          successful: 0,
          failed: 0,
        },
        totalDocuments: 0,
        results: [],
        triggeredBy: normalizedTrigger,
        triggeredByUser:
          normalizedTrigger === "manual" && triggeredByUser
            ? {
                id: triggeredByUser.id || null,
                name: triggeredByUser.name || null,
                email: triggeredByUser.email || null,
              }
            : null,
        sourceDatabase,
        targetDatabase,
        error: error.message,
      };

      const savedId = await this.persistBackupLog(errorPayload);

      const errorResult = {
        _id: savedId || startTime.toISOString(),
        success: false,
        timestamp: startTime.toISOString(),
        durationMs,
        duration,
        collections: errorPayload.collections,
        totalDocuments: 0,
        results: [],
        triggeredBy: errorPayload.triggeredBy,
        triggeredByUser: errorPayload.triggeredByUser,
        sourceDatabase,
        targetDatabase,
        error: error.message,
        message: error.message || "Backup failed",
      };

      this.stats.lastBackup = startTime;
      this.stats.lastBackupResult = errorResult;
      this.recordMemoryHistory(errorResult);
      console.error("✗ Database backup failed:", error.message);

      return errorResult;
    } finally {
      this.isRunning = false;
      this.currentRunStartedAt = null;
      await this.disconnectFromBackup();
    }
  }

  /**
   * Get backup service status and statistics
   */
  getStatus() {
    const uri = this.getBackupUri();
    return {
      isConfigured: this.isConfigured(),
      isConnected: this.isConnected,
      isRunning: this.isRunning,
      currentRunStartedAt: this.currentRunStartedAt,
      sourceDatabase: this.getSourceDbName(),
      targetDatabase: this.getBackupDbName(),
      backupUri:
        this.isConnected && uri
          ? uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")
          : null,
      stats: this.stats,
      memoryHistory: this.memoryHistory,
    };
  }

  /**
   * Test backup database connection and gather diagnostics
   */
  async testConnection() {
    const checkedAt = new Date().toISOString();

    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        message: "MONGODB_BACKUP_URI is not configured in environment variables",
        database: null,
        latencyMs: null,
        collectionsCount: null,
        checkedAt,
        error: "MONGODB_BACKUP_URI is not configured",
      };
    }

    const startMs = Date.now();
    try {
      const backupConn = await this.connectToBackup();
      const adminDb = backupConn.db.admin();
      await adminDb.ping();
      const latencyMs = Math.max(1, Date.now() - startMs);

      const remoteCollections = await backupConn.db.listCollections().toArray();
      const collectionsCount = remoteCollections.filter(
        (col) => !col.name.startsWith("system.")
      ).length;

      return {
        success: true,
        configured: true,
        message: "Backup database connection successful",
        database: backupConn.name || this.getBackupDbName(),
        latencyMs,
        collectionsCount,
        checkedAt,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        configured: true,
        message: "Backup database connection failed",
        database: this.getBackupDbName(),
        latencyMs: Math.max(1, Date.now() - startMs),
        collectionsCount: null,
        checkedAt,
        error: error.message,
      };
    } finally {
      await this.disconnectFromBackup();
    }
  }
}

// Create and export singleton instance
const backupService = new BackupService();
export default backupService;

// Export the class for testing purposes
export { BackupService };
