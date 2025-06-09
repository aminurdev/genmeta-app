import mongoose from "mongoose";

// Define Mongoose Schema for bKash Token
const bKashTokenSchema = new mongoose.Schema({
  ai_api_key: {
    type: String,
    required: true,
  },
});

// Create the model (if not already created)
export const AiAPI = mongoose.model("AiAPI", bKashTokenSchema);
