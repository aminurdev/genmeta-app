import { app } from "./app.js";
import config from "./config/index.js";
import { connectDB, disconnectDB } from "./db/index.js";
import schedulerService from "./services/scheduler.service.js";

let server;

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...", error);
  process.exit(1);
});

async function startServer() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start Express Server
    server = app.listen(config.port, () => {
      console.log(`✓ Server running in ${config.NODE_ENV} mode on port ${config.port}`);
      console.log(`✓ Health endpoint: http://localhost:${config.port}/health`);
    });

    // Set 5-minute timeout on HTTP server to handle long-running operations like backups
    server.timeout = 300000;
    server.requestTimeout = 300000;

    // 3. Initialize background schedulers
    schedulerService.start();
    console.log("✓ Scheduler initialized");
    console.log("  • Daily maintenance: 00:00 UTC");
    console.log("  • Weekly backup: Friday 12:00 UTC");
  } catch (error) {
    console.error("✗ Server startup failed:", error.message);
    process.exit(1);
  }
}

// Graceful Shutdown Handler
const shutdown = async (signal) => {
  console.log(`\n⚠ Received ${signal}. Starting graceful shutdown...`);

  const forceExitTimeout = setTimeout(() => {
    console.error("✗ Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10000);

  try {
    // 1. Stop background schedulers
    schedulerService.stop();

    // 2. Stop receiving HTTP requests
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          console.log("✓ HTTP server closed");
          resolve();
        });
      });
    }

    // 3. Disconnect database
    await disconnectDB();

    clearTimeout(forceExitTimeout);
    console.log("✓ Graceful shutdown completed cleanly.");
    process.exit(0);
  } catch (error) {
    console.error("✗ Error during graceful shutdown:", error.message);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  console.error("💥 UNHANDLED REJECTION:", reason);
});

startServer();
