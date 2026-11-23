import mongoose from "mongoose";
import {
  NOTIFICATION_BROADCAST_TARGETS,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
} from "../constants/index.js";

const notificationBroadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: [
        NOTIFICATION_CATEGORIES.ANNOUNCEMENT,
        NOTIFICATION_CATEGORIES.SYSTEM,
        NOTIFICATION_CATEGORIES.BILLING,
        NOTIFICATION_CATEGORIES.PLAN,
      ],
      default: NOTIFICATION_CATEGORIES.ANNOUNCEMENT,
    },
    priority: {
      type: String,
      enum: Object.values(NOTIFICATION_PRIORITIES),
      default: NOTIFICATION_PRIORITIES.NORMAL,
    },
    target: {
      type: String,
      enum: Object.values(NOTIFICATION_BROADCAST_TARGETS),
      required: true,
    },
    targetUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    actionUrl: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
    actionLabel: {
      type: String,
      default: null,
      trim: true,
      maxlength: 60,
    },
    sendEmail: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stats: {
      targetedCount: { type: Number, default: 0 },
      deliveredCount: { type: Number, default: 0 },
      emailSentCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

notificationBroadcastSchema.index({ createdAt: -1 });

export const NotificationBroadcast =
  mongoose.models.NotificationBroadcast ||
  mongoose.model(
    "NotificationBroadcast",
    notificationBroadcastSchema,
    "notificationbroadcasts"
  );

export default NotificationBroadcast;
