import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  googleLogin,
  googleLoginCallback,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
  verifyGoogleToken,
  verifyOTP,
} from "../controllers/user.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";
import {
  appUserLogin,
  googleCallback,
  googleLoginAPP,
  verifyGoogle,
} from "../controllers/appUser.controller.js";
import { createRateLimiter } from "../middlewares/rate.limit.middleware.js";
const router = Router();

// Custom rate limiter for registration: max 5 per hour
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: "Too many registration request attempts. Please try again later.",
});

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  message: "Too many login attempts, Please try again later.",
});

const limiter = createRateLimiter({ max: 10, windowMs: 5 * 60 * 1000 });

router.get("/google-login", googleLogin);
router.get("/google/callback", (req, res, next) => {
  const { state, error, error_description } = req.query;

  const { type } = JSON.parse(state);

  // If Google sent an error
  if (error) {
    console.log("Google OAuth Error:", error, error_description);
  }
  if (type && type === "app") {
    googleCallback(req, res, next);
  } else {
    googleLoginCallback(req, res, next);
  }
});

router.post("/verify-google", verifyGoogleToken);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-email", resendVerificationEmail);
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", limiter, resetPassword);
router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/app/login", loginLimiter, appUserLogin);

// Secured routes
router.post("/logout", verifyUser, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.patch("/change-password", verifyUser, changeCurrentPassword);
router.get("/me", verifyUser, getCurrentUser);

router.get("/app/google", googleLoginAPP);
router.post("/app/verify-google", verifyUser, verifyGoogle);

export default router;
