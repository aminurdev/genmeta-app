import mongoose from "mongoose";

const authTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "email_verification",
        "password_reset",
        "password_reset_session",
        "oauth_exchange",
      ],
      required: true,
      index: true,
    },
    codeHash: {
      type: String,
      default: null,
      index: true,
    },
    linkTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

authTokenSchema.index({ userId: 1, type: 1, usedAt: 1 });

export const AuthToken = mongoose.model("AuthToken", authTokenSchema);
export default AuthToken;
