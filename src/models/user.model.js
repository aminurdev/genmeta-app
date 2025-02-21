import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  isVerified: { type: Boolean, default: false },
  loginProvider: { type: String, enum: ["email", "google"], required: true },
  googleId: { type: String, unique: true, sparse: true },
  tokens: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
