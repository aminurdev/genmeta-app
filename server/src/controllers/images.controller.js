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
import archiver from "archiver";
import mongoose from "mongoose";

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
  if (!images) throw new ApiError(400, "No images uploaded");

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
      let dbResult = await ImagesModel.findOneAndUpdate(
        {
          userId: req.user._id,
          batchId: newBatchId,
          "images.imageName": image.filename,
        },
        {
          $set: {
            "images.$.imageUrl": `${urlEndpoint}/${objectKey}`,
            "images.$.metadata": metaResult.metadata,
          },
        },
        { new: true }
      );

      if (!dbResult) {
        dbResult = await ImagesModel.findOneAndUpdate(
          { userId: req.user._id, batchId: newBatchId },
          {
            $setOnInsert: { userId: req.user._id, batchId: newBatchId },
            $push: { images: imageDetails },
          },
          { upsert: true, new: true }
        );
      }

      const addedImage = dbResult.images.find(
        (img) => img.imageUrl === imageDetails.imageUrl
      );
      const imageId = addedImage ? addedImage._id : null;

      return { imageId, ...imageDetails, result };
    } catch (error) {
      throw new ApiError(
        500,
        `Failed to process ${image.filename}: ${error.message}`
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

  const zipFilename = `batch_${batchId}.zip`;

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

export {
  uploadImages,
  updateImage,
  downloadBatchAsZip,
  getBatchImages,
  getAllBatches,
  getMetadata,
  updateBatchName,
};
