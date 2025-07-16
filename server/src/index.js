import { app } from "./app.js";
import config from "./config/index.js";
import connectDB from "./db/index.js";
import schedulerService from "./services/scheduler.service.js";

connectDB()
  .then(() => {
    // Start the server
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);

      // Start the daily maintenance scheduler after server is running
      schedulerService.start();
      console.log("Daily maintenance scheduler initialized");
    });
  })
  .catch((err) => {
    console.log("MongoDB connection FAILED !!!", err);
  });
