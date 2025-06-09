import express from "express";
import {
  createApiKey,
  deleteApiKey,
  getAllApiKeys,
  updateApiKey,
  validateApiKey,
  getApiKeyStats,
  updateApiKeyStatus,
  resetDevice,
  getStatistics,
  getPaymentsHistory,
  getUserDetailsByKey,
  getAdminDashboardStats,
  addCredits,
  processApiUsage,
} from "../controllers/appApiKey.controller.js";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/apikey/get", authenticateAndVerifyAdmin, getAllApiKeys);
router.post("/apikey/create", authenticateAndVerifyAdmin, createApiKey);
router.put("/apikey/update", authenticateAndVerifyAdmin, updateApiKey);
router.delete(
  "/apikey/delete/:username",
  authenticateAndVerifyAdmin,
  deleteApiKey
);
router.put("/apikey/reset-device", authenticateAndVerifyAdmin, resetDevice);
router.put(
  "/apikey/update-status",
  authenticateAndVerifyAdmin,
  updateApiKeyStatus
);
router.put("/apikey/add-credits", authenticateAndVerifyAdmin, addCredits);
router.get("/apikey/statistics", authenticateAndVerifyAdmin, getStatistics);
router.get(
  "/apikey/user/details/:key",
  authenticateAndVerifyAdmin,
  getUserDetailsByKey
);
router.get(
  "/paymentHistory/get",
  authenticateAndVerifyAdmin,
  getPaymentsHistory
);
router.get(
  "/getDashboardStats/get",
  authenticateAndVerifyAdmin,
  getAdminDashboardStats
);

router.post("/apikey/validate", validateApiKey);
router.get("/apikey/stats", getApiKeyStats);
router.post("/apikey/uses", processApiUsage);

export default router;
