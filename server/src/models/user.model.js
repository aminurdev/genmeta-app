import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/index.js";

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"], trim: true },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (email) {
        return /^\S+@\S+\.\S+$/.test(email);
      },
      message: "Invalid email format",
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  isVerified: { type: Boolean, default: false },
  loginProvider: {
    type: String,
    enum: {
      values: ["email", "google"],
      message: "Login provider must be either email or google",
    },
    required: [true, "Login provider is required"],
  },
  googleId: { type: String, unique: true, sparse: true },
  refreshToken: { type: String },
  tokens: { type: Number, default: 10 },
  role: {
    type: String,
    enum: {
      values: ["user", "admin"],
      message: "Role must be either user or admin",
    },
    default: "user",
  },
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
  return jwt.sign(
    {
      userId: this._id,
      name: this.name,
      email: this.email,
      role: this.role,
    },
    config.access_token_secret,
    { expiresIn: config.access_token_expiry }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      userId: this._id,
    },
    config.refresh_token_secret,
    { expiresIn: config.refresh_token_expiry }
  );
};

export const User = mongoose.model("User", userSchema);
