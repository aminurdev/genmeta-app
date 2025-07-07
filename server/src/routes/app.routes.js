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
  getUserDetailsByKey,
  addCredits,
  processApiUsage,
} from "../controllers/appKey.controller.js";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/appkey/get", authenticateAndVerifyAdmin, getAllAppKeys);
router.post("/appkey/create", authenticateAndVerifyAdmin, createAppKey);
router.put("/appkey/update", authenticateAndVerifyAdmin, updateAppKey);
router.delete(
  "/appkey/delete/:username",
  authenticateAndVerifyAdmin,
  deleteAppKey
);
router.put("/appkey/reset-device", authenticateAndVerifyAdmin, resetDevice);
router.put(
  "/appkey/update-status",
  authenticateAndVerifyAdmin,
  updateAppKeyStatus
);
router.put("/appkey/add-credits", authenticateAndVerifyAdmin, addCredits);
router.get("/appkey/statistics", authenticateAndVerifyAdmin, getStatistics);
router.get(
  "/appkey/user/details/:key",
  authenticateAndVerifyAdmin,
  getUserDetailsByKey
);

router.post("/appkey/validate", validateAppKey);
router.get("/appkey/stats", getAppKeyStats);
router.post("/appkey/uses", processApiUsage);

export default router;
