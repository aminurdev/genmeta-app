import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import config from "../config/index.js";
import { processImage } from "../services/image/image-processing.service.js";
import { ImagesModel } from "../models/images.model.js";
import { UserActivity } from "../models/activity.model.js";

const bucketName = config.aws.bucketName;

const s3 = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.credentials.accessKeyId,
    secretAccessKey: config.aws.credentials.secretAccessKey,
  },
  forcePathStyle: true,
});

const requestDir = `public/temp/exiftool`;

const getPresignedUrl = async (bucketName, objectKey) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  return await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL valid for 1 hour
};

const uploadSingleImage = asyncHandler(async (req, res) => {
  const image = req.file;
  if (!image) throw new ApiError(400, "No image uploaded");

  const { titleLength, descriptionLength, keywordCount, batchId } = req.body;
  const newBatchId = batchId || uuidv4();
  const userId = req.user._id;

  const userActivity = await UserActivity.findOne({ userId });
  if (!userActivity) throw new ApiError(404, "User activity record not found");

  if (userActivity.availableTokens < 1) {
    throw new ApiError(400, "Insufficient tokens to upload an image");
  }

  let metaResult;
  try {
    metaResult = await processImage(image, requestDir, {
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
    const command = new PutObjectCommand(uploadParams);

    await s3.send(command);

    const presignedUrl = await getPresignedUrl(bucketName, objectKey);

    // ✅ Delete the local file after successful upload
    fs.unlinkSync(metaResult.imagePath);

    const imageDetails = {
      imageName: image.filename,
      imageUrl: presignedUrl,
      size: image.size,
      metadata: metaResult.metadata,
    };

    const dbResult = await ImagesModel.findOneAndUpdate(
      { userId, batchId: newBatchId },
      {
        $setOnInsert: {
          userId,
          batchId: newBatchId,
          name: `Batch ${batchId.substring(batchId.length - 8, batchId.length)}`,
        },
        $push: { images: imageDetails },
      },
      { upsert: true, new: true }
    );

    // ✅ Deduct 1 token with batch ID tracking
    userActivity.useTokens(
      1,
      `Processed images in batch: ${newBatchId}`,
      newBatchId
    );
    userActivity.totalImageProcessed += 1;
    await userActivity.save();

    return new ApiResponse(
      200,
      true,
      "Image processed, stored successfully, and token deducted",
      {
        _id: dbResult._id,
        userId,
        batchId: newBatchId,
        image: imageDetails,
        remainingTokens: userActivity.availableTokens,
      }
    ).send(res);
  } catch (error) {
    if (fs.existsSync(metaResult?.imagePath)) {
      fs.unlinkSync(metaResult.imagePath);
    }
    throw new ApiError(500, `Failed to upload image: ${error.message}`);
  }
});

const deleteImage = asyncHandler(async (req, res) => {
  const { imageId, batchId } = req.query;
  if (!imageId || !batchId) {
    throw new ApiError(400, "ImageId and BatchId are required");
  }

  const userId = req.user._id;

  // Find the batch before updating to retrieve the image details
  const batchBeforeUpdate = await ImagesModel.findOne({ userId, batchId });

  if (!batchBeforeUpdate) {
    throw new ApiError(404, "Batch not found");
  }

  // Find the image before deleting it
  const deletedImage = batchBeforeUpdate.images.find(
    (img) => img._id.toString() === imageId
  );

  if (!deletedImage) {
    throw new ApiError(404, "Image not found");
  }

  // Remove the image from the batch
  const updatedBatch = await ImagesModel.findOneAndUpdate(
    { userId, batchId },
    { $pull: { images: { _id: imageId } } },
    { new: true }
  );

  const objectKey = `uploads/${userId}/${batchId}/${deletedImage.imageName}`;

  try {
    // Delete from S3
    await s3.send(
      new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey })
    );

    // If no images left in the batch, delete the entire batch
    if (!updatedBatch.images.length) {
      await ImagesModel.deleteOne({ _id: updatedBatch._id });
    }

    return new ApiResponse(200, true, "Image deleted successfully").send(res);
  } catch (error) {
    throw new ApiError(500, `Failed to delete image: ${error.message}`);
  }
});

export { uploadSingleImage, deleteImage };
