import express from "express";
import { getOverview } from "../controllers/dashboard.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/overview", verifyUser, getOverview);

export default router;
