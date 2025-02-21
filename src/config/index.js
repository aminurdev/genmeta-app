import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const DB_NAME = "gen-meta-ai";

const config = {
  port: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV,
  mongodb_uri: process.env.MONGODB_URI + "/" + DB_NAME,
  cors_origin: process.env.CORS_ORIGIN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  access_token_expiry: process.env.ACCESS_TOKEN_EXPIRY,
  refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
  refresh_token_expiry: process.env.REFRESH_TOKEN_EXPIRY,
};
export default config;
