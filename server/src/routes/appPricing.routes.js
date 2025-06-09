import express from "express";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";
import {
  createPricingPlan,
  deletePricingPlan,
  getAllPlans,
  getAllPricingPlans,
  getPricingPlanById,
  updatePricingPlan,
} from "../controllers/appPricing.controller.js";

const router = express.Router();

router.get("/plans", getAllPlans);
router.get("/:id", getPricingPlanById);
router.get("/", getAllPricingPlans);

// Protected routes (assuming you want admin-only access for modifications)
router.post("/", authenticateAndVerifyAdmin, createPricingPlan);
router.put("/:id", authenticateAndVerifyAdmin, updatePricingPlan);
router.delete("/:id", authenticateAndVerifyAdmin, deletePricingPlan);

export default router;
