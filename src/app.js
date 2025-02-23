import cors from "cors";
import express from "express";
import config from "./config/index.js";

import { notFound } from "./middlewares/notFound.js";
import GlobalErrorHandler from "./middlewares/globalErrorHandler.js";

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

app.use("/api/v1/users", userRoutes);

app.use(GlobalErrorHandler);
app.use(notFound);

export { app };
