import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserToken,
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
import { verifyUser } from "../middlewares/auth.middleware.js";
import {
  appUserLogin,
  googleCallback,
  googleLoginAPP,
  verifyGoogle,
} from "../controllers/appUser.controller.js";

const router = Router();

router.post("/google-login", googleLogin);
router.get("/verify-email", verifyEmail);
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/app/login", appUserLogin);

// Secured routes
router.post("/logout", verifyUser, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.patch("/change-password", verifyUser, changeCurrentPassword);
router.get("/me", verifyUser, getCurrentUser);
router.get("/tokens", verifyUser, getUserToken);

router.get("/app/google", googleLoginAPP);

router.get("/app/google/callback", googleCallback);

router.post("/app/verify-google", verifyUser, verifyGoogle);

export default router;
