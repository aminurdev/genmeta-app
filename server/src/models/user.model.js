import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { USER_ROLES } from "../constants/index.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Please provide a valid email address",
      },
    },
    password: {
      type: String,
      required: [
        function () {
          return this.loginProvider?.includes("email");
        },
        "Password is required for email login",
      ],
      minlength: [6, "Password must be at least 6 characters"],
    },
    avatar: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    referred: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    loginProvider: {
      type: [String],
      enum: {
        values: ["email", "google"],
        message: "Login provider must be either 'email' or 'google'",
      },
      required: [true, "Login provider is required"],
      default: ["email"],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: "Role must be 'user', 'admin', or 'superAdmin'",
      },
      default: USER_ROLES.USER,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  if (!this.password || !candidatePassword) return false;
  return await bcrypt.compare(candidatePassword, this.password);
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

// Compound index for administrative queries
userSchema.index({ role: 1, isVerified: 1, createdAt: -1 });

export const User = mongoose.model("User", userSchema);
export default User;
