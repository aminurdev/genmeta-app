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
import { validate } from "../middlewares/validate.middleware.js";
import {
  createOrderSchema,
  adminCreateOrderSchema,
  updateOrderStatusSchema,
} from "../validations/index.js";

const router = Router();

// User routes (authenticated)
router.post("/create", verifyUser, validate(createOrderSchema), createOrder);
router.get("/my-orders", verifyUser, getUserOrders);

// Admin routes
router.post(
  "/admin/create",
  verifyUser,
  verifyAdmin,
  validate(adminCreateOrderSchema),
  adminCreateOrder
);
router.get("/", verifyUser, verifyAdmin, getOrders);
router.get("/:orderId", verifyUser, verifyAdmin, getOrderById);
router.patch(
  "/:orderId/status",
  verifyUser,
  verifyAdmin,
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;
