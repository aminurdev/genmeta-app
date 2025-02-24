import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  images: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      originalImage: {
        type: String,
        required: [true, "Original image URL is required"],
      },
      metadata: { type: Object, required: [true, "Metadata is required"] },
      generatedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Images", imageSchema);
