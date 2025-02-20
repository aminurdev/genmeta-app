import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const DB_NAME = "gen-meta-ai";

const config = {
  port: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV,
  mongodb_uri: process.env.MONGODB_URI + "/" + DB_NAME,
  cors_origin: process.env.CORS_ORIGIN,
};
export default config;
