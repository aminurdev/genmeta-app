import express from "express";
import {
  createAppKey,
  deleteAppKey,
  updateAppKey,
  validateAppKey,
  getAppKeyStats,
  updateAppKeyStatus,
  resetDevice,
  getUserDetailsByKey,
  addCredits,
  processApiUsage,
} from "../controllers/appKey.controller.js";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createAppKeySchema,
  updateAppKeySchema,
  addCreditsSchema,
  updateAppKeyStatusSchema,
} from "../validations/index.js";

const router = express.Router();

router.post("/appkey/create", authenticateAndVerifyAdmin, validate(createAppKeySchema), createAppKey);
router.put("/appkey/update", authenticateAndVerifyAdmin, validate(updateAppKeySchema), updateAppKey);
router.delete("/appkey/delete/:username", authenticateAndVerifyAdmin, deleteAppKey);
router.put("/appkey/reset-device", authenticateAndVerifyAdmin, resetDevice);
router.put("/appkey/update-status", authenticateAndVerifyAdmin, validate(updateAppKeyStatusSchema), updateAppKeyStatus);
router.put("/appkey/add-credits", authenticateAndVerifyAdmin, validate(addCreditsSchema), addCredits);
router.get("/appkey/user/details/:key", authenticateAndVerifyAdmin, getUserDetailsByKey);

router.post("/appkey/validate", validateAppKey);
router.get("/appkey/stats", getAppKeyStats);
router.post("/appkey/uses", processApiUsage);
router.post("/appkey/usage", processApiUsage);

export default router;
