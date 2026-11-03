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
import { validate } from "../middlewares/validate.middleware.js";
import {
  registerUserSchema,
  loginUserSchema,
  changePasswordSchema,
  requestPasswordResetSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from "../validations/index.js";

const router = Router();

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many registration attempts. Please try again later.",
});

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many login attempts. Please try again later.",
});

const resetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

router.get("/google-login", googleLogin);
router.get("/google/callback", (req, res, next) => {
  const { state, error, error_description } = req.query;

  let type = null;
  try {
    if (state) {
      type = JSON.parse(state).type;
    }
  } catch {
    type = null;
  }

  if (error) {
    console.log("Google OAuth Error:", error, error_description);
  }

  if (type === "app") {
    googleCallback(req, res, next);
  } else {
    googleLoginCallback(req, res, next);
  }
});

router.post("/verify-google", verifyGoogleToken);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-email", resendVerificationEmail);
router.post("/request-password-reset", validate(requestPasswordResetSchema), requestPasswordReset);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOTP);
router.post("/reset-password", resetLimiter, validate(resetPasswordSchema), resetPassword);
router.post("/register", registerLimiter, validate(registerUserSchema), registerUser);
router.post("/login", loginLimiter, validate(loginUserSchema), loginUser);
router.post("/app/login", loginLimiter, validate(loginUserSchema), appUserLogin);

// Protected routes
router.post("/logout", verifyUser, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.patch("/change-password", verifyUser, validate(changePasswordSchema), changeCurrentPassword);
router.get("/me", verifyUser, getCurrentUser);

// App Google OAuth endpoints
router.get("/app/google", googleLoginAPP);
router.post("/app/verify-google", verifyUser, verifyGoogle);

export default router;
