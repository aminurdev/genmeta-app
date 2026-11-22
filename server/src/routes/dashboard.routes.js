import express from "express";
import {
  getOverview,
  getProfile,
  removeDesktopDevice,
} from "../controllers/dashboard.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/overview", verifyUser, getOverview);
router.get("/profile", verifyUser, getProfile);
router.delete("/devices/:deviceId", verifyUser, removeDesktopDevice);

export default router;
