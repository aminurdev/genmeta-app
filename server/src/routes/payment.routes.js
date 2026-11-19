import express from "express";
import { verifyUser } from "../middlewares/auth.middleware.js";
import {
  createPaystationPayment,
  handlePaystationCallback,
} from "../controllers/appPaymentPaystation.controller.js";

const router = express.Router();

// PayStation Payment Routes
router.get("/paystation-callback", handlePaystationCallback);
router.post("/create-paystation-payment", verifyUser, createPaystationPayment);

export default router;
