import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  images: [
    {
      originalImage: { type: String, required: true },
      metadata: { type: Object, required: true },
      generatedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Images", imageSchema);
