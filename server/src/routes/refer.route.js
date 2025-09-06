import express from "express";
import { verifyUser } from "../middlewares/auth.middleware.js";
import { getReferralDetails } from "../controllers/refer.controller.js";

const router = express.Router();

router.get("/getDetails", verifyUser, getReferralDetails);

export default router;
