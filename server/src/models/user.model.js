import mongoose from "mongoose";
import crypto from "crypto";
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
      minlength: [8, "Password must be at least 8 characters"],
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
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, config.bcrypt_rounds);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

userSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  if (!this.password || !candidatePassword) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function (sessionId = null) {
  const payload = {
    userId: this._id.toString(),
    role: this.role,
    type: "access",
  };
  if (sessionId) {
    payload.sid = sessionId.toString();
  }
  return jwt.sign(payload, config.access_token_secret, {
    expiresIn: config.access_token_expiry,
  });
};

userSchema.methods.generateRefreshToken = function (sessionId, tokenFamily) {
  const payload = {
    userId: this._id.toString(),
    type: "refresh",
    jti: crypto.randomUUID(),
  };
  if (sessionId) {
    payload.sid = sessionId.toString();
  }
  if (tokenFamily) {
    payload.fam = tokenFamily;
  }
  return jwt.sign(payload, config.refresh_token_secret, {
    expiresIn: config.refresh_token_expiry,
  });
};

// Compound index for administrative queries
userSchema.index({ role: 1, isVerified: 1, createdAt: -1 });

export const User = mongoose.model("User", userSchema);
export default User;
