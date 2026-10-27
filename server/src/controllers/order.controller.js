import { Order } from "../models/order.model.js";
import { AppPricing } from "../models/appPricing.model.js";
import { PromoCode } from "../models/promocode.model.js";
import { Referral } from "../models/referral.model.js";
import { User } from "../models/user.model.js";
import planService from "../services/plan.service.js";
import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ORDER_STATUS } from "../constants/index.js";

// Create Order (User authenticated)
export const createOrder = asyncHandler(async (req, res) => {
  const { planId, promoCode, referralCode } = req.body;

  if (!planId) {
    throw new ApiError(400, "Missing required field: planId");
  }

  const plan = await AppPricing.findById(planId);
  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  if (!plan.isActive) {
    throw new ApiError(400, "This plan is no longer available");
  }

  const orderData = {
    userId: req.user._id,
    planId: plan._id,
    amount: plan.discountPrice || plan.basePrice,
    planSnapshot: {
      name: plan.name,
      type: plan.type,
    },
    status: ORDER_STATUS.PENDING,
  };

  if (promoCode) {
    const promo = await PromoCode.findOne({
      code: promoCode.toUpperCase().trim(),
      isActive: true,
    });

    if (promo) {
      const now = new Date();
      if (now >= promo.validFrom && now <= promo.validUntil) {
        orderData.promoCodeId = promo._id;
        orderData.promoCodeUsed = promo.code;
        const discount = (orderData.amount * promo.discountPercent) / 100;
        orderData.amount = Math.max(0.01, orderData.amount - discount);
      }
    }
  }

  if (referralCode) {
    const referral = await Referral.findOne({
      referralCode: referralCode.toUpperCase().trim(),
    });

    if (referral) {
      orderData.referralCode = referral.referralCode;
      orderData.referralCodeId = referral._id;
    }
  }

  const order = await Order.create(orderData);

  await order.populate([
    { path: "userId", select: "name email" },
    { path: "planId", select: "name type credit planDuration basePrice" },
    { path: "promoCodeId", select: "code discountPercent" },
    { path: "referralCodeId", select: "referralCode referrer" },
  ]);

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: order,
  });
});

// Get Orders (Admin only)
export const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", status } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  if (status && Object.values(ORDER_STATUS).includes(status)) {
    query.status = status;
  }

  if (search) {
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    const userIds = matchingUsers.map((u) => u._id);
    query.$or = [
      { userId: { $in: userIds } },
      { promoCodeUsed: { $regex: search, $options: "i" } },
      { referralCode: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .populate("userId", "name email")
    .populate("planId", "name type credit planDuration basePrice")
    .populate("promoCodeId", "code discountPercent")
    .populate("referralCodeId", "referralCode referrer")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const transformedOrders = orders.map((order) => ({
    _id: order._id,
    user: {
      _id: order.userId?._id,
      name: order.userId?.name || "Unknown",
      email: order.userId?.email || "N/A",
    },
    plan: {
      id: order.planId?._id,
      name: order.planSnapshot?.name || order.planId?.name || "Unknown",
      type: order.planSnapshot?.type || order.planId?.type || "N/A",
      duration: order.planId?.planDuration,
      credit: order.planId?.credit,
    },
    amount: order.amount,
    promoCode: order.promoCodeUsed,
    referralCode: order.referralCode,
    status: order.status,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));

  res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    data: {
      orders: transformedOrders,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// Get Order by ID (Admin only)
export const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId)
    .populate("userId", "name email")
    .populate("planId", "name type credit planDuration basePrice")
    .populate("promoCodeId", "code discountPercent")
    .populate("referralCodeId", "referralCode referrer");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const transformedOrder = {
    _id: order._id,
    user: {
      _id: order.userId?._id,
      name: order.userId?.name || "Unknown",
      email: order.userId?.email || "N/A",
    },
    plan: {
      id: order.planId?._id,
      name: order.planSnapshot?.name || order.planId?.name || "Unknown",
      type: order.planSnapshot?.type || order.planId?.type || "N/A",
      duration: order.planId?.planDuration,
      credit: order.planId?.credit,
    },
    amount: order.amount,
    promoCode: order.promoCodeUsed,
    referralCode: order.referralCode,
    status: order.status,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };

  res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    data: transformedOrder,
  });
});

// Get Current User's Orders
export const getUserOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const query = { userId: req.user._id };
  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .populate("planId", "name type credit planDuration")
    .populate("promoCodeId", "code discountPercent")
    .populate("referralCodeId", "referralCode referrer")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const transformedOrders = orders.map((order) => ({
    _id: order._id,
    plan: {
      id: order.planId?._id,
      name: order.planSnapshot?.name || order.planId?.name || "Unknown",
      type: order.planSnapshot?.type || order.planId?.type || "N/A",
      duration: order.planId?.planDuration,
      credit: order.planId?.credit,
    },
    amount: order.amount,
    promoCode: order.promoCodeUsed,
    referralCode: order.referralCode,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));

  res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    data: {
      orders: transformedOrders,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// Update Order Status (Admin only)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, notes } = req.body;

  if (!status || ![ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(status)) {
    throw new ApiError(400, "Invalid status. Must be 'completed' or 'cancelled'");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throw new ApiError(400, `Cannot update order. Order is already ${order.status}`);
  }

  order.status = status;
  if (notes) order.notes = notes;
  await order.save();

  if (status === ORDER_STATUS.COMPLETED) {
    // 1. Unified Plan update
    await planService.updateUserPlan(order.userId, order.planId);

    // 2. Unified Referral reward
    await planService.processReferralReward(order.userId, { orderId: order._id });

    // 3. Unified Promo code usage
    if (order.promoCodeId) {
      await planService.recordPromoCodeUsage(order.userId, order.promoCodeId, { orderId: order._id });
    }
  }

  await order.populate([
    { path: "userId", select: "name email" },
    { path: "planId", select: "name type credit planDuration" },
    { path: "promoCodeId", select: "code discountPercent" },
    { path: "referralCodeId", select: "referralCode referrer" },
  ]);

  const transformedOrder = {
    _id: order._id,
    user: {
      _id: order.userId?._id,
      name: order.userId?.name || "Unknown",
      email: order.userId?.email || "N/A",
    },
    plan: {
      id: order.planId?._id,
      name: order.planSnapshot?.name || order.planId?.name || "Unknown",
      type: order.planSnapshot?.type || order.planId?.type || "N/A",
      duration: order.planId?.planDuration,
      credit: order.planId?.credit,
    },
    amount: order.amount,
    promoCode: order.promoCodeUsed,
    referralCode: order.referralCode,
    status: order.status,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };

  res.status(200).json({
    success: true,
    message: `Order ${status} successfully`,
    data: transformedOrder,
  });
});

// Admin Create Order (immediately completed)
export const adminCreateOrder = asyncHandler(async (req, res) => {
  const { userId, planId, amount, notes } = req.body;

  if (!userId || !planId) {
    throw new ApiError(400, "Missing required fields: userId, planId");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const plan = await AppPricing.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");
  if (!plan.isActive) throw new ApiError(400, "This plan is no longer available");

  const orderAmount =
    amount !== undefined ? Number(amount) : plan.discountPrice || plan.basePrice;

  const order = await Order.create({
    userId: user._id,
    planId: plan._id,
    amount: orderAmount,
    planSnapshot: { name: plan.name, type: plan.type },
    status: ORDER_STATUS.COMPLETED,
    notes: notes || "Manually created by admin",
  });

  await planService.updateUserPlan(user._id, plan._id);

  await order.populate([
    { path: "userId", select: "name email" },
    { path: "planId", select: "name type credit planDuration" },
  ]);

  res.status(201).json({
    success: true,
    message: "Order created and activated successfully",
    data: {
      _id: order._id,
      user: { _id: user._id, name: user.name, email: user.email },
      plan: {
        id: plan._id,
        name: plan.name,
        type: plan.type,
        duration: plan.planDuration,
        credit: plan.credit,
      },
      amount: order.amount,
      status: order.status,
      notes: order.notes,
      createdAt: order.createdAt,
    },
  });
});
