import express from "express";
import { verifyUser } from "../middlewares/auth.middleware.js";
import {
  getReferralDetails,
  requestWithdrawal,
} from "../controllers/refer.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { requestWithdrawalSchema } from "../validations/index.js";

const router = express.Router();

router.get("/getDetails", verifyUser, getReferralDetails);
router.post("/request-withdraw", verifyUser, validate(requestWithdrawalSchema), requestWithdrawal);

export default router;
