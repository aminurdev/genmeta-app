import mongoose from "mongoose";

const backupCollectionResultSchema = new mongoose.Schema(
  {
    collection: {
      type: String,
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    documentsCount: {
      type: Number,
      default: 0,
    },
    message: {
      type: String,
      default: "",
    },
    error: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const backupLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    success: {
      type: Boolean,
      required: true,
      default: false,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    duration: {
      type: String,
      default: "0ms",
    },
    collections: {
      total: { type: Number, default: 0 },
      successful: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    totalDocuments: {
      type: Number,
      default: 0,
    },
    results: {
      type: [backupCollectionResultSchema],
      default: [],
    },
    triggeredBy: {
      type: String,
      enum: ["manual", "scheduled"],
      default: "manual",
    },
    triggeredByUser: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      name: {
        type: String,
        default: null,
      },
      email: {
        type: String,
        default: null,
      },
    },
    sourceDatabase: {
      type: String,
      default: null,
    },
    targetDatabase: {
      type: String,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

backupLogSchema.index({ timestamp: -1 });
backupLogSchema.index({ success: 1, timestamp: -1 });
backupLogSchema.index({ triggeredBy: 1, timestamp: -1 });

export const BackupLog = mongoose.model("BackupLog", backupLogSchema);

export default BackupLog;
