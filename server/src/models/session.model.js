import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    tokenFamily: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
    deviceName: {
      type: String,
      default: "Unknown Device",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokeReason: {
      type: String,
      default: null,
      enum: [
        null,
        "logout",
        "logout_all",
        "password_reset",
        "password_change",
        "token_reuse",
        "user_disabled",
        "revoked_by_user",
      ],
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

export const Session = mongoose.model("Session", sessionSchema);
export default Session;
