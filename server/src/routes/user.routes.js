import { Router } from "express";
import {
  changeCurrentPassword,
  getActiveSessions,
  getCurrentUser,
  googleLogin,
  googleLoginCallback,
  loginUser,
  logoutAllSessions,
  logoutUser,
  refreshAccessToken,
  registerUser,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  revokeSession,
  verifyEmail,
  verifyGoogleToken,
  verifyOTP,
} from "../controllers/user.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";
import {
  appUserLogin,
  replaceDeviceAndLogin,
  appUserLogout,
  googleCallback,
  googleLoginAPP,
  verifyGoogle,
} from "../controllers/appUser.controller.js";
import {
  authStrictLimiter,
  createRateLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  refreshLimiter,
} from "../middlewares/rate.limit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  registerUserSchema,
  loginUserSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changePasswordSchema,
  requestPasswordResetSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  verifyGoogleCodeSchema,
} from "../validations/index.js";

const router = Router();

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many registration attempts. Please try again later.",
});

const resetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many password reset attempts. Please try again later.",
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

router.post(
  "/verify-google",
  authStrictLimiter,
  validate(verifyGoogleCodeSchema),
  verifyGoogleToken
);

router.post("/verify-email", otpVerifyLimiter, validate(verifyEmailSchema), verifyEmail);
router.get("/verify-email", otpVerifyLimiter, verifyEmail);
router.post(
  "/resend-verification-email",
  otpSendLimiter,
  validate(resendVerificationSchema),
  resendVerificationEmail
);

router.post(
  "/request-password-reset",
  otpSendLimiter,
  validate(requestPasswordResetSchema),
  requestPasswordReset
);
router.post("/verify-otp", otpVerifyLimiter, validate(verifyOtpSchema), verifyOTP);
router.post("/reset-password", resetLimiter, validate(resetPasswordSchema), resetPassword);

router.post("/register", registerLimiter, validate(registerUserSchema), registerUser);
router.post("/login", authStrictLimiter, validate(loginUserSchema), loginUser);

// Session & token endpoints
router.post("/refresh-token", refreshLimiter, refreshAccessToken);
router.post("/logout", logoutUser);
router.post("/logout-all", verifyUser, logoutAllSessions);
router.get("/sessions", verifyUser, getActiveSessions);
router.delete("/sessions/:sessionId", verifyUser, revokeSession);
router.get("/me", verifyUser, getCurrentUser);
router.patch(
  "/change-password",
  verifyUser,
  validate(changePasswordSchema),
  changeCurrentPassword
);
router.post(
  "/change-password",
  verifyUser,
  validate(changePasswordSchema),
  changeCurrentPassword
);

// Desktop Electron App endpoints (kept compatible with ../app)
router.post("/app/login", authStrictLimiter, validate(loginUserSchema), appUserLogin);
router.post("/app/replace-device", authStrictLimiter, replaceDeviceAndLogin);
router.post("/app/logout", appUserLogout);
router.get("/app/google", googleLoginAPP);
router.post("/app/verify-google", verifyUser, verifyGoogle);

export default router;
