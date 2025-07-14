import express from "express";
import {
  authenticateAndVerifyAdmin,
  verifyUser,
} from "../middlewares/auth.middleware.js";
import {
  getAllPromoCodes,
  createPromoCode,
  deletePromoCode,
  getPromoCodeByCode,
  getPromoCodeById,
  incrementPromoCodeUsage,
  updatePromoCode,
  validatePromoCode,
} from "../controllers/promocode.controller.js";

const router = express.Router();

// route = /api/v1/promo-codes

// Admin only routes (protected)
router
  .route("/")
  .get(authenticateAndVerifyAdmin, getAllPromoCodes)
  .post(authenticateAndVerifyAdmin, createPromoCode);

router
  .route("/:id")
  .get(authenticateAndVerifyAdmin, getPromoCodeById)
  .patch(authenticateAndVerifyAdmin, updatePromoCode)
  .delete(authenticateAndVerifyAdmin, deletePromoCode);

// Public routes for validation/usage
router.get("/validate/:code", validatePromoCode);

// Auth required but not admin
router.patch("/use/:code", verifyUser, incrementPromoCodeUsage);
router.get("/code/:code", verifyUser, getPromoCodeByCode);

export default router;
