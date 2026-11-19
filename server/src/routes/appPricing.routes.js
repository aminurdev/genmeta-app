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
import { validate } from "../middlewares/validate.middleware.js";
import {
  createPricingPlanSchema,
  updatePricingPlanSchema,
} from "../validations/index.js";

const router = express.Router();

router.get("/plans", getAllPlans);
router.get("/:id", getPricingPlanById);
router.get("/", getAllPricingPlans);

router.post("/", authenticateAndVerifyAdmin, validate(createPricingPlanSchema), createPricingPlan);
router.put("/:id", authenticateAndVerifyAdmin, validate(updatePricingPlanSchema), updatePricingPlan);
router.delete("/:id", authenticateAndVerifyAdmin, deletePricingPlan);

export default router;
