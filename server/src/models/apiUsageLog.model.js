import mongoose from "mongoose";
import { PROCESS_ERROR_STATUS } from "../constants/index.js";

const apiUsageLogSchema = new mongoose.Schema(
  {
    appUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppUser",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    processCount: {
      type: Number,
      default: 0,
    },
    fileCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    errors: {
      type: [String],
      default: [],
    },
    errorStatus: {
      type: String,
      enum: Object.values(PROCESS_ERROR_STATUS),
      default: PROCESS_ERROR_STATUS.UNRESOLVED,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
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
    resolutionNote: {
      type: String,
      default: null,
      maxlength: 500,
    },
    lastErrorAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "dailyapiusages",
    suppressReservedKeysWarning: true,
  }
);

apiUsageLogSchema.index({ appUserId: 1, date: 1 }, { unique: true });
apiUsageLogSchema.index({ userId: 1, date: 1 });
apiUsageLogSchema.index({ failedCount: 1, date: -1 });
apiUsageLogSchema.index({ errorStatus: 1, date: -1 });
apiUsageLogSchema.index({ date: -1, updatedAt: -1 });

export const ApiUsageLog =
  mongoose.models.ApiUsageLog || mongoose.model("ApiUsageLog", apiUsageLogSchema);
export default ApiUsageLog;
