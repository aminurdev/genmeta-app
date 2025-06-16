import express from "express";
import { verifyUser } from "../middlewares/auth.middleware.js";
import {
  createAppPayment,
  handleAppCallback,
} from "../controllers/appPayment.controller.js";

const router = express.Router();

router.get("/bkash-callback", handleAppCallback);

router.post("/create-app-payment", verifyUser, createAppPayment);

export default router;
