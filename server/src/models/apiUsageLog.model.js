import mongoose from "mongoose";

const apiUsageLogSchema = new mongoose.Schema(
  {
    appKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppKey",
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
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

apiUsageLogSchema.index({ appKeyId: 1, date: 1 }, { unique: true });
apiUsageLogSchema.index({ userId: 1, date: 1 });

export const ApiUsageLog =
  mongoose.models.ApiUsageLog || mongoose.model("ApiUsageLog", apiUsageLogSchema);
export default ApiUsageLog;
