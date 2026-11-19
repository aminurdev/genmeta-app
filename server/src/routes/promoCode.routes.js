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
import { validate } from "../middlewares/validate.middleware.js";
import {
  createPromoCodeSchema,
  validatePromoCodeSchema,
} from "../validations/index.js";

const router = express.Router();

router
  .route("/")
  .get(authenticateAndVerifyAdmin, getAllPromoCodes)
  .post(authenticateAndVerifyAdmin, validate(createPromoCodeSchema), createPromoCode);

router
  .route("/:id")
  .get(authenticateAndVerifyAdmin, getPromoCodeById)
  .patch(authenticateAndVerifyAdmin, updatePromoCode)
  .delete(authenticateAndVerifyAdmin, deletePromoCode);

router.post("/validate", validate(validatePromoCodeSchema), validatePromoCode);
router.patch("/use/:code", verifyUser, incrementPromoCodeUsage);
router.get("/code/:code", verifyUser, getPromoCodeByCode);

export default router;
