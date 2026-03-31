import { app } from "./app.js";
import config from "./config/index.js";
import connectDB from "./db/index.js";
import schedulerService from "./services/scheduler.service.js";

connectDB()
  .then(async () => {
    // Start the server
    app.listen(config.port, () => {
      console.log(`✓ Server running on port ${config.port}`);
    });

    // Start the scheduler (daily maintenance + weekly backup)
    schedulerService.start();
    console.log("✓ Scheduler initialized");
    console.log("  • Daily maintenance: 00:00 UTC");
    console.log("  • Weekly backup: Friday 12:00 UTC");
  })
  .catch((err) => {
    console.log("✗ MongoDB connection failed:", err.message);
  });
