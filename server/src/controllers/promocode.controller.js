import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/api.error.js";
import { PromoCode } from "../models/promocode.model.js";
import { PromoCodeRedemption } from "../models/promoCodeRedemption.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { PROMO_APPLIES_TO } from "../constants/index.js";

export const createPromoCode = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountPercent,
    isActive = true,
    appliesTo = PROMO_APPLIES_TO.BOTH,
    usageLimit,
    validFrom,
    validUntil,
  } = req.body;

  if (!code || !discountPercent || !validFrom || !validUntil) {
    throw new ApiError(400, "All required fields (code, discountPercent, validFrom, validUntil) must be provided");
  }

  const normalizedCode = code.toUpperCase().trim();
  const existingCode = await PromoCode.findOne({ code: normalizedCode });
  if (existingCode) {
    throw new ApiError(409, "A promo code with this code already exists");
  }

  const fromDate = new Date(validFrom);
  const untilDate = new Date(validUntil);

  if (isNaN(fromDate.getTime()) || isNaN(untilDate.getTime())) {
    throw new ApiError(400, "Invalid date format provided");
  }

  if (fromDate >= untilDate) {
    throw new ApiError(400, "Valid from date must be before valid until date");
  }

  const promoCode = await PromoCode.create({
    code: normalizedCode,
    description,
    discountPercent,
    isActive: Boolean(isActive),
    appliesTo,
    usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
    validFrom: fromDate,
    validUntil: untilDate,
  });

  return new ApiResponse(201, true, "Promo code created successfully", {
    promoCode,
  }).send(res);
});

export const getAllPromoCodes = asyncHandler(async (req, res) => {
  const { active, appliesTo } = req.query;
  const filter = {};

  if (active !== undefined) {
    filter.isActive = active === "true";
  }

  if (appliesTo) {
    if (Object.values(PROMO_APPLIES_TO).includes(appliesTo)) {
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

export const getPromoCodeById = asyncHandler(async (req, res) => {
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

export const getPromoCodeByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;

  if (!code) {
    throw new ApiError(400, "Promo code is required");
  }

  const promoCode = await PromoCode.findOne({ code: code.toUpperCase().trim() });
  if (!promoCode) {
    throw new ApiError(404, "Promo code not found");
  }

  return new ApiResponse(200, true, "Promo code fetched successfully", {
    promoCode,
  }).send(res);
});

export const updatePromoCode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid promo code ID format");
  }

  if (updates.code) {
    updates.code = updates.code.toUpperCase().trim();
    const existing = await PromoCode.findOne({ code: updates.code, _id: { $ne: id } });
    if (existing) {
      throw new ApiError(409, "A promo code with this code already exists");
    }
  }

  if (updates.validFrom && updates.validUntil) {
    const fromDate = new Date(updates.validFrom);
    const untilDate = new Date(updates.validUntil);
    if (fromDate >= untilDate) {
      throw new ApiError(400, "Valid from date must be before valid until date");
    }
    updates.validFrom = fromDate;
    updates.validUntil = untilDate;
  }

  const promoCode = await PromoCode.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!promoCode) {
    throw new ApiError(404, "Promo code not found");
  }

  return new ApiResponse(200, true, "Promo code updated successfully", {
    promoCode,
  }).send(res);
});

export const deletePromoCode = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid promo code ID format");
  }

  const promoCode = await PromoCode.findByIdAndDelete(id);
  if (!promoCode) {
    throw new ApiError(404, "Promo code not found");
  }

  return new ApiResponse(200, true, "Promo code deleted successfully").send(res);
});

export const validatePromoCode = asyncHandler(async (req, res) => {
  const { code, planType } = req.body;

  if (!code) {
    throw new ApiError(400, "Promo code is required");
  }

  const normalizedCode = code.toUpperCase().trim();
  const promoCode = await PromoCode.findOne({
    code: normalizedCode,
    isActive: true,
  });

  if (!promoCode) {
    throw new ApiError(404, "Invalid or inactive promo code");
  }

  const now = new Date();
  if (now < promoCode.validFrom) {
    throw new ApiError(400, "Promo code is not yet active");
  }

  if (now > promoCode.validUntil) {
    throw new ApiError(400, "Promo code has expired");
  }

  if (planType && promoCode.appliesTo !== PROMO_APPLIES_TO.BOTH && promoCode.appliesTo !== planType) {
    throw new ApiError(400, `This promo code only applies to ${promoCode.appliesTo} plans`);
  }

  if (promoCode.usageLimit !== null && (promoCode.usedCount || []).length >= promoCode.usageLimit) {
    throw new ApiError(400, "Promo code usage limit has been reached");
  }

  return new ApiResponse(200, true, "Promo code is valid", {
    promoCode: {
      _id: promoCode._id,
      code: promoCode.code,
      discountPercent: promoCode.discountPercent,
      appliesTo: promoCode.appliesTo,
      description: promoCode.description,
    },
  }).send(res);
});

export const incrementPromoCodeUsage = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const userId = req.user._id;

  if (!code) {
    throw new ApiError(400, "Promo code is required");
  }

  const normalizedCode = code.toUpperCase().trim();
  const promoCode = await PromoCode.findOne({ code: normalizedCode, isActive: true });
  if (!promoCode) {
    throw new ApiError(404, "Promo code not found or inactive");
  }

  if (promoCode.usedCount && promoCode.usedCount.includes(userId.toString())) {
    throw new ApiError(400, "You have already used this promo code");
  }

  promoCode.usedCount.push(userId.toString());
  await promoCode.save();

  // Log in normalized ledger
  await PromoCodeRedemption.updateOne(
    { promoCodeId: promoCode._id, userId },
    {
      $setOnInsert: {
        promoCodeId: promoCode._id,
        code: promoCode.code,
        userId,
        discountPercent: promoCode.discountPercent,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return new ApiResponse(200, true, "Promo code usage registered successfully", {
    promoCode,
  }).send(res);
});
