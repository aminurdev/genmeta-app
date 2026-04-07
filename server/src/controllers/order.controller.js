import { Order } from "../models/order.model.js";
import { AppPricing } from "../models/appPricing.model.js";
import { PromoCode } from "../models/promocode.model.js";
import { Referral } from "../models/referral.model.js";
import { User } from "../models/user.model.js";
import { AppKey } from "../models/appKey.model.js";
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
    amount: plan.discountPrice || plan.basePrice,
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

        // Apply discount to order amount
        const discount = (orderData.amount * promo.discountPercent) / 100;
        orderData.amount = orderData.amount - discount;
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

  // Handle plan update and referral rewards if order is completed
  if (status === "completed") {
    // Update user's plan
    const planUpdateSuccess = await updateUserPlan(order.userId, order.planId);

    if (!planUpdateSuccess) {
      console.warn("[WARN]: Plan update failed for order", {
        orderId: order._id.toString(),
        userId: order.userId.toString(),
      });
    }

    // Handle referral rewards
    try {
      const payingUser = await User.findById(order.userId).populate("referred");

      if (payingUser?.referred) {
        const referralDoc = await Referral.findById(payingUser.referred);

        if (referralDoc) {
          // Check if this user has already been rewarded
          const userHistory = referralDoc.earnedHistory.filter(
            (e) => e.user.toString() === payingUser._id.toString()
          );

          if (userHistory.length >= 1) {
            console.log(
              "[INFO]: Referral earnings skipped (already rewarded fully)",
              {
                referrer: referralDoc.referrer.toString(),
                referredUser: payingUser._id.toString(),
              }
            );
          } else {
            // First payment - apply reward
            const rewardAmount = 50;

            if (rewardAmount > 0) {
              referralDoc.availableBalance += rewardAmount;
              referralDoc.earnedHistory.push({
                user: payingUser._id,
                amount: rewardAmount,
                createdAt: new Date(),
              });

              await referralDoc.save();

              console.log("[INFO]: Referral earning added", {
                referrer: referralDoc.referrer.toString(),
                referredUser: payingUser._id.toString(),
                amount: rewardAmount,
              });
            }
          }
        }
      }
    } catch (referralError) {
      console.error("[ERROR]: Failed to update referral earnings", {
        error: referralError.message,
        userId: order.userId,
      });
      // Don't throw error - continue with order completion
    }

    // Update promo code usage count if promo code was used
    if (order.promoCodeId) {
      try {
        await PromoCode.findByIdAndUpdate(order.promoCodeId, {
          $addToSet: { usedCount: order.userId },
        });
      } catch (promoError) {
        console.error("[ERROR]: Failed to update promo code usage", {
          error: promoError.message,
          promoCodeId: order.promoCodeId,
        });
      }
    }
  }

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

// Helper function to update user's plan
const updateUserPlan = async (userId, planId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error("[ERROR]: User not found for plan update", { userId });
      return false;
    }

    const selectedPlan = await AppPricing.findById(planId);
    if (!selectedPlan || !selectedPlan.isActive) {
      console.error("[ERROR]: Selected plan not found or inactive", { planId });
      return false;
    }

    const planType = selectedPlan.type; // subscription or credit
    const now = new Date();
    let expirationDate;

    if (selectedPlan.planDuration) {
      expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + selectedPlan.planDuration);
      expirationDate.setHours(23, 59, 59, 999);
    }

    let appKey = await AppKey.findOne({ userId });

    if (!appKey) {
      // Create new API key if one doesn't exist
      const { generateAppKey } = await import("../controllers/appKey.controller.js");
      const newAppKey = generateAppKey();
      const today = new Date().toISOString().split("T")[0];

      appKey = await AppKey.create({
        userId: user._id,
        username: user.email || user.name,
        key: newAppKey,
        plan: {
          type: planType,
          id: selectedPlan._id.toString(),
        },
        expiresAt: expirationDate,
        credit:
          planType === "credit"
            ? selectedPlan.credit
            : planType === "subscription"
              ? Infinity
              : 5, // Free plan gets 5 credits daily
        isActive: true,
        status: "active",
        lastCreditRefresh: today,
      });

      console.log("[INFO]: New API key created with plan", {
        userId: user._id.toString(),
        email: user.email,
        planType,
        planName: selectedPlan.name,
      });
    } else {
      // Update existing API key
      const previousPlanType = appKey.plan.type; // Track previous plan type

      if (planType === "subscription") {
        // SUBSCRIPTION PLAN LOGIC
        if (previousPlanType === "subscription") {
          // Subscription → Subscription: Extend expiry date
          const isExpired = !appKey.expiresAt || now > appKey.expiresAt;

          if (isExpired) {
            // If expired, set new expiration from now
            appKey.expiresAt = expirationDate;
          } else if (appKey.expiresAt && selectedPlan.planDuration) {
            // If still valid, extend the current expiration date
            const newExpiresAt = new Date(appKey.expiresAt);
            newExpiresAt.setDate(
              newExpiresAt.getDate() + selectedPlan.planDuration
            );
            newExpiresAt.setHours(23, 59, 59, 999);
            appKey.expiresAt = newExpiresAt;
          }
        } else {
          // Free/Credit → Subscription: Start fresh expiry
          appKey.expiresAt = expirationDate;
        }

        appKey.credit = Infinity;
      } else if (planType === "credit") {
        // CREDIT PLAN LOGIC

        if (previousPlanType === "free") {
          // Free → Credit: Replace credits (don't add), set fresh expiry
          appKey.credit = selectedPlan.credit || 0;
          appKey.expiresAt = expirationDate;
        } else if (previousPlanType === "subscription") {
          // Subscription → Credit: Start fresh expiry, replace credits
          appKey.credit = selectedPlan.credit || 0;
          appKey.expiresAt = expirationDate;
        } else if (previousPlanType === "credit") {
          // Credit → Credit: Add credits and extend expiry
          const currentCredit = isFinite(appKey.credit) ? appKey.credit : 0;
          appKey.credit = currentCredit + (selectedPlan.credit || 0);

          // Extend expiration date
          if (expirationDate) {
            const isExpired = !appKey.expiresAt || now > appKey.expiresAt;

            if (isExpired) {
              // If expired, set new expiration from now
              appKey.expiresAt = expirationDate;
            } else if (appKey.expiresAt && selectedPlan.planDuration) {
              // If still valid, extend the current expiration date
              const newExpiresAt = new Date(appKey.expiresAt);
              newExpiresAt.setDate(
                newExpiresAt.getDate() + selectedPlan.planDuration
              );
              newExpiresAt.setHours(23, 59, 59, 999);
              appKey.expiresAt = newExpiresAt;
            }
          }
        }
      }

      // Update plan details
      appKey.plan = {
        type: planType,
        id: selectedPlan._id.toString(),
      };

      // Ensure API key is active
      appKey.isActive = true;
      appKey.status = "active";

      // If previously suspended, clear suspension
      if (appKey.suspendedAt) {
        appKey.suspendedAt = null;
      }

      await appKey.save();

      console.log("[INFO]: Existing API key updated with new plan", {
        userId: user._id.toString(),
        email: user.email,
        planType,
        planName: selectedPlan.name,
        credit: appKey.credit,
        expiresAt: appKey.expiresAt,
      });
    }

    return true;
  } catch (error) {
    console.error("[ERROR]: Plan update failed", {
      userId,
      planId,
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
};
