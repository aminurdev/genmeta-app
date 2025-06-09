import { S3Client } from "@aws-sdk/client-s3";
import config from "../../config/index.js";

const s3Config = {
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.credentials.accessKeyId,
    secretAccessKey: config.aws.credentials.secretAccessKey,
  },
  forcePathStyle: true,
};

if (config.NODE_ENV !== "production") {
  s3Config.endpoint = "http://localhost:4566"; // Example endpoint for local development
}

export const s3 = new S3Client(s3Config);

// Get direct S3 URL
export const getDirectS3Url = (objectKey) => {
  const endpoint =
    config.NODE_ENV !== "production"
      ? `http://localhost:4566/${config.aws.compressBucketName}`
      : config.aws.endpoint;
  return `${endpoint}/${objectKey}`;
};
