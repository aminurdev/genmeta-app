import { Order } from "../models/order.model.js";
import { AppPricing } from "../models/appPricing.model.js";
import { PromoCode } from "../models/promocode.model.js";
import { Referral } from "../models/referral.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create Order
export const createOrder = asyncHandler(async (req, res) => {
  const { planId, promoCode, referralCode } = req.body;

  // Validate required fields
  if (!planId) {
    throw new ApiError(400, "Missing required field: planId");
  }

  // Validate plan exists
  const plan = await AppPricing.findById(planId);
  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  if (!plan.isActive) {
    throw new ApiError(400, "This plan is no longer available");
  }

  // Prepare order data
  const orderData = {
    userId: req.user._id,
    planId: plan._id,
    planSnapshot: {
      name: plan.name,
      type: plan.type,
    },
    status: "pending",
  };

  // Handle promo code if provided
  if (promoCode) {
    const promo = await PromoCode.findOne({
      code: promoCode.toUpperCase(),
      isActive: true,
    });

    if (promo) {
      // Validate promo code dates
      const now = new Date();
      if (now >= promo.validFrom && now <= promo.validUntil) {
        orderData.promoCodeId = promo._id;
        orderData.promoCodeUsed = promo.code;
      }
    }
  }

  // Handle referral code if provided
  if (referralCode) {
    const referral = await Referral.findOne({
      referralCode: referralCode.toUpperCase(),
    });

    if (referral) {
      orderData.referralCode = referral.referralCode;
    }
  }

  // Create order
  const order = await Order.create(orderData);

  // Populate references
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

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query = {};

  // Status filter
  if (status && status !== "all") {
    query.status = status;
  }

  // Search filter - search by user name or email
  if (search) {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    const userIds = users.map((user) => user._id);
    query.userId = { $in: userIds };
  }

  // Get total count
  const total = await Order.countDocuments(query);

  // Get orders with pagination
  const orders = await Order.find(query)
    .populate("userId", "name email")
    .populate("planId", "name type credit planDuration")
    .populate("promoCodeId", "code discountPercent")
    .populate("referralCodeId", "referralCode referrer")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Transform data to match frontend expectations
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

  // Validate status
  if (!status || !["completed", "cancelled"].includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Must be 'completed' or 'cancelled'"
    );
  }

  // Find order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Check if order is already completed or cancelled
  if (order.status !== "pending") {
    throw new ApiError(
      400,
      `Cannot update order. Order is already ${order.status}`
    );
  }

  // Update status and notes
  order.status = status;
  if (notes) {
    order.notes = notes;
  }
  await order.save();

  // Populate references
  await order.populate([
    { path: "userId", select: "name email" },
    { path: "planId", select: "name type credit planDuration" },
    { path: "promoCodeId", select: "code discountPercent" },
    { path: "referralCodeId", select: "referralCode referrer" },
  ]);

  // Transform data
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

  // Transform data
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

// Get User's Orders
export const getUserOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
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

  // Transform data
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
