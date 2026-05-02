import express from "express";
import { verifyUser } from "../middlewares/auth.middleware.js";
import {
  createAppPayment,
  handleAppCallback,
} from "../controllers/appPayment.controller.js";
import {
  createPaystationPayment,
  handlePaystationCallback,
} from "../controllers/appPaymentPaystation.controller.js";

const router = express.Router();

// bKash Payment Routes
router.get("/bkash-callback", handleAppCallback);
router.post("/create-app-payment", verifyUser, createAppPayment);

// PayStation Payment Routes
router.get("/paystation-callback", handlePaystationCallback);
router.post("/create-paystation-payment", verifyUser, createPaystationPayment);

export default router;
