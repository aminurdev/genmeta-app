import mongoose from "mongoose";

// Token Management Schema
const userActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PricingPlan",
      required: [true, "Plan ID is required"],
    },
    availableTokens: {
      type: Number,
      default: 0,
      min: [0, "Available tokens cannot be negative"],
    },
    totalImageProcessed: {
      type: Number,
      default: 0,
      min: [0, "Available tokens cannot be negative"],
    },
    tokensUsedThisMonth: {
      type: Number,
      default: 0,
      min: [0, "Tokens used this month cannot be negative"],
    },
    totalTokensUsed: {
      type: Number,
      default: 0,
      min: [0, "Total tokens used cannot be negative"],
    },
    totalTokensPurchased: {
      type: Number,
      default: 0,
      min: [0, "Total tokens purchased cannot be negative"],
    },

    tokenHistory: [
      {
        actionType: {
          type: String,
          required: [true, "Action type is required"],
          enum: ["purchase", "usage", "refund"],
        },
        description: {
          type: String,
          required: [true, "Description is required"],
          trim: true,
        },
        tokenDetails: {
          count: {
            type: Number,
            required: true,
            min: [1, "Token count must be at least 1"],
          },
          type: {
            type: String,
            required: [true, "Token type is required"],
            enum: ["added", "used"],
          },
        },
      },
    ],
  },
  { timestamps: true }
);

// Export model
export const UserActivity = mongoose.model("UserActivity", userActivitySchema);
