import express from "express";
import { getData } from "../controllers/getData.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Define route to get pricing models, last 3 image data by userId, and pricing data ascending by tokens except title="free"
router.get("/data", verifyToken, getData);

export default router;
