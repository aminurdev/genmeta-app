import express from "express";
import { verifyUser } from "../middlewares/auth.middleware.js";
import {
  getReferralDetails,
  requestWithdrawal,
} from "../controllers/refer.controller.js";

const router = express.Router();

router.get("/getDetails", verifyUser, getReferralDetails);
router.post("/request-withdraw", verifyUser, requestWithdrawal);

export default router;
