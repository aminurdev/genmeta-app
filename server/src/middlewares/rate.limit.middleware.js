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
