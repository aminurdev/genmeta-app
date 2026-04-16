import mongoose from "mongoose";
import config from "../config/index.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(config.mongodb_uri);
    console.log(`✓ Main Database connected: ${connectionInstance.connection.host}`);
  } catch (err) {
    console.error("✗ Main Database connection failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
