import express from "express";
import {
  createAppKey,
  deleteAppKey,
  getAllAppKeys,
  updateAppKey,
  validateAppKey,
  getAppKeyStats,
  updateAppKeyStatus,
  resetDevice,
  getStatistics,
  getPaymentsHistory,
  getUserDetailsByKey,
  addCredits,
  processApiUsage,
} from "../controllers/appKey.controller.js";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/apikey/get", authenticateAndVerifyAdmin, getAllAppKeys);
router.post("/apikey/create", authenticateAndVerifyAdmin, createAppKey);
router.put("/apikey/update", authenticateAndVerifyAdmin, updateAppKey);
router.delete(
  "/apikey/delete/:username",
  authenticateAndVerifyAdmin,
  deleteAppKey
);
router.put("/apikey/reset-device", authenticateAndVerifyAdmin, resetDevice);
router.put(
  "/apikey/update-status",
  authenticateAndVerifyAdmin,
  updateAppKeyStatus
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

router.post("/apikey/validate", validateAppKey);
router.get("/apikey/stats", getAppKeyStats);
router.post("/apikey/uses", processApiUsage);

export default router;
