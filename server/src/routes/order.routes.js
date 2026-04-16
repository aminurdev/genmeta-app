import { Router } from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderById,
  getUserOrders,
  adminCreateOrder,
} from "../controllers/order.controller.js";
import { verifyAdmin, verifyUser } from "../middlewares/auth.middleware.js";

const router = Router();

// User routes (authenticated)
router.post("/create", verifyUser, createOrder);
router.get("/my-orders", verifyUser, getUserOrders);

// Admin routes
router.post("/admin/create", verifyUser, verifyAdmin, adminCreateOrder);
router.get("/", verifyUser, verifyAdmin, getOrders);
router.get("/:orderId", verifyUser, verifyAdmin, getOrderById);
router.patch("/:orderId/status", verifyUser, verifyAdmin, updateOrderStatus);

export default router;
