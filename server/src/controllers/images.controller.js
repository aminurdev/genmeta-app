import fs from "fs";
import mime from "mime";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import config from "../config/index.js";
import { ImagesModel } from "../models/images.model.js";
import { updateImageMetadata } from "../services/metadata/injector.service.js";
import archiver from "archiver";
import mongoose from "mongoose";
import { s3 } from "../services/aws/aws.service.js";

const bucketName = config.aws.bucketName;
const compressBucketName = config.aws.compressBucketName;

const requestDir = `public/temp/exiftool`;

const updateImage = asyncHandler(async (req, res) => {
  const { batchId, imageId, imageName, updateData } = req.body;
  const userId = req.user._id;

  if (!batchId || !imageId || !imageName || !updateData) {
    throw new ApiError(400, "Missing required fields");
  }

  const objectKey = `uploads/${userId}/${batchId}/${imageName}`;
  const localFilePath = `${requestDir}/${imageName}`;

  try {
    // Update metadata in the database regardless of file existence
    const updateQuery = Object.entries(updateData).reduce(
      (acc, [key, value]) => ({ ...acc, [`images.$.metadata.${key}`]: value }),
      {}
    );

    const updatedImage = await ImagesModel.findOneAndUpdate(
      { userId, batchId, "images._id": imageId },
      { $set: updateQuery },
      { new: true }
    );

    if (!updatedImage) {
      throw new ApiError(404, "Image not found in database");
    }

    // Try to update the actual image file if it exists
    try {
      // Determine correct MIME type
      const contentType = mime.getType(imageName) || "application/octet-stream";

      // Fetch Image from S3
      const { Body } = await s3.send(
        new GetObjectCommand({ Bucket: bucketName, Key: objectKey })
      );
      const imageBuffer = await Body.transformToByteArray();

      // Save Image Temporarily
      await fs.promises.writeFile(localFilePath, imageBuffer);

      // Process Image Metadata
      await updateImageMetadata(localFilePath, updateData);

      // Upload updated image back to S3
      const updatedImageBuffer = await fs.promises.readFile(localFilePath);
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
          Body: updatedImageBuffer,
          ContentType: contentType,
        })
      );

      // Cleanup local file
      await fs.promises.unlink(localFilePath);
    } catch (fileError) {
      // If file not found in S3 or other file operation errors, just log it
      console.log(
        `File operation error (continuing anyway): ${fileError.message}`
      );
    }

    // Send success response
    return new ApiResponse(200, true, "Image metadata updated successfully", {
      userId,
      batchId,
      imageId,
      updatedFields: updateData,
      fileUpdated: true,
    }).send(res);
  } catch (error) {
    // Ensure local file cleanup even if an error occurs
    await fs.promises.unlink(localFilePath).catch(() => {});

    throw new ApiError(500, `Error updating image: ${error.message}`);
  }
});

const downloadBatchAsZip = asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  if (!batchId) throw new ApiError(400, "Batch ID is required");

  const batch = await ImagesModel.findOne({ batchId });
  if (!batch || !batch.images || batch.images.length === 0) {
    throw new ApiError(404, "No images found for this batch");
  }

  const zipFilename = `${batch.name}.zip`;

  // ✅ Add headers BEFORE starting ZIP stream
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename=${zipFilename}`);
  res.setHeader("Transfer-Encoding", "chunked"); // Ensures streaming behavior

  // ✅ Stream ZIP immediately
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);

  for (const image of batch.images) {
    const objectKey = `uploads/${batch.userId}/${batchId}/${image.imageName}`;

    try {
      const { Body } = await s3.send(
        new GetObjectCommand({ Bucket: bucketName, Key: objectKey })
      );

      if (Body) {
        archive.append(Body, { name: image.imageName }); // Streams directly
        await new Promise((resolve) => setTimeout(resolve, 100)); // ✅ Artificial delay to ensure progressive download
      }
    } catch (error) {
      console.error(`Error downloading ${image.imageName}: ${error.message}`);
    }
  }

  archive.finalize(); // Finalize ZIP stream once all files are added
});

const getBatchImages = asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  // Check if batchId is provided
  if (!batchId) {
    throw new ApiError(400, "Batch ID is required");
  }

  // Fetch the batch by batchId
  const batch = await ImagesModel.findOne({ batchId });

  // Check if the batch exists
  if (!batch) {
    throw new ApiError(404, "Batch not found");
  }

  // Send the batch data as response
  return new ApiResponse(200, true, "Success", batch).send(res);
});
const getAllBatches = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query; // Default pagination values

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const totalBatches = await ImagesModel.countDocuments({ userId });

  const images = await ImagesModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $sort: { createdAt: -1 } },
    { $skip: (parseInt(page) - 1) * parseInt(limit) },
    { $limit: parseInt(limit) },
    {
      $addFields: {
        imagesCount: { $size: "$images" },
        totalSize: { $sum: "$images.size" },
      },
    },
    {
      $project: {
        images: 0,
      },
    },
  ]);

  if (!images || images.length === 0) {
    throw new ApiError(404, "No images found for this user");
  }

  return new ApiResponse(200, true, "Success", {
    totalBatches,
    totalPages: Math.ceil(totalBatches / parseInt(limit)),
    currentPage: parseInt(page),
    images,
  }).send(res);
});

const getMetadata = asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  if (!batchId) {
    throw new ApiError(400, "Batch ID is required");
  }

  const batch = await ImagesModel.findOne({ batchId });
  if (!batch || !batch.images || batch.images.length === 0) {
    throw new ApiError(404, "No images found for this batch");
  }

  const metadata = batch.images.map(({ imageName, metadata }) => ({
    imageName,
    metadata,
  }));
  return new ApiResponse(200, true, "Success", { metadata }).send(res);
});

const updateBatchName = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const { name } = req.body;

  if (!batchId || !name) {
    throw new ApiError(400, "Batch ID and name are required");
  }

  const batch = await ImagesModel.findOneAndUpdate(
    { batchId },
    { name },
    { new: true }
  );

  if (!batch) {
    throw new ApiError(404, "Batch not found");
  }
  return new ApiResponse(200, true, "Batch name updated successfully", {
    name: batch.name,
  }).send(res);
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
  const compressedObjectKey = `compressed/${userId}/${batchId}/${deletedImage.imageName}`;

  try {
    await Promise.all([
      s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey })),
      s3.send(
        new DeleteObjectCommand({
          Bucket: compressBucketName,
          Key: compressedObjectKey,
        })
      ),
    ]);

    // If no images left in the batch, delete the entire batch
    if (!updatedBatch.images.length) {
      const deletedBatch = await ImagesModel.deleteOne({
        _id: updatedBatch._id,
      });

      if (deletedBatch.deletedCount === 0) {
        throw new ApiError(404, "Batch not found or already deleted.");
      }
    }

    return new ApiResponse(200, true, "Image deleted successfully").send(res);
  } catch (error) {
    console.error(`Error deleting image: ${objectKey}`, error);
    const errorMessage =
      error.name === "NoSuchKey"
        ? `Image not found in bucket: ${objectKey}`
        : `Failed to delete image: ${error.message}`;

    throw new ApiError(500, errorMessage);
  }
});

export {
  updateImage,
  downloadBatchAsZip,
  getBatchImages,
  getAllBatches,
  getMetadata,
  updateBatchName,
  deleteImage,
};
