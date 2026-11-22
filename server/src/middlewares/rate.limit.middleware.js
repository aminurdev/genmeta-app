import rateLimit from "express-rate-limit";

/**
 * Factory function to create custom rate limiters
 * @param {Object} options
 * @param {number} [options.windowMs=900000] - 15 minutes by default
 * @param {number} [options.max=10] - Max requests
 * @param {string} [options.message="Too many requests"] - Response message
 * @param {number} [options.statusCode=429]
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = "Too many requests, please try again later.",
  statusCode = 429,
} = {}) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_, res) => {
      res.status(statusCode).json({
        success: false,
        statusCode,
        message,
      });
    },
  });
};

export const authStrictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

export const otpSendLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: "Too many verification code requests. Please try again later.",
});

export const otpVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many verification attempts. Please try again later.",
});

export const refreshLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many token refresh requests. Please slow down.",
});

export const paymentInitiateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many payment initiation requests. Please wait a few minutes before retrying.",
});

export const paymentCallbackLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many payment callback requests.",
});

export const paymentWebhookLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: "Too many webhook requests.",
});

export const paymentStatusLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many payment status checks. Please slow down.",
});
