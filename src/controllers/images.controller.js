import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import config from "../config/index.js";
import { processImage } from "../services/image/image-processing.service.js";

const s3 = new S3Client({
  endpoint: config.aws.endpoint,
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.credentials.accessKeyId,
    secretAccessKey: config.aws.credentials.secretAccessKey,
  },
  forcePathStyle: true,
});

const bucketName = config.aws.bucketName;
const urlEndpoint = `${config.aws.endpoint}/${bucketName}`;
const requestDir = `public/temp/exiftool`;

const uploadImages = asyncHandler(async (req, res) => {
  const images = req.files.images;
  if (!images) return new ApiError(400, "No images uploaded");

  const { titleLength, descriptionLength, keywordCount, batchId } = req.body;
  const newBatchId = batchId || uuidv4();

  const uploadPromises = images.map(async (image) => {
    const metaResult = await processImage(image, requestDir, {
      titleLength,
      descriptionLength,
      keywordCount,
    });
    const fileContent = fs.readFileSync(metaResult.imagePath);
    const objectKey = `uploads/${req.user._id}/${newBatchId}/${image.filename}`;

    const uploadParams = {
      Bucket: bucketName,
      Key: objectKey,
      Body: fileContent,
      ContentType: image.mimetype,
    };

    try {
      const result = await s3.send(new PutObjectCommand(uploadParams));

      // ✅ Delete the local file after successful upload
      fs.unlinkSync(metaResult.imagePath);

      return {
        filename: image.filename,
        size: image.size,
        url: `${urlEndpoint}/${objectKey}`,
        data: metaResult.metadata,
        result,
      };
    } catch (error) {
      throw new ApiError(
        500,
        `Failed to upload ${image.filename}: ${error.message}`
      );
    }
  });

  const uploadedImages = await Promise.all(uploadPromises);

  return new ApiResponse(
    200,
    true,
    "Images uploaded and local files deleted",
    uploadedImages
  ).send(res);
});

export { uploadImages };
