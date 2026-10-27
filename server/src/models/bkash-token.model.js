import mongoose from "mongoose";

const bKashTokenSchema = new mongoose.Schema(
  {
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
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const BKashToken =
  mongoose.models.BKashToken || mongoose.model("BKashToken", bKashTokenSchema);
export default BKashToken;
