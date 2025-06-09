import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import ApiError from "../../utils/api.error.js";
import { ImagesModel } from "../../models/images.model.js";

// Get all users (with pagination and filtering)
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 5,
    search = "",
    role,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build search query
  const searchQuery = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  // Add role filter if provided
  if (role) {
    searchQuery.role = role;
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Pagination
  const pageNumber = Math.max(1, Number(page));
  const pageSize = Math.max(1, Number(limit));
  const skip = (pageNumber - 1) * pageSize;

  // Fetch users with their details
  const users = await User.aggregate([
    {
      $match: searchQuery,
    },
    {
      $lookup: {
        from: "useractivities",
        localField: "_id",
        foreignField: "userId",
        as: "activity",
      },
    },
    {
      $lookup: {
        from: "images",
        localField: "_id",
        foreignField: "userId",
        as: "images",
      },
    },
    {
      $lookup: {
        from: "pricingplans",
        let: { planId: { $arrayElemAt: ["$activity.plan.planId", 0] } },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$planId"] },
            },
          },
        ],
        as: "planDetails",
      },
    },
    {
      $addFields: {
        activity: { $arrayElemAt: ["$activity", 0] },
        planDetails: { $arrayElemAt: ["$planDetails", 0] },
        totalImages: { $size: "$images" },
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        role: 1,
        isDisabled: 1,
        createdAt: 1,
        activity: 1,
        totalImages: 1,
        planDetails: 1,
      },
    },
    { $sort: sortOptions },
    { $skip: skip },
    { $limit: pageSize },
  ]);

  // Count total users
  const totalUsers = await User.countDocuments(searchQuery);

  // Format the response data
  const formattedUsers = users.map((user) => ({
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.isDisabled ? "disabled" : "active",
    currentPlan: user.activity?.plan
      ? {
          name: user.planDetails?.title || "Unknown Plan",
          tokens: user.planDetails?.tokens || 0,
          status: user.activity.plan.status,
          expiresDate: user.activity.plan.expiresDate,
        }
      : null,
    tokens: {
      available: user.activity?.availableTokens || 0,
      used: user.activity?.totalTokensUsed || 0,
      total: user.activity?.totalTokensPurchased || 0,
    },
    images: {
      processed: user.activity?.totalImageProcessed || 0,
      total: user.totalImages || 0,
    },
    createdAt: user.createdAt,
  }));

  // Pagination metadata
  const pagination = {
    currentPage: pageNumber,
    totalPages: Math.ceil(totalUsers / pageSize),
    totalUsers,
    pageSize,
  };

  return new ApiResponse(200, true, "Users retrieved successfully", {
    users: formattedUsers,
    pagination,
  }).send(res);
});

// Get user details by ID
export const getUserDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Validate MongoDB ID
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Get user basic info
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Get user's total images count
  const totalImages = await ImagesModel.countDocuments({ userId });

  // Format the response
  const response = {
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      status: user.isDisabled ? "disabled" : "active",
      createdAt: user.createdAt,
    },

    tokens: {
      available: user.token.available || 0,
      used: user.token.used || 0,
    },
    images: {
      processed: user.token.used || 0,
      total: totalImages,
    },
  };

  return new ApiResponse(
    200,
    true,
    "User details retrieved successfully",
    response
  ).send(res);
});

// Update user role
export const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  // Validate MongoDB ID
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Validate role
  if (!["user", "admin"].includes(role)) {
    throw new ApiError(400, 'Invalid role. Must be "user" or "admin"');
  }

  // Prevent last admin from being demoted
  const adminCount = await User.countDocuments({ role: "admin" });

  const existingUser = await User.findById(userId);
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  // Prevent removing the last admin
  if (existingUser.role === "admin" && adminCount <= 1 && role === "user") {
    throw new ApiError(400, "Cannot remove the last admin");
  }

  // Update user role
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return new ApiResponse(
    200,
    true,
    "User role updated successfully",
    updatedUser
  ).send(res);
});

// Disable/Delete user account
export const disableUserAccount = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Validate MongoDB ID
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Prevent disabling the last admin
  if (user.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      throw new ApiError(400, "Cannot disable the last admin");
    }
  }

  // Soft delete - set account to disabled
  user.isDisabled = true;
  await user.save();

  return new ApiResponse(
    200,
    true,
    "User account disabled successfully",
    null
  ).send(res);
});

// Get user statistics for admin dashboard
export const getUserStatistics = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const verifiedUsers = await User.countDocuments({ isVerified: true });
  const unverifiedUsers = await User.countDocuments({ isVerified: false });
  const adminUsers = await User.countDocuments({ role: "admin" });
  const regularUsers = await User.countDocuments({ role: "user" });

  // Recent user registrations (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  return new ApiResponse(200, true, "User statistics retrieved successfully", {
    totalUsers,
    verifiedUsers,
    unverifiedUsers,
    adminUsers,
    regularUsers,
    recentUsers,
  }).send(res);
});

// Get all users with detailed information
export const getAllUsersWithDetails = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 5,
    search = "",
    role,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build search query
  const searchQuery = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  // Add filters if provided
  if (role) searchQuery.role = role;
  if (status) {
    searchQuery.isDisabled = status === "disabled";
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Pagination
  const pageNumber = Math.max(1, Number(page));
  const pageSize = Math.max(1, Number(limit));
  const skip = (pageNumber - 1) * pageSize;

  // Fetch users with their details
  const users = await User.aggregate([
    {
      $match: searchQuery,
    },
    {
      $lookup: {
        from: "useractivities",
        localField: "_id",
        foreignField: "userId",
        as: "activity",
      },
    },
    {
      $lookup: {
        from: "images",
        localField: "_id",
        foreignField: "userId",
        as: "images",
      },
    },
    {
      $lookup: {
        from: "pricingplans",
        let: { planId: { $arrayElemAt: ["$activity.plan.planId", 0] } },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$planId"] },
            },
          },
        ],
        as: "planDetails",
      },
    },
    {
      $addFields: {
        activity: { $arrayElemAt: ["$activity", 0] },
        planDetails: { $arrayElemAt: ["$planDetails", 0] },
        totalImages: { $size: "$images" },
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        role: 1,
        isDisabled: 1,
        isVerified: 1,
        createdAt: 1,
        activity: 1,
        totalImages: 1,
        planDetails: 1,
      },
    },
    { $sort: sortOptions },
    { $skip: skip },
    { $limit: pageSize },
  ]);

  // Count total users
  const totalUsers = await User.countDocuments(searchQuery);

  // Format the response data
  const formattedUsers = users.map((user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.isDisabled ? "disabled" : "active",
    isVerified: user.isVerified || false,
    currentPlan: user.activity?.plan
      ? {
          name: user.planDetails?.title || "Unknown Plan",
          tokens: user.planDetails?.tokens || 0,
          status: user.activity.plan.status,
          expiresDate: user.activity.plan.expiresDate,
        }
      : null,
    tokens: {
      available: user.activity?.availableTokens || 0,
      used: user.activity?.totalTokensUsed || 0,
      total: user.activity?.totalTokensPurchased || 0,
    },
    images: {
      processed: user.activity?.totalImageProcessed || 0,
      total: user.totalImages || 0,
    },
    createdAt: user.createdAt,
  }));

  // Pagination metadata
  const pagination = {
    currentPage: pageNumber,
    totalPages: Math.ceil(totalUsers / pageSize),
    totalUsers,
    pageSize,
  };

  return new ApiResponse(200, true, "Users retrieved successfully", {
    users: formattedUsers,
    pagination,
  }).send(res);
});

// Get user's images with pagination
export const getUserImages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 5 } = req.query;

  // Validate MongoDB ID
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Pagination
  const pageNumber = Math.max(1, Number(page));
  const pageSize = Math.max(1, Number(limit));
  const skip = (pageNumber - 1) * pageSize;

  // Get user's recent images with pagination
  const images = await ImagesModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: pageSize },
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
  ]);

  // Count total images
  const totalImages = await ImagesModel.countDocuments({ userId });

  return new ApiResponse(200, true, "User images retrieved successfully", {
    images,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalImages / pageSize),
      totalItems: totalImages,
      pageSize,
    },
  }).send(res);
});
