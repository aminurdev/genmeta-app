import mongoose from "mongoose";
import {
  NOTIFICATION_AUDIENCES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
} from "../constants/index.js";

const actorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: { type: String, trim: true, default: null },
    email: { type: String, trim: true, default: null },
    avatar: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    audience: {
      type: String,
      enum: Object.values(NOTIFICATION_AUDIENCES),
      default: NOTIFICATION_AUDIENCES.USER,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(NOTIFICATION_CATEGORIES),
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(NOTIFICATION_PRIORITIES),
      default: NOTIFICATION_PRIORITIES.NORMAL,
    },
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
    actor: {
      type: actorSchema,
      default: () => ({}),
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    channels: {
      inApp: { type: Boolean, default: true },
      email: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date, default: null },
        error: { type: String, default: null },
      },
    },
    dedupeKey: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },
    broadcastId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotificationBroadcast",
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  recipientId: 1,
  audience: 1,
  isArchived: 1,
  createdAt: -1,
});
notificationSchema.index({
  recipientId: 1,
  audience: 1,
  isRead: 1,
  isArchived: 1,
});
notificationSchema.index({
  recipientId: 1,
  category: 1,
  isArchived: 1,
  createdAt: -1,
});
notificationSchema.index(
  { recipientId: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: "string" } },
  }
);
notificationSchema.index({ broadcastId: 1, isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema, "notifications");

export default Notification;
