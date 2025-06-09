import mongoose from "mongoose";

// Define Mongoose Schema for bKash Token
const bKashTokenSchema = new mongoose.Schema({
  id_token: {
    type: String,
    required: true,
  },
  refresh_token: {
    type: String,
    required: true,
  },
  expires_at: {
    type: Date,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Create the model (if not already created)
export const BKashToken =
  mongoose.models.BKashToken || mongoose.model("BKashToken", bKashTokenSchema);
