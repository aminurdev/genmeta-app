import mongoose from "mongoose";
import { AppPricing } from "../models/appPricing.model.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PLAN_TYPES } from "../constants/index.js";

const NO_STORE_CACHE = "no-store, no-cache, must-revalidate, private";
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ALLOWED_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "name",
  "type",
  "basePrice",
  "discountPrice",
  "discountPercent",
  "planDuration",
  "credit",
]);

function computeDiscountPercent(basePrice, discountPrice) {
  const base = Number(basePrice);
  const discount = Number(discountPrice);
  if (!Number.isFinite(base) || base <= 0) return 0;
  const raw = ((base - discount) / base) * 100;
  return Math.min(100, Math.max(0, Math.round(raw * 100) / 100));
}

export const getAllPlans = asyncHandler(async (req, res) => {
  res.set("Cache-Control", NO_STORE_CACHE);
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
  res.set("Cache-Control", NO_STORE_CACHE);
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

  if (type === PLAN_TYPES.CREDIT && (!credit || Number(credit) < 1)) {
    throw new ApiError(400, "Credit must be at least 1 for 'credit' plan type");
  }

  if (!planDuration || Number(planDuration) < 1) {
    throw new ApiError(400, "Plan duration must be at least 1 day");
  }

  const numericBasePrice = Number(basePrice);
  const finalDiscountPrice =
    discountPrice !== undefined ? Number(discountPrice) : numericBasePrice;
  if (finalDiscountPrice > numericBasePrice) {
    throw new ApiError(400, "Discount price cannot exceed base price");
  }

  const finalDiscountPercent =
    discountPercent !== undefined
      ? Math.min(100, Math.max(0, Number(discountPercent)))
      : computeDiscountPercent(numericBasePrice, finalDiscountPrice);

  const pricingPlan = await AppPricing.create({
    name: String(name).trim(),
    type,
    basePrice: numericBasePrice,
    discountPrice: finalDiscountPrice,
    discountPercent: finalDiscountPercent,
    isActive: Boolean(isActive),
    credit: type === PLAN_TYPES.CREDIT ? Number(credit) : undefined,
    planDuration: Number(planDuration),
  });

  return new ApiResponse(201, true, "Pricing plan created successfully", pricingPlan).send(res);
});

export const getAllPricingPlans = asyncHandler(async (req, res) => {
  res.set("Cache-Control", NO_STORE_CACHE);
  const {
    search = "",
    isActive,
    type,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
    refresh,
  } = req.query;

  const now = new Date();
  const isExplicitRefresh = refresh === "true" || refresh === "1";

  const filter = {};
  if (isActive !== undefined && isActive !== "") {
    filter.isActive = isActive === "true";
  }
  if (type && Object.values(PLAN_TYPES).includes(type)) {
    filter.type = type;
  }

  const trimmedSearch = String(search || "").trim();
  if (trimmedSearch) {
    filter.name = { $regex: escapeRegex(trimmedSearch), $options: "i" };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;
  const safeSortBy = ALLOWED_SORT_FIELDS.has(String(sortBy))
    ? String(sortBy)
    : "createdAt";
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [plans, total, summaryAgg] = await Promise.all([
    AppPricing.find(filter)
      .sort({ [safeSortBy]: sortDirection, _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AppPricing.countDocuments(filter),
    AppPricing.aggregate([
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
          activePlans: { $sum: { $cond: ["$isActive", 1, 0] } },
          inactivePlans: { $sum: { $cond: ["$isActive", 0, 1] } },
          subscriptionPlans: {
            $sum: {
              $cond: [{ $eq: ["$type", PLAN_TYPES.SUBSCRIPTION] }, 1, 0],
            },
          },
          activeSubscriptionPlans: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$type", PLAN_TYPES.SUBSCRIPTION] },
                    { $eq: ["$isActive", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          creditPlans: {
            $sum: { $cond: [{ $eq: ["$type", PLAN_TYPES.CREDIT] }, 1, 0] },
          },
          activeCreditPlans: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$type", PLAN_TYPES.CREDIT] },
                    { $eq: ["$isActive", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          discountSum: { $sum: { $ifNull: ["$discountPercent", 0] } },
        },
      },
    ]),
  ]);

  const rawSummary = summaryAgg[0] || {
    totalPlans: 0,
    activePlans: 0,
    inactivePlans: 0,
    subscriptionPlans: 0,
    activeSubscriptionPlans: 0,
    creditPlans: 0,
    activeCreditPlans: 0,
    discountSum: 0,
  };

  const summary = {
    totalPlans: rawSummary.totalPlans,
    activePlans: rawSummary.activePlans,
    inactivePlans: rawSummary.inactivePlans,
    subscriptionPlans: rawSummary.subscriptionPlans,
    activeSubscriptionPlans: rawSummary.activeSubscriptionPlans,
    creditPlans: rawSummary.creditPlans,
    activeCreditPlans: rawSummary.activeCreditPlans,
    avgDiscountPercent:
      rawSummary.totalPlans > 0
        ? Number((rawSummary.discountSum / rawSummary.totalPlans).toFixed(1))
        : 0,
  };

  const totalPages = Math.ceil(total / limitNum);

  return new ApiResponse(200, true, "Pricing plans retrieved", {
    plans,
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

export const getPricingPlanById = asyncHandler(async (req, res) => {
  res.set("Cache-Control", NO_STORE_CACHE);
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid plan ID");
  }

  const plan = await AppPricing.findById(id).lean();
  if (!plan) {
    throw new ApiError(404, "Pricing plan not found");
  }

  return new ApiResponse(200, true, "Pricing plan fetched", plan).send(res);
});

export const updatePricingPlan = asyncHandler(async (req, res) => {
  res.set("Cache-Control", NO_STORE_CACHE);
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid plan ID");
  }

  const plan = await AppPricing.findById(id);
  if (!plan) {
    throw new ApiError(404, "Pricing plan not found");
  }

  const {
    name,
    type,
    basePrice,
    discountPrice,
    discountPercent,
    isActive,
    credit,
    planDuration,
  } = req.body;

  const nextType = type !== undefined ? type : plan.type;
  const nextBasePrice =
    basePrice !== undefined ? Number(basePrice) : plan.basePrice;

  let nextDiscountPrice =
    discountPrice !== undefined
      ? Number(discountPrice)
      : plan.discountPrice ?? nextBasePrice;

  if (discountPrice === undefined && basePrice !== undefined && nextDiscountPrice > nextBasePrice) {
    nextDiscountPrice = nextBasePrice;
  }

  if (nextDiscountPrice > nextBasePrice) {
    throw new ApiError(400, "Discount price cannot exceed base price");
  }

  const priceChanged = basePrice !== undefined || discountPrice !== undefined;
  const nextDiscountPercent =
    discountPercent !== undefined && !priceChanged
      ? Math.min(100, Math.max(0, Number(discountPercent)))
      : computeDiscountPercent(nextBasePrice, nextDiscountPrice);

  const nextCredit =
    nextType === PLAN_TYPES.CREDIT
      ? credit !== undefined && credit !== null
        ? Number(credit)
        : plan.credit
      : undefined;

  if (nextType === PLAN_TYPES.CREDIT && (!nextCredit || nextCredit < 1)) {
    throw new ApiError(400, "Credit must be at least 1 for 'credit' plan type");
  }

  if (name !== undefined) plan.name = String(name).trim();
  plan.type = nextType;
  plan.basePrice = nextBasePrice;
  plan.discountPrice = nextDiscountPrice;
  plan.discountPercent = nextDiscountPercent;
  if (isActive !== undefined) plan.isActive = Boolean(isActive);
  if (planDuration !== undefined) plan.planDuration = Number(planDuration);
  plan.credit = nextCredit;

  await plan.save();

  return new ApiResponse(200, true, "Pricing plan updated", plan).send(res);
});

export const deletePricingPlan = asyncHandler(async (req, res) => {
  res.set("Cache-Control", NO_STORE_CACHE);
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
