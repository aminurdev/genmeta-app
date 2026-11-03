import express from "express";
import {
  createAppId,
  createAppKey,
  deleteAppId,
  deleteAppKey,
  updateAppId,
  updateAppKey,
  validateAppId,
  validateAppKey,
  getAppIdStats,
  getAppKeyStats,
  updateAppIdStatus,
  updateAppKeyStatus,
  resetDevice,
  getUserDetailsByAppId,
  getUserDetailsByKey,
  addCredits,
  processAppUsage,
  processApiUsage,
} from "../controllers/appId.controller.js";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createAppIdSchema,
  createAppKeySchema,
  updateAppIdSchema,
  updateAppKeySchema,
  addCreditsSchema,
  updateAppIdStatusSchema,
  updateAppKeyStatusSchema,
} from "../validations/index.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                           Modern App ID Endpoints                          */
/* -------------------------------------------------------------------------- */
router.post("/appid/create", authenticateAndVerifyAdmin, validate(createAppIdSchema), createAppId);
router.put("/appid/update", authenticateAndVerifyAdmin, validate(updateAppIdSchema), updateAppId);
router.delete("/appid/delete/:username", authenticateAndVerifyAdmin, deleteAppId);
router.put("/appid/reset-device", authenticateAndVerifyAdmin, resetDevice);
router.put("/appid/update-status", authenticateAndVerifyAdmin, validate(updateAppIdStatusSchema), updateAppIdStatus);
router.put("/appid/add-credits", authenticateAndVerifyAdmin, validate(addCreditsSchema), addCredits);
router.get("/appid/user/details/:appId", authenticateAndVerifyAdmin, getUserDetailsByAppId);

router.post("/appid/validate", validateAppId);
router.get("/appid/stats", getAppIdStats);
router.post("/appid/uses", processAppUsage);
router.post("/appid/usage", processAppUsage);

/* -------------------------------------------------------------------------- */
/*                    Backward-compatible AppKey Endpoints                    */
/* -------------------------------------------------------------------------- */
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
