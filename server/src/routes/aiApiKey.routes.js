import express from "express";
import {
  createGeminiKey,
  deleteGeminiKey,
  getAllGeminiKeys,
  updateGeminiKey,
} from "../controllers/aiApiKey.controller.js";
import { authenticateAndVerifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateAndVerifyAdmin, getAllGeminiKeys);
router.post("/", authenticateAndVerifyAdmin, createGeminiKey);
router.put("/:id", authenticateAndVerifyAdmin, updateGeminiKey);
router.delete("/:id", authenticateAndVerifyAdmin, deleteGeminiKey);

export default router;
