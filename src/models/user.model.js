import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/index.js";

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

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
    },
    config.access_token_secret,
    { expiresIn: config.access_token_expiry }
  );
};

userSchema.methods.generateRefreshToken = function () {
  jwt.sign(
    {
      _id: this._id,
    },
    config.refresh_token_secret,
    { expiresIn: config.refresh_token_expiry }
  );
};

userSchema.methods.generateRefreshToken = function () {};

export default mongoose.model("User", userSchema);
