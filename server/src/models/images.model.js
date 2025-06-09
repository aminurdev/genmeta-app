import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    batchId: { type: String, required: [true, "Batch ID is required"] },
    name: { type: String, required: [true, "Batch name is required"] },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Partial"],
      default: "Pending",
    },
    tokensUsed: { type: Number, required: true },
    images: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        imageName: { type: String, required: [true, "Image name is required"] },
        size: { type: Number },
        imageUrl: { type: String, required: [true, "Image URI is required"] },
        metadata: { type: Object, required: [true, "Metadata is required"] },
        generatedAt: { type: Date, default: Date.now },
      },
    ],
    failedImages: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        filename: { type: String, required: true },
        error: { type: String, required: true },
        retryCount: { type: Number, default: 0 },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const ImagesModel = mongoose.model("Images", imageSchema);
