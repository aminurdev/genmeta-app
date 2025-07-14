import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/api.error.js";
import { PromoCode } from "../models/promocode.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

const createPromoCode = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountPercent,
    isActive,
    appliesTo,
    usageLimit,
    validFrom,
    validUntil,
  } = req.body;

  if (!code || !discountPercent || !validFrom || !validUntil) {
    throw new ApiError(400, "All required fields must be provided");
  }

  // Check if code already exists
  const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
  if (existingCode) {
    throw new ApiError(409, "A promo code with this code already exists");
  }

  // Validate dates
  const fromDate = new Date(validFrom);
  const untilDate = new Date(validUntil);

  if (isNaN(fromDate.getTime()) || isNaN(untilDate.getTime())) {
    throw new ApiError(400, "Invalid date format provided");
  }

  if (fromDate >= untilDate) {
    throw new ApiError(400, "Valid from date must be before valid until date");
  }

  const promoCode = await PromoCode.create({
    code: code.toUpperCase(),
    description,
    discountPercent,
    isActive: isActive !== undefined ? isActive : true,
    appliesTo: appliesTo || "both",
    usageLimit,
    validFrom: fromDate,
    validUntil: untilDate,
  });

  return new ApiResponse(201, true, "Promo code created successfully", {
    promoCode,
  }).send(res);
});

const getAllPromoCodes = asyncHandler(async (req, res) => {
  const { active, appliesTo } = req.query;

  const filter = {};

  if (active !== undefined) {
    filter.isActive = active === "true";
  }

  if (appliesTo) {
    if (["subscription", "credit", "both"].includes(appliesTo)) {
      filter.appliesTo = appliesTo;
    } else {
      throw new ApiError(400, "Invalid appliesTo parameter");
    }
  }

  const promoCodes = await PromoCode.find(filter).sort({ validUntil: 1 });

  return new ApiResponse(200, true, "Promo codes fetched successfully", {
    promoCodes,
  }).send(res);
});

const getPromoCodeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid promo code ID format");
  }

  const promoCode = await PromoCode.findById(id);

  if (!promoCode) {
    throw new ApiError(404, "Promo code not found");
  }

  return new ApiResponse(200, true, "Promo code fetched successfully", {
    promoCode,
  }).send(res);
});

const getPromoCodeByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

  if (!promoCode) {
    throw new ApiError(404, "Promo code not found");
  }

  return new ApiResponse(200, true, "Promo code fetched successfully", {
    promoCode,
  }).send(res);
});

const updatePromoCode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    code,
    description,
    discountPercent,
    isActive,
    appliesTo,
    usageLimit,
    validFrom,
    validUntil,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid promo code ID format");
  }

  if (code) {
    const existingCode = await PromoCode.findOne({
      code: code.toUpperCase(),
      _id: { $ne: id },
    });

    if (existingCode) {
      throw new ApiError(409, "A promo code with this code already exists");
    }
  }

  // Validate dates if provided
  let fromDate, untilDate;

  if (validFrom) {
    fromDate = new Date(validFrom);
    if (isNaN(fromDate.getTime())) {
      throw new ApiError(400, "Invalid validFrom date format");
    }
  }

  if (validUntil) {
    untilDate = new Date(validUntil);
    if (isNaN(untilDate.getTime())) {
      throw new ApiError(400, "Invalid validUntil date format");
    }
  }

  // If both dates are provided, validate them together
  if (validFrom && validUntil) {
    if (fromDate >= untilDate) {
      throw new ApiError(
        400,
        "Valid from date must be before valid until date"
      );
    }
  }

  const promoCode = await PromoCode.findByIdAndUpdate(
    id,
    {
      $set: {
        ...(code && { code: code.toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(discountPercent !== undefined && { discountPercent }),
        ...(isActive !== undefined && { isActive }),
        ...(appliesTo && { appliesTo }),
        ...(usageLimit !== undefined && { usageLimit }),
        ...(validFrom && { validFrom: fromDate }),
        ...(validUntil && { validUntil: untilDate }),
      },
    },
    { new: true }
  );

  if (!promoCode) {
    throw new ApiError(404, "Promo code not found");
  }

  return new ApiResponse(200, true, "Promo code updated successfully", {
    promoCode,
  }).send(res);
});

const deletePromoCode = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid promo code ID format");
  }

  const promoCode = await PromoCode.findByIdAndDelete(id);

  if (!promoCode) {
    throw new ApiError(404, "Promo code not found");
  }

  return new ApiResponse(200, true, "Promo code deleted successfully", {}).send(
    res
  );
});

const validatePromoCode = asyncHandler(async (req, res) => {
  const { code } = req.params;

  if (!code) {
    throw new ApiError(400, "Promo code is required");
  }

  const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

  if (!promoCode) {
    throw new ApiError(404, "Invalid promo code");
  }

  // Check if the code is active
  if (!promoCode.isActive) {
    throw new ApiError(400, "This promo code is no longer active");
  }

  // Check if usage limit is reached
  if (
    promoCode.usageLimit !== null &&
    promoCode.usedCount >= promoCode.usageLimit
  ) {
    throw new ApiError(400, "This promo code has reached its usage limit");
  }

  // Check if the code is within valid date range
  const now = new Date();
  if (now < promoCode.validFrom || now > promoCode.validUntil) {
    throw new ApiError(400, "This promo code has expired or is not yet valid");
  }

  // Return the valid promo code with details
  return new ApiResponse(200, true, "Promo code is valid", {
    promoCode: {
      code: promoCode.code,
      discountPercent: promoCode.discountPercent,
      appliesTo: promoCode.appliesTo,
      validUntil: promoCode.validUntil,
    },
  }).send(res);
});

const incrementPromoCodeUsage = asyncHandler(async (req, res) => {
  const { code } = req.params;

  if (!code) {
    throw new ApiError(400, "Promo code is required");
  }

  const promoCode = await PromoCode.findOneAndUpdate(
    { code: code.toUpperCase() },
    { $inc: { usedCount: 1 } },
    { new: true }
  );

  if (!promoCode) {
    throw new ApiError(404, "Promo code not found");
  }

  return new ApiResponse(
    200,
    true,
    "Promo code usage incremented successfully",
    {
      usedCount: promoCode.usedCount,
      usageLimit: promoCode.usageLimit,
    }
  ).send(res);
});

export {
  createPromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  getPromoCodeByCode,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
  incrementPromoCodeUsage,
};
