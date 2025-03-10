import express from "express";
import {
  createPricingPlan,
  deletePricingPlan,
  getAllPricingPlans,
  updatePricingPlan,
} from "../controllers/pricing-plan.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/get", verifyToken, getAllPricingPlans);
router.post("/create", verifyToken, createPricingPlan);

router.put("/update/:id", verifyToken, updatePricingPlan);

router.delete("/delete/:id", verifyToken, deletePricingPlan);

export default router;
