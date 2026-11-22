import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/api.error.js";
import { PromoCode } from "../models/promocode.model.js";
import { PromoCodeRedemption } from "../models/promoCodeRedemption.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { PROMO_APPLIES_TO } from "../constants/index.js";

const NO_STORE_CACHE = "no-store, no-cache, must-revalidate, private";
const ALLOWED_LIFECYCLE_STATUSES = new Set([
  "live",
  "scheduled",
  "expired",
  "exhausted",
  "inactive",
]);

function normalizeUsageLimit(rawValue) {
  if (rawValue === null || rawValue === "" || rawValue === undefined) {
    return null;
  }
  const parsed = parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : null;
}

function serializePromoCode(doc, now = new Date(), ledgerCount = 0) {
  const usedBy = Array.isArray(doc.usedCount) ? doc.usedCount : [];
  const usedCount = Math.max(usedBy.length, Number(ledgerCount) || 0);
  const validFrom = doc.validFrom ? new Date(doc.validFrom) : null;
  const validUntil = doc.validUntil ? new Date(doc.validUntil) : null;
  const limit =
    doc.usageLimit !== null && doc.usageLimit !== undefined
      ? Number(doc.usageLimit)
      : null;

  let lifecycleStatus = "live";
  if (!doc.isActive) {
    lifecycleStatus = "inactive";
  } else if (validUntil && now > validUntil) {
    lifecycleStatus = "expired";
  } else if (validFrom && now < validFrom) {
    lifecycleStatus = "scheduled";
  } else if (limit !== null && usedCount >= limit) {
    lifecycleStatus = "exhausted";
  }

  const remainingUses = limit !== null ? Math.max(0, limit - usedCount) : null;

  return {
    ...doc,
    usedCount,
    usedBy,
    usageLimit: limit,
    lifecycleStatus,
    remainingUses,
  };
}

export const createPromoCode = asyncHandler(async (req, res) => {
  res.set("Cache-Control", NO_STORE_CACHE);
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
    description: description ? String(description).trim() : "",
    discountPercent: Number(discountPercent),
    isActive: Boolean(isActive),
    appliesTo,
    usageLimit: normalizeUsageLimit(usageLimit),
    validFrom: fromDate,
    validUntil: untilDate,
  });

  return new ApiResponse(201, true, "Promo code created successfully", {
    promoCode: serializePromoCode(promoCode.toObject(), new Date(), 0),
  }).send(res);
});

export const getAllPromoCodes = asyncHandler(async (req, res) => {
  res.set("Cache-Control", NO_STORE_CACHE);
  const {
    search = "",
    status = "all",
    active,
    appliesTo,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
    refresh,
  } = req.query;

  const now = new Date();
  const isExplicitRefresh = refresh === "true" || refresh === "1";

  if (appliesTo && !Object.values(PROMO_APPLIES_TO).includes(appliesTo)) {
    throw new ApiError(400, "Invalid appliesTo parameter");
  }

  const [promoDocs, redemptionCounts] = await Promise.all([
    PromoCode.find({}).lean(),
    PromoCodeRedemption.aggregate([
      { $group: { _id: "$promoCodeId", count: { $sum: 1 } } },
    ]),
  ]);

  const redemptionCountMap = new Map(
    redemptionCounts.map((row) => [String(row._id), row.count || 0])
  );

  const allSerialized = promoDocs.map((doc) =>
    serializePromoCode(doc, now, redemptionCountMap.get(String(doc._id)) || 0)
  );

  const summary = {
    totalPromoCodes: allSerialized.length,
    livePromoCodes: 0,
    scheduledPromoCodes: 0,
    expiredPromoCodes: 0,
    exhaustedPromoCodes: 0,
    inactivePromoCodes: 0,
    totalRedemptions: 0,
  };

  for (const item of allSerialized) {
    summary.totalRedemptions += item.usedCount;
    if (item.lifecycleStatus === "live") summary.livePromoCodes += 1;
    else if (item.lifecycleStatus === "scheduled") summary.scheduledPromoCodes += 1;
    else if (item.lifecycleStatus === "expired") summary.expiredPromoCodes += 1;
    else if (item.lifecycleStatus === "exhausted") summary.exhaustedPromoCodes += 1;
    else if (item.lifecycleStatus === "inactive") summary.inactivePromoCodes += 1;
  }

  const trimmedSearch = String(search || "").trim().toLowerCase();
  const filtered = allSerialized.filter((item) => {
    if (active !== undefined && active !== "") {
      const wantActive = active === "true";
      if (item.isActive !== wantActive) return false;
    }

    if (status && status !== "all" && ALLOWED_LIFECYCLE_STATUSES.has(String(status))) {
      if (item.lifecycleStatus !== status) return false;
    }

    if (appliesTo && item.appliesTo !== appliesTo) {
      return false;
    }

    if (trimmedSearch) {
      const codeMatch = String(item.code || "").toLowerCase().includes(trimmedSearch);
      const descMatch = String(item.description || "").toLowerCase().includes(trimmedSearch);
      if (!codeMatch && !descMatch) return false;
    }

    return true;
  });

  const sortDir = sortOrder === "asc" ? 1 : -1;
  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "code") {
      cmp = String(a.code || "").localeCompare(String(b.code || ""));
    } else if (sortBy === "discountPercent") {
      cmp = (a.discountPercent || 0) - (b.discountPercent || 0);
    } else if (sortBy === "usedCount") {
      cmp = (a.usedCount || 0) - (b.usedCount || 0);
    } else if (sortBy === "validUntil") {
      cmp = new Date(a.validUntil || 0).getTime() - new Date(b.validUntil || 0).getTime();
    } else {
      cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    return cmp * sortDir;
  });

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const total = filtered.length;
  const totalPages = Math.ceil(total / limitNum);
  const skip = (pageNum - 1) * limitNum;
  const promoCodes = filtered.slice(skip, skip + limitNum);

  return new ApiResponse(200, true, "Promo codes fetched successfully", {
    promoCodes,
    summary,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    meta: {
      generatedAt: now.toISOString(),
      refreshed: isExplicitRefresh,
    },
  }).send(res);
});

export const getPromoCodeById = asyncHandler(async (req, res) => {
  res.set("Cache-Control", NO_STORE_CACHE);
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid promo code ID format");
  }

  const [promoCode, ledgerCount] = await Promise.all([
    PromoCode.findById(id).lean(),
    PromoCodeRedemption.countDocuments({ promoCodeId: id }),
  ]);

  if (!promoCode) {
    throw new ApiError(404, "Promo code not found");
  }

  return new ApiResponse(200, true, "Promo code fetched successfully", {
    promoCode: serializePromoCode(promoCode, new Date(), ledgerCount),
  }).send(res);
});

export const getPromoCodeByCode = asyncHandler(async (req, res) => {
  res.set("Cache-Control", NO_STORE_CACHE);
  const { code } = req.params;

  if (!code) {
    throw new ApiError(400, "Promo code is required");
  }

  const promoCode = await PromoCode.findOne({ code: code.toUpperCase().trim() }).lean();
  if (!promoCode) {
    throw new ApiError(404, "Promo code not found");
  }

  return new ApiResponse(200, true, "Promo code fetched successfully", {
    promoCode,
  }).send(res);
});

export const updatePromoCode = asyncHandler(async (req, res) => {
  res.set("Cache-Control", NO_STORE_CACHE);
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid promo code ID format");
  }

  const existingDoc = await PromoCode.findById(id);
  if (!existingDoc) {
    throw new ApiError(404, "Promo code not found");
  }

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

  if (code !== undefined) {
    const normalizedCode = String(code).toUpperCase().trim();
    const conflict = await PromoCode.findOne({
      code: normalizedCode,
      _id: { $ne: id },
    });
    if (conflict) {
      throw new ApiError(409, "A promo code with this code already exists");
    }
    existingDoc.code = normalizedCode;
  }

  const finalFrom =
    validFrom !== undefined ? new Date(validFrom) : existingDoc.validFrom;
  const finalUntil =
    validUntil !== undefined ? new Date(validUntil) : existingDoc.validUntil;

  if (isNaN(finalFrom.getTime()) || isNaN(finalUntil.getTime())) {
    throw new ApiError(400, "Invalid date format provided");
  }

  if (finalFrom >= finalUntil) {
    throw new ApiError(400, "Valid from date must be before valid until date");
  }

  existingDoc.validFrom = finalFrom;
  existingDoc.validUntil = finalUntil;

  if (description !== undefined) {
    existingDoc.description = String(description).trim();
  }
  if (discountPercent !== undefined) {
    existingDoc.discountPercent = Number(discountPercent);
  }
  if (isActive !== undefined) {
    existingDoc.isActive = Boolean(isActive);
  }
  if (appliesTo !== undefined) {
    existingDoc.appliesTo = appliesTo;
  }
  if (usageLimit !== undefined) {
    existingDoc.usageLimit = normalizeUsageLimit(usageLimit);
  }

  await existingDoc.save();

  const ledgerCount = await PromoCodeRedemption.countDocuments({
    promoCodeId: existingDoc._id,
  });

  return new ApiResponse(200, true, "Promo code updated successfully", {
    promoCode: serializePromoCode(existingDoc.toObject(), new Date(), ledgerCount),
  }).send(res);
});

export const deletePromoCode = asyncHandler(async (req, res) => {
  res.set("Cache-Control", NO_STORE_CACHE);
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
