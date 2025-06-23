import express from "express";

import { getAdminDashboardStats } from "../controllers/admin.controller.js";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/dashboard/stats",
  authenticateAndVerifyAdmin,
  getAdminDashboardStats
);

export default router;
