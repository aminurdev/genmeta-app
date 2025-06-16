import express from "express";
import {
  getOverview,
  getProfile,
} from "../controllers/dashboard.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/overview", verifyUser, getOverview);
router.get("/profile", verifyUser, getProfile);

export default router;
