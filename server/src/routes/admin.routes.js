import express from "express";

import {
  getAllUsersWithDetails,
  getUserStatistics,
  getUserDetails,
  getUserImages,
} from "../controllers/admin/user.controller.js";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/users/statistics", authenticateAndVerifyAdmin, getUserStatistics);
router.get("/users/all", authenticateAndVerifyAdmin, getAllUsersWithDetails);
router.get(
  "/users/details/:userId",
  authenticateAndVerifyAdmin,
  getUserDetails
);

router.get("/users/images/:userId", authenticateAndVerifyAdmin, getUserImages);

export default router;
