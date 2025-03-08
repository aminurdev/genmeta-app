import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  googleLogin,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  verifyOTP,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/google-login", googleLogin);
router.get("/verify-email", verifyEmail);
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/register", registerUser);
router.post("/login", loginUser);

// Secured routes
router.post("/logout", verifyToken, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.patch("/change-password", verifyToken, changeCurrentPassword);
router.get("/me", verifyToken, getCurrentUser);

export default router;
