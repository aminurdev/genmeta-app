import { AppPricing } from "../models/appPricing.model.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllPlans = asyncHandler(async (req, res) => {
  const plans = await AppPricing.find({ isActive: true }).sort({
    basePrice: 1,
  });

  const subscriptionPlans = [];
  const creditPlans = [];

  for (const plan of plans) {
    if (plan.type === "subscription") {
      subscriptionPlans.push(plan);
    } else if (plan.type === "credit") {
      creditPlans.push(plan);
    }
  }
  return new ApiResponse(200, true, "Plans retrieved successfully", {
    subscriptionPlans,
    creditPlans,
  }).send(res);
});

// Create a new pricing plan
const createPricingPlan = asyncHandler(async (req, res) => {
  const {
    name,
    type,
    basePrice,
    discountPercent,
    isActive,
    credit,
    planDuration,
  } = req.body;

  // Validate required fields
  if (!name || !type || basePrice === undefined) {
    throw new ApiError(400, "Name, type, and basePrice are required");
  }

  // Validate type-specific required fields
  if (type === "credit" && !credit) {
    throw new ApiError(400, "Credit is required for credit type pricing");
  }

  if (type === "subscription" && !planDuration) {
    throw new ApiError(
      400,
      "Plan duration is required for subscription type pricing"
    );
  }

  // Create new pricing plan
  const pricingPlan = await AppPricing.create({
    name,
    type,
    basePrice,
    discountPercent: discountPercent || 0,
    isActive: isActive !== undefined ? isActive : true,
    credit: type === "credit" ? credit : undefined,
    planDuration: type === "subscription" ? planDuration : undefined,
  });

  return new ApiResponse(
    201,
    true,
    "Pricing plan created successfully",
    pricingPlan
  ).send(res);
});

// Get all pricing plans
const getAllPricingPlans = asyncHandler(async (req, res) => {
  const {
    isActive,
    type,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {};

  // Apply filters if provided
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (type) {
    filter.type = type;
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Execute query
  const pricingPlans = await AppPricing.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination info
  const totalCount = await AppPricing.countDocuments(filter);

  const data = {
    plans: pricingPlans,
    pagination: {
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(totalCount / parseInt(limit)),
    },
  };

  return new ApiResponse(
    200,
    true,
    "Pricing plans retrieved successfully",
    data
  ).send(res);
});

// Get pricing plan by ID
const getPricingPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Pricing plan ID is required");
  }

  const pricingPlan = await AppPricing.findById(id);

  if (!pricingPlan) {
    throw new ApiError(404, "Pricing plan not found");
  }

  return new ApiResponse(
    200,
    true,
    "Pricing plan retrieved successfully",
    pricingPlan
  ).send(res);
});

// Update pricing plan
const updatePricingPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    type,
    basePrice,
    discountPercent,
    isActive,
    credit,
    planDuration,
  } = req.body;

  if (!id) {
    throw new ApiError(400, "Pricing plan ID is required");
  }

  // Find existing plan
  const existingPlan = await AppPricing.findById(id);

  if (!existingPlan) {
    throw new ApiError(404, "Pricing plan not found");
  }

  // If type is changing, validate type-specific fields
  const newType = type || existingPlan.type;

  if (
    newType === "credit" &&
    credit === undefined &&
    existingPlan.type !== "credit"
  ) {
    throw new ApiError(
      400,
      "Credit is required when changing to credit type pricing"
    );
  }

  if (
    newType === "subscription" &&
    planDuration === undefined &&
    existingPlan.type !== "subscription"
  ) {
    throw new ApiError(
      400,
      "Plan duration is required when changing to subscription type pricing"
    );
  }

  // Update fields
  const updatedPlan = await AppPricing.findByIdAndUpdate(
    id,
    {
      name: name !== undefined ? name : existingPlan.name,
      type: newType,
      basePrice: basePrice !== undefined ? basePrice : existingPlan.basePrice,
      discountPercent:
        discountPercent !== undefined
          ? discountPercent
          : existingPlan.discountPercent,
      isActive: isActive !== undefined ? isActive : existingPlan.isActive,
      credit:
        newType === "credit"
          ? credit !== undefined
            ? credit
            : existingPlan.credit
          : undefined,
      planDuration:
        newType === "subscription"
          ? planDuration !== undefined
            ? planDuration
            : existingPlan.planDuration
          : undefined,
    },
    { new: true, runValidators: true }
  );

  return new ApiResponse(
    200,
    true,
    "Pricing plan updated successfully",
    updatedPlan
  ).send(res);
});

// Delete pricing plan
const deletePricingPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Pricing plan ID is required");
  }

  const deletedPlan = await AppPricing.findByIdAndDelete(id);

  if (!deletedPlan) {
    throw new ApiError(404, "Pricing plan not found");
  }

  return new ApiResponse(
    200,
    true,
    "Pricing plan deleted successfully",
    null
  ).send(res);
});

export {
  createPricingPlan,
  getAllPricingPlans,
  getPricingPlanById,
  updatePricingPlan,
  deletePricingPlan,
  getAllPlans,
};
