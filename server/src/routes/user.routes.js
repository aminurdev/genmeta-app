import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  googleLogin,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/google-login", googleLogin);
router.post("/register", registerUser);
router.post("/login", loginUser);

// Secured routes
router.post("/logout", verifyToken, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.patch("/change-password", verifyToken, changeCurrentPassword);
router.get("/me", verifyToken, getCurrentUser);

export default router;
