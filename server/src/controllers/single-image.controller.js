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

const uploadSingleImage = asyncHandler(async (req, res) => {
  const image = req.file;
  if (!image) return new ApiError(400, "No image uploaded");

  const { titleLength, descriptionLength, keywordCount, batchId } = req.body;
  const newBatchId = batchId || uuidv4();
  const userId = req.user._id || uuidv4();

  try {
    const metaResult = await processImage(image, requestDir, {
      titleLength,
      descriptionLength,
      keywordCount,
    });
    const fileContent = fs.readFileSync(metaResult.imagePath);
    const objectKey = `uploads/${userId}/${newBatchId}/${image.filename}`;

    const uploadParams = {
      Bucket: bucketName,
      Key: objectKey,
      Body: fileContent,
      ContentType: image.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    // ✅ Delete the local file after successful upload
    fs.unlinkSync(metaResult.imagePath);

    const imageDetails = {
      imageName: image.filename,
      imageUrl: `${urlEndpoint}/${objectKey}`,
      metadata: metaResult.metadata,
    };

    // Store details in MongoDB
    const dbResult = await ImagesModel.findOneAndUpdate(
      { userId: req.user._id, batchId: newBatchId },
      {
        $setOnInsert: { userId: req.user._id, batchId: newBatchId },
        $push: { images: imageDetails },
      },
      { upsert: true, new: true }
    );

    const addedImage = dbResult.images.find(
      (img) => img.imageUrl === imageDetails.imageUrl
    );
    const imageId = addedImage ? addedImage._id : null;

    return new ApiResponse(
      200,
      true,
      "Image uploaded and stored successfully",
      {
        _id: dbResult._id,
        userId,
        batchId: newBatchId,
        image: { imageId, ...imageDetails },
      }
    ).send(res);
  } catch (error) {
    throw new ApiError(500, `Failed to upload image: ${error.message}`);
  }
});

export { uploadSingleImage };
