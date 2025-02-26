import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  batchId: { type: String, required: [true, "Batch ID is required"] },
  images: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      imageName: {
        type: String,
        required: [true, "Image name is required"],
      },

      imageUrl: { type: String, required: [true, "Image URI is required"] },
      metadata: { type: Object, required: [true, "Metadata is required"] },
      generatedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export const ImagesModel = mongoose.model("Images", imageSchema);
