import cors from "cors";
import express from "express";
import config from "./config/index.js";
import ApiError from "./utils/api.error.js";
import globalErrorHandler from "./middlewares/handleGlobal.error.js";

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

// Routes import
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import imagesRoutes from "./routes/images.routes.js";
import appRoutes from "./routes/app.routes.js";
import pricingRoutes from "./routes/appPricing.routes.js";
import promoCodeRoutes from "./routes/promoCode.routes.js";
import aiApiKeyRoutes from "./routes/aiApiKey.routes.js";

app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/app", appRoutes);

app.use("/api/v1/aiApi", aiApiKeyRoutes);

app.use("/api/v1/pricing", pricingRoutes);
app.use("/api/v1/promo-codes", promoCodeRoutes);

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/images", imagesRoutes);

// 404 route handler
app.use("*", (req) => {
  throw new ApiError(404, `cant't find ${req.originalUrl} on this server.`);
});

app.use(globalErrorHandler);
export { app };
