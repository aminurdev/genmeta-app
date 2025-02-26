import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const config = {
  port: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  mongodb_uri: process.env.MONGODB_URI + "/" + process.env.DB_NAME,
  geminiApiKey: process.env.GEMINI_API_KEY,
  cors_origin: process.env.CORS_ORIGIN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  access_token_expiry: process.env.ACCESS_TOKEN_EXPIRY,
  refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
  refresh_token_expiry: process.env.REFRESH_TOKEN_EXPIRY,

  aws: {
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    endpoint: process.env.AWS_S3_ENDPOINT,
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    },
  },
};
export default config;
