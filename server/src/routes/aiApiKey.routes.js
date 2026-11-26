import express from "express";
import {
  createGeminiKey,
  deleteGeminiKey,
  getAllGeminiKeys,
  updateGeminiKey,
} from "../controllers/aiApiKey.controller.js";
import { authenticateAndVerifySuperAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateAndVerifySuperAdmin, getAllGeminiKeys);
router.post("/", authenticateAndVerifySuperAdmin, createGeminiKey);
router.put("/:id", authenticateAndVerifySuperAdmin, updateGeminiKey);
router.patch("/:id", authenticateAndVerifySuperAdmin, updateGeminiKey);
router.delete("/:id", authenticateAndVerifySuperAdmin, deleteGeminiKey);

export default router;
