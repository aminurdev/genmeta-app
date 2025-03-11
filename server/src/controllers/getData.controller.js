import { PricingPlan } from "../models/pricing-plan.model.js";
import { ImagesModel } from "../models/images.model.js";
import { UserActivity } from "../models/activity.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

export const getData = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  try {
    const [packages, recentActivity, userActivity] = await Promise.all([
      PricingPlan.find({ title: { $ne: "Free" } }).sort({ tokens: 1 }),
      ImagesModel.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
        { $limit: 4 },
        {
          $addFields: {
            imagesCount: { $size: "$images" },
          },
        },
        {
          $project: {
            images: 0,
          },
        },
      ]),
      UserActivity.findOne({ userId })
        .populate("plan.planId")
        .lean()
        .then((activity) => {
          if (activity) {
            activity.tokenHistory = activity.tokenHistory.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
          }
          return activity;
        }),
    ]);

    return new ApiResponse(200, true, "Successfully get", {
      packages,
      recentActivity,
      userActivity,
    }).send(res);
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new ApiError(
      500,
      error.message ||
        "An error occurred while fetching data. Please try again later."
    );
  }
});
