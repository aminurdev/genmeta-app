import mongoose from "mongoose";

const aiApiKeySchema = new mongoose.Schema(
  {
    ai_api_key: {
      type: String,
      required: [true, "AI API key is required"],
    },
    name: {
      type: String,
      default: "Gemini API Key",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AiAPI =
  mongoose.models.AiAPI || mongoose.model("AiAPI", aiApiKeySchema);
export default AiAPI;
