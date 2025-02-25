import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import mime from "mime";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import config from "../config/index.js";
import { processImage } from "../services/image/image-processing.service.js";
import { ImagesModel } from "../models/images.model.js";
import { updateImageMetadata } from "../services/metadata/injector.service.js";

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
  const userId = req.user._id;

  const uploadPromises = images.map(async (image) => {
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

    try {
      const result = await s3.send(new PutObjectCommand(uploadParams));

      // ✅ Delete the local file after successful upload
      fs.unlinkSync(metaResult.imagePath);

      const imageDetails = {
        imageName: image.filename,
        imageUrl: `${urlEndpoint}/${objectKey}`,
        metadata: metaResult.metadata,
      };

      // Store details in MongoDB
      const dbResult = await ImagesModel.findOneAndUpdate(
        { userId: req.user._id, batchId },
        {
          $setOnInsert: { userId: req.user._id, batchId },
          $push: { images: imageDetails },
        },
        { upsert: true, new: true }
      );

      const addedImage = dbResult.images.find(
        (img) => img.imageUrl === imageDetails.imageUrl
      );
      const imageId = addedImage ? addedImage._id : null;

      return { imageId, ...imageDetails, result };
    } catch (error) {
      throw new ApiError(
        500,
        `Failed to upload ${image.filename}: ${error.message}`
      );
    }
  });

  const uploadedImages = await Promise.all(uploadPromises);

  return new ApiResponse(200, true, "Images uploaded and stored successfully", {
    userId,
    batchId: newBatchId,
    images: uploadedImages,
  }).send(res);
});

const updateImage = asyncHandler(async (req, res) => {
  const { batchId, imageId, imageName, updateData } = req.body;

  console.log(req.body);
  const userId = req.user._id;

  if (!batchId || !imageId || !imageName || !updateData) {
    throw new ApiError(400, "Missing required fields");
  }

  const objectKey = `uploads/${userId}/${batchId}/${imageName}`;
  const localFilePath = `${requestDir}/${imageName}`;

  try {
    // Step 1: Determine the correct MIME type dynamically
    const contentType = mime.getType(imageName) || "application/octet-stream";

    // Step 2: Fetch Image from S3
    const { Body } = await s3.send(
      new GetObjectCommand({ Bucket: bucketName, Key: objectKey })
    );

    const imageBuffer = await Body.transformToByteArray();

    // Step 3: Save Image Temporarily
    fs.writeFileSync(localFilePath, imageBuffer);

    // Step 4: Process Image Metadata
    await updateImageMetadata(localFilePath, updateData);

    // Step 5: Upload the modified image back to S3 with dynamic Content-Type
    const updatedImageBuffer = fs.readFileSync(localFilePath);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: updatedImageBuffer,
        ContentType: contentType, // Dynamically determined
      })
    );

    // Step 6: Update Image Metadata in Database
    const updatedImage = await ImagesModel.findOneAndUpdate(
      { userId, batchId, "images._id": imageId },
      Object.keys(updateData).reduce(
        (acc, key) => ({
          ...acc,
          [`images.$.metadata.${key}`]: updateData[key],
        }),
        {}
      ),
      { new: true }
    );

    if (!updatedImage) {
      throw new ApiError(404, "Image not found");
    }

    // Step 7: Clean up local file
    fs.unlinkSync(localFilePath);

    // Step 8: Send Success Response
    return new ApiResponse(200, true, "Image updated successfully", {
      userId,
      batchId,
      imageId,
      updatedFields: updateData,
    }).send(res);
  } catch (error) {
    throw new ApiError(500, `Error updating image: ${error.message}`);
  }
});

export { uploadImages, updateImage };
