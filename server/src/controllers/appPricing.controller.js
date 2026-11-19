import mongoose from "mongoose";
import { AppPricing } from "../models/appPricing.model.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PLAN_TYPES } from "../constants/index.js";

export const getAllPlans = asyncHandler(async (req, res) => {
  const plans = await AppPricing.find({ isActive: true }).sort({ basePrice: 1 }).lean();

  const subscriptionPlans = [];
  const creditPlans = [];

  for (const plan of plans) {
    if (plan.type === PLAN_TYPES.SUBSCRIPTION) {
      subscriptionPlans.push(plan);
    } else if (plan.type === PLAN_TYPES.CREDIT) {
      creditPlans.push(plan);
    }
  }

  return new ApiResponse(200, true, "Plans retrieved successfully", {
    subscriptionPlans,
    creditPlans,
  }).send(res);
});

export const createPricingPlan = asyncHandler(async (req, res) => {
  const {
    name,
    type,
    basePrice,
    discountPrice,
    discountPercent,
    isActive = true,
    credit,
    planDuration,
  } = req.body;

  if (!name || !type || basePrice === undefined) {
    throw new ApiError(400, "Name, type, and basePrice are required");
  }

  if (type === PLAN_TYPES.CREDIT && !credit) {
    throw new ApiError(400, "Credit is required for 'credit' plan type");
  }

  if (!planDuration) {
    throw new ApiError(400, "Plan duration is required");
  }

  let finalDiscountPrice = discountPrice !== undefined ? Number(discountPrice) : Number(basePrice);
  if (finalDiscountPrice > Number(basePrice)) {
    throw new ApiError(400, "Discount price cannot exceed base price");
  }

  const finalDiscountPercent =
    discountPercent !== undefined
      ? Number(discountPercent)
      : Math.round(((Number(basePrice) - finalDiscountPrice) / Number(basePrice)) * 100);

  const pricingPlan = await AppPricing.create({
    name: name.trim(),
    type,
    basePrice: Number(basePrice),
    discountPrice: finalDiscountPrice,
    discountPercent: finalDiscountPercent,
    isActive: Boolean(isActive),
    credit: type === PLAN_TYPES.CREDIT ? Number(credit) : undefined,
    planDuration: Number(planDuration),
  });

  return new ApiResponse(201, true, "Pricing plan created successfully", pricingPlan).send(res);
});

export const getAllPricingPlans = asyncHandler(async (req, res) => {
  const {
    isActive,
    type,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }
  if (type) {
    filter.type = type;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [plans, total] = await Promise.all([
    AppPricing.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AppPricing.countDocuments(filter),
  ]);

  return new ApiResponse(200, true, "Pricing plans retrieved", {
    plans,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  }).send(res);
});

export const getPricingPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid plan ID");
  }

  const plan = await AppPricing.findById(id);
  if (!plan) {
    throw new ApiError(404, "Pricing plan not found");
  }

  return new ApiResponse(200, true, "Pricing plan fetched", plan).send(res);
});

export const updatePricingPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid plan ID");
  }

  const plan = await AppPricing.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!plan) {
    throw new ApiError(404, "Pricing plan not found");
  }

  return new ApiResponse(200, true, "Pricing plan updated", plan).send(res);
});

export const deletePricingPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid plan ID");
  }

  const plan = await AppPricing.findByIdAndDelete(id);
  if (!plan) {
    throw new ApiError(404, "Pricing plan not found");
  }

  return new ApiResponse(200, true, "Pricing plan deleted successfully").send(res);
});
