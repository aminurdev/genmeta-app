import express from "express";

import {
  getAdminDashboardStats,
  getAllUsers,
  getPaymentsHistory,
  getUserStats,
} from "../controllers/admin.controller.js";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/dashboard/stats",
  authenticateAndVerifyAdmin,
  getAdminDashboardStats
);
router.get("/users/all", authenticateAndVerifyAdmin, getAllUsers);
router.get("/users/statistics", authenticateAndVerifyAdmin, getUserStats);
router.get(
  "/paymentHistory/get",
  authenticateAndVerifyAdmin,
  getPaymentsHistory
);

export default router;
