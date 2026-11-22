import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { v4 as uuidv4 } from "uuid";

import config from "./config/index.js";
import ApiError from "./utils/api.error.js";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./utils/auth.utils.js";
import globalErrorHandler from "./middlewares/handleGlobal.error.js";
import { initializePassport } from "./config/passport.js";

// Routes import
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import appRoutes from "./routes/app.routes.js";
import pricingRoutes from "./routes/appPricing.routes.js";
import promoCodeRoutes from "./routes/promoCode.routes.js";
import aiApiKeyRoutes from "./routes/aiApiKey.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import schedulerRoutes from "./routes/scheduler.routes.js";
import referralRoutes from "./routes/refer.route.js";
import backupRoutes from "./routes/backup.routes.js";

const app = express();

// Trust proxy for reverse proxies (Nginx / Vercel / Cloudflare)
app.set("trust proxy", 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // allow inline OAuth script redirects
    crossOriginEmbedderPolicy: false,
  })
);

// Response compression
app.use(compression());

// Request Correlation ID Middleware
app.use((req, res, next) => {
  const correlationId = req.headers["x-request-id"] || uuidv4();
  req.id = correlationId;
  res.setHeader("X-Request-Id", correlationId);
  next();
});

// HTTP Request Logger
if (config.NODE_ENV !== "test") {
  app.use(
    morgan(
      config.isProduction
        ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms'
        : "dev"
    )
  );
}

const allowedOrigins = [
  config.cors_origin,
  "https://www.genmeta.app",
  "https://genmeta.app",
  ...(config.isProduction
    ? []
    : ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"]),
].filter(Boolean);

// CORS setup
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || !config.isProduction) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed for this origin"));
    },
    credentials: true,
    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "Content-Disposition",
      "x-api-key",
      "x-app-user-key",
      "x-device-id",
      "x-device-fingerprint",
      "x-device-name",
      "x-device-platform",
      "x-device-os",
      "x-device-arch",
      "x-device-cpu",
      "x-app-version",
      "x-request-id",
    ],
    exposedHeaders: ["Content-Disposition", "X-Request-Id"],
  })
);

// Cookie & Body Parsing
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// CSRF Origin verification for cookie-authenticated state-changing requests
app.use((req, res, next) => {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return next();
  }

  // Non-cookie API clients (e.g. Electron desktop app) are immune to cookie CSRF
  if (
    req.headers.authorization ||
    req.headers["x-app-user-key"] ||
    req.headers["x-api-key"]
  ) {
    return next();
  }

  // No auth cookies sent on this request
  if (!req.cookies?.[ACCESS_COOKIE_NAME] && !req.cookies?.[REFRESH_COOKIE_NAME]) {
    return next();
  }

  // Exempt third-party payment callbacks/webhooks
  const reqPath = req.originalUrl || req.url || "";
  if (/^\/api\/v1\/payment\/(webhook|ipn|paystation-callback|success|fail|cancel)/.test(reqPath)) {
    return next();
  }

  let requestOrigin = req.headers.origin;
  if (!requestOrigin && req.headers.referer) {
    try {
      requestOrigin = new URL(req.headers.referer).origin;
    } catch {
      requestOrigin = undefined;
    }
  }

  if (requestOrigin) {
    if (allowedOrigins.includes(requestOrigin)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: "Invalid request origin",
      code: "CSRF_ORIGIN_MISMATCH",
    });
  }

  if (config.isProduction) {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: "Origin header required for authenticated requests",
      code: "CSRF_ORIGIN_MISSING",
    });
  }

  return next();
});

// Initialize Passport for OAuth
initializePassport(app);

// Mount API Endpoints (v1)
app.use("/api/v1/users/dashboard", dashboardRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/app", appRoutes);
app.use("/api/v1/aiApi", aiApiKeyRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/scheduler", schedulerRoutes);
app.use("/api/v1/backup", backupRoutes);
app.use("/api/v1/pricing", pricingRoutes);
app.use("/api/v1/promo-codes", promoCodeRoutes);
app.use("/api/v1/referral", referralRoutes);
app.use("/api/v1/users", userRoutes);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to GenMeta API",
    version: "2.0.0",
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Production-ready health check
app.get("/health", (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    },
  });
});

// 404 route handler
app.use("*", (req) => {
  throw new ApiError(404, `Cannot find ${req.originalUrl} on this server.`);
});

// Centralized error handling middleware
app.use(globalErrorHandler);

export { app };
export default app;
