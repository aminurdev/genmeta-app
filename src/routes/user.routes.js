import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import validateRequest from "../middlewares/validateRequest.middlware.js";
import { registerSchema } from "../schemas/user.schema.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), registerUser);

export default router;
