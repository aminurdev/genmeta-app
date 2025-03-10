import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  createBkashPayment,
  handleBkashCallback,
} from "../controllers/bkash.controller.js";

const router = express.Router();

router.post("/create-payment", verifyToken, createBkashPayment);

router.get("/bkash-callback", handleBkashCallback);

export default router;
