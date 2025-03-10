import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    plan: {
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PricingPlan",
        required: [true, "Plan ID is required"],
      },
      status: {
        type: String,
        required: [true, "Status type is required"],
        enum: ["Active", "Expires"],
      },
      expiresDate: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    },
    availableTokens: {
      type: Number,
      default: 0,
      min: [0, "Available tokens cannot be negative"],
    },
    totalImageProcessed: {
      type: Number,
      default: 0,
      min: [0, "Total images processed cannot be negative"],
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
          enum: ["assigned", "purchase", "usage", "refund"],
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
            enum: ["added", "used", "refund"],
          },
        },
      },
    ],
  },
  { timestamps: true }
);

userActivitySchema.pre("save", function (next) {
  if (this.plan.expiresDate && new Date() > this.plan.expiresDate) {
    this.plan.status = "Expires";
  }
  next();
});

userActivitySchema.methods.addTokens = function (count, description) {
  this.availableTokens += count;
  this.totalTokensPurchased += count;
  this.tokenHistory.push({
    actionType: "purchase",
    description,
    tokenDetails: { count, type: "added" },
  });
};

userActivitySchema.methods.useTokens = function (count, description) {
  if (this.availableTokens < count) throw new Error("Insufficient tokens");

  this.availableTokens -= count;
  this.totalTokensUsed += count;
  this.tokensUsedThisMonth += count;
  this.tokenHistory.push({
    actionType: "usage",
    description,
    tokenDetails: { count, type: "used" },
  });
};

userActivitySchema.methods.refundTokens = function (count, description) {
  this.availableTokens -= count;
  this.tokenHistory.push({
    actionType: "refund",
    description,
    tokenDetails: { count, type: "refund" },
  });
};

// Export model
export const UserActivity = mongoose.model("UserActivity", userActivitySchema);
