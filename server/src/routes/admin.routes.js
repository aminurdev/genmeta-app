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
  getPendingWithdrawalNotifications,
  getSuperAdminSystemOverview,
  getAdminList,
  updateUserRole,
  toggleUserStatus,
} from "../controllers/admin.controller.js";
import {
  bulkUpdateAdminProcessErrorStatus,
  getAdminProcessErrors,
  updateAdminProcessErrorStatus,
} from "../controllers/adminError.controller.js";
import {
  authenticateAndVerifyAdmin,
  authenticateAndVerifySuperAdmin,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  bulkUpdateProcessErrorStatusSchema,
  updateProcessErrorStatusSchema,
} from "../validations/index.js";

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
router.get(
  "/paymentHistory/download",
  authenticateAndVerifyAdmin,
  downloadPaymentsHistory
);

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

// Admin notification endpoints
router.get(
  "/notifications/referral-withdrawals",
  authenticateAndVerifyAdmin,
  getPendingWithdrawalNotifications
);

// App processing error logs (Admin & SuperAdmin)
router.get("/errors", authenticateAndVerifyAdmin, getAdminProcessErrors);
router.patch(
  "/errors/bulk-status",
  authenticateAndVerifyAdmin,
  validate(bulkUpdateProcessErrorStatusSchema),
  bulkUpdateAdminProcessErrorStatus
);
router.patch(
  "/errors/:errorLogId/status",
  authenticateAndVerifyAdmin,
  validate(updateProcessErrorStatusSchema),
  updateAdminProcessErrorStatus
);

// SuperAdmin exclusive endpoints
router.get("/super-admin/overview", authenticateAndVerifySuperAdmin, getSuperAdminSystemOverview);
router.get("/super-admin/admins", authenticateAndVerifySuperAdmin, getAdminList);
router.patch("/super-admin/update-role", authenticateAndVerifySuperAdmin, updateUserRole);
router.patch("/super-admin/toggle-status", authenticateAndVerifySuperAdmin, toggleUserStatus);

export default router;
