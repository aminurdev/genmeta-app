import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import config from "../config/index.js";
import { processImage } from "../services/image/image-processing.service.js";
import { ImagesModel } from "../models/images.model.js";

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

const uploadRealtimeImages = asyncHandler(async (req, res, io) => {
  const images = req.files?.images;
  if (!images || images.length === 0) {
    throw new ApiError(400, "No images uploaded");
  }

  const { titleLength, descriptionLength, keywordCount, batchId } = req.body;
  const newBatchId = batchId || uuidv4();
  const userId = req.user._id;

  io?.emit("processStart", {
    total: images.length,
    message: "Starting image processing",
  });

  const uploadedImages = await Promise.all(
    images.map(async (image, idx) => {
      try {
        // 🖼 Process image metadata
        const metaResult = await processImage(image, requestDir, {
          titleLength,
          descriptionLength,
          keywordCount,
        });

        const objectKey = `uploads/${userId}/${newBatchId}/${image.filename}`;
        const fileContent = fs.readFileSync(metaResult.imagePath);

        // 🛠 Upload image to S3
        await s3.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
            Body: fileContent,
            ContentType: image.mimetype,
          })
        );

        // ✅ Delete the local file after successful upload
        fs.unlinkSync(metaResult.imagePath);

        const imageDetails = {
          imageName: image.filename,
          imageUrl: `${urlEndpoint}/${objectKey}`,
          metadata: metaResult.metadata,
        };

        // 🗄 Store/update details in MongoDB
        let dbResult = await ImagesModel.findOneAndUpdate(
          { userId, batchId: newBatchId },
          {
            $setOnInsert: { userId, batchId: newBatchId },
            $push: { images: imageDetails },
          },
          { upsert: true, new: true }
        );

        const addedImage = dbResult.images.find(
          (img) => img.imageUrl === imageDetails.imageUrl
        );
        const imageId = addedImage ? addedImage._id : null;

        // 🔄 Emit real-time progress update
        io?.emit("processProgress", {
          status: "progress",
          completed: idx + 1,
          total: images.length,
          data: { imageId, ...imageDetails },
        });

        return { imageId, ...imageDetails };
      } catch (error) {
        console.error(`❌ Error processing ${image.filename}:`, error);
        io?.emit("processError", {
          status: "error",
          file: image.filename,
          error: error.message,
        });

        throw new ApiError(
          500,
          `Failed to upload ${image.filename}: ${error.message}`
        );
      }
    })
  );

  // ✅ Emit completion event
  io?.emit("processComplete", {
    status: "completed",
    results: { userId, batchId: newBatchId, images: uploadedImages },
  });

  return new ApiResponse(200, true, "Images uploaded and stored successfully", {
    userId,
    batchId: newBatchId,
    images: uploadedImages,
  }).send(res);
});

export { uploadRealtimeImages };
