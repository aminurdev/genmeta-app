import express from "express";
import {
  createAppUser,
  deleteAppUser,
  updateAppUser,
  validateAppUser,
  getAppUserStats,
  getAppDevices,
  removeAppDevice,
  updateAppUserStatus,
  resetDevice,
  getUserDetailsByAppUser,
  addCredits,
  processAppUsage,
} from "../controllers/appUser.controller.js";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createAppUserSchema,
  updateAppUserSchema,
  addCreditsSchema,
  updateAppUserStatusSchema,
} from "../validations/index.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                             App User Endpoints                             */
/* -------------------------------------------------------------------------- */
router.post("/appuser/create", authenticateAndVerifyAdmin, validate(createAppUserSchema), createAppUser);
router.put("/appuser/update", authenticateAndVerifyAdmin, validate(updateAppUserSchema), updateAppUser);
router.delete("/appuser/delete/:username", authenticateAndVerifyAdmin, deleteAppUser);
router.put("/appuser/reset-device", authenticateAndVerifyAdmin, resetDevice);
router.put("/appuser/update-status", authenticateAndVerifyAdmin, validate(updateAppUserStatusSchema), updateAppUserStatus);
router.put("/appuser/add-credits", authenticateAndVerifyAdmin, validate(addCreditsSchema), addCredits);
router.get("/appuser/user/details/:key", authenticateAndVerifyAdmin, getUserDetailsByAppUser);

router.post("/appuser/validate", validateAppUser);
router.get("/appuser/stats", getAppUserStats);
router.get("/appuser/devices", getAppDevices);
router.delete("/appuser/devices/:deviceId", removeAppDevice);
router.post("/appuser/uses", processAppUsage);
router.post("/appuser/usage", processAppUsage);

/* -------------------------------------------------------------------------- */
/*                       Direct /api/v1/app/* Endpoints                       */
/* -------------------------------------------------------------------------- */
router.post("/create", authenticateAndVerifyAdmin, validate(createAppUserSchema), createAppUser);
router.put("/update", authenticateAndVerifyAdmin, validate(updateAppUserSchema), updateAppUser);
router.delete("/delete/:username", authenticateAndVerifyAdmin, deleteAppUser);
router.put("/reset-device", authenticateAndVerifyAdmin, resetDevice);
router.put("/update-status", authenticateAndVerifyAdmin, validate(updateAppUserStatusSchema), updateAppUserStatus);
router.put("/add-credits", authenticateAndVerifyAdmin, validate(addCreditsSchema), addCredits);
router.get("/user/details/:key", authenticateAndVerifyAdmin, getUserDetailsByAppUser);

router.post("/validate", validateAppUser);
router.get("/stats", getAppUserStats);
router.get("/devices", getAppDevices);
router.delete("/devices/:deviceId", removeAppDevice);
router.post("/uses", processAppUsage);
router.post("/usage", processAppUsage);

export default router;
