import { app } from "./app.js";
import config from "./config/index.js";
import connectDB from "./db/index.js";

connectDB()
  .then(() => {})
  .catch((err) => {
    console.log("MongoDB connection FAILED !!!", err);
  });
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
