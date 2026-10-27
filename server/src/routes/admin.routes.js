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
  getSuperAdminSystemOverview,
  getAdminList,
  updateUserRole,
  toggleUserStatus,
} from "../controllers/admin.controller.js";
import {
  authenticateAndVerifyAdmin,
  authenticateAndVerifySuperAdmin,
} from "../middlewares/auth.middleware.js";

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


// SuperAdmin exclusive endpoints
router.get("/super-admin/overview", authenticateAndVerifySuperAdmin, getSuperAdminSystemOverview);
router.get("/super-admin/admins", authenticateAndVerifySuperAdmin, getAdminList);
router.patch("/super-admin/update-role", authenticateAndVerifySuperAdmin, updateUserRole);
router.patch("/super-admin/toggle-status", authenticateAndVerifySuperAdmin, toggleUserStatus);

export default router;
