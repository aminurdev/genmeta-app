import mongoose from "mongoose";

/**
 * Backup Service for MongoDB Database
 * Handles syncing data from main database to backup database
 */
class BackupService {
  constructor() {
    this.backupConnection = null;
    this.isConnected = false;
    this.stats = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      lastBackup: null,
      lastBackupResult: null,
    };
  }

  /**
   * Get backup database URI from environment
   */
  getBackupUri() {
    const backupUri = process.env.MONGODB_BACKUP_URI;
    const backupDbName =
      process.env.BACKUP_DB_NAME || process.env.DB_NAME + "_backup";

    if (!backupUri) {
      return null;
    }

    return `${backupUri}/${backupDbName}`;
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
    const collections = await mainDb.listCollections().toArray();
    return collections.map((col) => col.name);
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

      if (documents.length === 0) {
        return {
          collection: collectionName,
          success: true,
          documentsCount: 0,
          message: "Collection is empty",
        };
      }

      // Clear backup collection
      await backupCollection.deleteMany({});

      // Insert all documents into backup collection
      const result = await backupCollection.insertMany(documents, {
        ordered: false,
      });

      return {
        collection: collectionName,
        success: true,
        documentsCount: result.insertedCount,
        message: `Successfully backed up ${result.insertedCount} documents`,
      };
    } catch (error) {
      return {
        collection: collectionName,
        success: false,
        error: error.message,
        message: `Failed to backup collection: ${error.message}`,
      };
    }
  }

  /**
   * Perform full database backup
   * Syncs all collections from main database to backup database
   */
  async performBackup() {
    const startTime = new Date();
    console.log(`→ Database backup started`);

    this.stats.totalBackups++;

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

      // Sync each collection
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
      const duration = endTime - startTime;

      const backupResult = {
        success: failCount === 0,
        timestamp: startTime.toISOString(),
        duration: `${duration}ms`,
        collections: {
          total: userCollections.length,
          successful: successCount,
          failed: failCount,
        },
        totalDocuments,
        results,
      };

      if (backupResult.success) {
        this.stats.successfulBackups++;
        console.log(
          `✓ Database backup completed (${totalDocuments} documents in ${duration}ms)`
        );
      } else {
        this.stats.failedBackups++;
        console.log(`✗ Database backup completed with errors`);
      }

      this.stats.lastBackup = startTime;
      this.stats.lastBackupResult = backupResult;

      // Close the connection after backup
      await this.disconnectFromBackup();

      return backupResult;
    } catch (error) {
      this.stats.failedBackups++;

      const errorResult = {
        success: false,
        timestamp: startTime.toISOString(),
        error: error.message,
        message: "Backup failed",
      };

      this.stats.lastBackupResult = errorResult;
      console.error("✗ Database backup failed:", error.message);

      // Ensure connection is closed even on error
      await this.disconnectFromBackup();

      return errorResult;
    }
  }

  /**
   * Get backup service status and statistics
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      backupUri: this.isConnected
        ? this.getBackupUri().replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")
        : null,
      stats: this.stats,
    };
  }

  /**
   * Test backup database connection
   */
  async testConnection() {
    try {
      const backupConn = await this.connectToBackup();
      const adminDb = backupConn.db.admin();
      const result = await adminDb.ping();

      // Close the connection after testing
      await this.disconnectFromBackup();

      return {
        success: true,
        message: "Backup database connection successful",
        database: backupConn.name,
        result,
      };
    } catch (error) {
      // Ensure connection is closed even on error
      await this.disconnectFromBackup();

      return {
        success: false,
        message: "Backup database connection failed",
        error: error.message,
      };
    }
  }
}

// Create and export singleton instance
const backupService = new BackupService();
export default backupService;

// Export the class for testing purposes
export { BackupService };
