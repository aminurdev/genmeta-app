import mongoose from "mongoose";
import config from "../constants.js";
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(config.mongodb_uri);
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (err) {
    console.error("MongoDB connection FAILED: ", err);
    process.exit(1);
  }
};
export default connectDB;
