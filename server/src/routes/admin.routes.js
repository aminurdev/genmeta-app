import express from "express";

import {
  downloadPaymentsHistory,
  getAdminDashboardStats,
  getAllReferrals,
  getAllUsers,
  getPaymentsHistory,
  getReferralByUserId,
  getUserStats,
  updateWithdrawal,
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
router.get("/paymentHistory/download", downloadPaymentsHistory);

router.get("/referral", authenticateAndVerifyAdmin, getAllReferrals);
router.get(
  "/referral/:userId",
  authenticateAndVerifyAdmin,
  getReferralByUserId
);

router.patch(
  "/referral/:userId/withdrawals/:withdrawalId",
  authenticateAndVerifyAdmin,
  updateWithdrawal
);

export default router;
