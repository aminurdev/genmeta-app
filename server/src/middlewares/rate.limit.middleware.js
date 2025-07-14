import rateLimit from "express-rate-limit";

// Factory function to create custom limiters
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 10,
  message = "Too many requests, please try again later.",
  statusCode = 429,
} = {}) => {
  return rateLimit({
    windowMs,
    max,
    handler: (_, res) => {
      res.status(statusCode).json({
        success: false,
        message,
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
