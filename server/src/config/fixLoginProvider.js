import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const fixLoginProvider = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/gen-meta-ai");

    const result = await User.updateMany(
      { loginProvider: { $type: "string" } },
      [{ $set: { loginProvider: ["$loginProvider"] } }]
    );

    console.log(`Updated ${result.modifiedCount} users.`);
  } catch (err) {
    console.error("Error fixing loginProvider:", err);
  } finally {
    mongoose.disconnect();
  }
};

fixLoginProvider();
