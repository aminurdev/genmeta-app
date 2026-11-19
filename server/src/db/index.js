import mongoose from "mongoose";
import config from "../config/index.js";

const mongooseOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  autoIndex: config.NODE_ENV !== "production", // Don't auto-build indexes in production; use migrations
};

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const connectionInstance = await mongoose.connect(config.mongodb_uri, mongooseOptions);
    isConnected = true;
    console.log(`✓ Main Database connected: ${connectionInstance.connection.host}/${connectionInstance.connection.name}`);

    mongoose.connection.on("error", (err) => {
      console.error("✗ MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠ MongoDB disconnected. Attempting to reconnect...");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✓ MongoDB reconnected successfully");
      isConnected = true;
    });

    return connectionInstance.connection;
  } catch (err) {
    console.error("✗ Main Database connection failed:", err.message);
    if (config.isProduction) {
      process.exit(1);
    }
    throw err;
  }
};

export const disconnectDB = async () => {
  if (!isConnected) return;
  try {
    await mongoose.connection.close(false);
    isConnected = false;
    console.log("✓ MongoDB connection closed gracefully");
  } catch (err) {
    console.error("✗ Error while closing MongoDB connection:", err.message);
  }
};

export default connectDB;
