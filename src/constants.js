import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const DB_NAME = "genmeta-ai";

export default {
  port: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  mongodb_uri: process.env.MONGODB_URI + "/" + DB_NAME,
};
