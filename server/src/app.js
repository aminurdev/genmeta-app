import cors from "cors";
import express from "express";
import config from "./config/index.js";
import ApiError from "./utils/api.error.js";
import globalErrorHandler from "./middlewares/handleGlobal.error.js";
import { initializePassport } from "./config/passport.js";

const app = express();

app.use(
  cors({
    origin: config.cors_origin,
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type", "Content-Disposition"],
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// Initialize Passport
initializePassport(app);

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

app.use("/api/v1/users/dashboard", dashboardRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/app", appRoutes);

app.use("/api/v1/aiApi", aiApiKeyRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/scheduler", schedulerRoutes);

app.use("/api/v1/pricing", pricingRoutes);
app.use("/api/v1/promo-codes", promoCodeRoutes);

app.use("/api/v1/users", userRoutes);

// 404 route handler
app.use("*", (req) => {
  throw new ApiError(404, `cant't find ${req.originalUrl} on this server.`);
});

app.use(globalErrorHandler);
export { app };
