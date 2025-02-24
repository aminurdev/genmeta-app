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
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// Routes import
import userRoutes from "./routes/user.routes.js";
import imagesRoutes from "./routes/images.routes.js";

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/images", imagesRoutes);

// 404 route handler
app.use("*", (req) => {
  throw new ApiError(404, `cant't find ${req.originalUrl} on this server.`);
});

app.use(globalErrorHandler);
export { app };
