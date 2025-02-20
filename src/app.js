import cors from "cors";
import express from "express";
import config from "./config/index.js";
import cookieParser from "cookie-parser";

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
app.use(cookieParser());

export { app };
