import { PricingPlan } from "../models/pricing-plan.model.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllPricingPlans = asyncHandler(async (req, res) => {
  const pricingPlans = await PricingPlan.find();

  if (!pricingPlans || pricingPlans.length === 0) {
    throw new ApiError(404, "No pricing plans found");
  }

  return new ApiResponse(200, true, "Success", pricingPlans).send(res);
});

export const createPricingPlan = asyncHandler(async (req, res) => {
  const { title, tokens, price, popular } = req.body;

  if (!title || !tokens || price === undefined) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const newPlan = await PricingPlan.create({
    title,
    tokens,
    price,
    popular: popular || false,
  });

  return new ApiResponse(
    201,
    true,
    "Pricing plan created successfully",
    newPlan
  ).send(res);
});

export const updatePricingPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, tokens, price, popular } = req.body;

  const updatedPlan = await PricingPlan.findByIdAndUpdate(
    id,
    { title, tokens, price, popular },
    { new: true, runValidators: true }
  );

  if (!updatedPlan) {
    throw new ApiError(404, "Pricing plan not found");
  }

  return new ApiResponse(
    200,
    true,
    "Pricing plan updated successfully",
    updatedPlan
  ).send(res);
});

export const deletePricingPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedPlan = await PricingPlan.findByIdAndDelete(id);

  if (!deletedPlan) {
    throw new ApiError(404, "Pricing plan not found");
  }

  return new ApiResponse(200, true, "Pricing plan deleted successfully").send(
    res
  );
});
