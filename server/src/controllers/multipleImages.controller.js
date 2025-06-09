import fs from "fs";
import path from "path";

import { ImagesModel } from "../models/images.model.js";
import {
  processBatchWithConcurrencyLimit,
  processFallbackIndividual,
} from "../services/image/images-process-concurrently.service.js";
import ApiError from "../utils/api.error.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cleanupUploadDir } from "../middlewares/multiple-images-multer.middleware.js";

const MAX_CONCURRENT_GEMINI_REQUESTS = 5;

export const uploadMultipleImages = asyncHandler(async (req, res) => {
  let images = req.files;
  if (!images || images.length === 0) {
    throw new ApiError(400, "No images uploaded");
  }
  const { titleLength, descriptionLength, keywordCount } = req.body;
  const userId = req.user._id;
  const batchId = req.body.batchId || req.batchId;
  const userActivity = req.userActivity;

  try {
    console.log(`Processing batch ${batchId} with ${images.length} images`);

    // Check if this is a retry for failed images
    let existingBatch = null;
    if (batchId) {
      existingBatch = await ImagesModel.findOne({ userId, batchId });
      if (existingBatch) {
        // If this is a retry, remove the failed images that are being retried
        const retryFilenames = images.map((img) => img.originalname);
        existingBatch.failedImages = existingBatch.failedImages.filter(
          (failed) => !retryFilenames.includes(failed.filename)
        );
        await existingBatch.save();
      }
    }

    const missingFiles = images.filter((image) => !fs.existsSync(image.path));
    if (missingFiles.length > 0) {
      const missingFilenames = missingFiles.map((f) => f.originalname);
      console.error(`Missing files detected: ${missingFilenames.join(", ")}`);
      images = images.filter((image) => fs.existsSync(image.path));
      if (images.length === 0) {
        throw new ApiError(
          400,
          `All uploaded files are missing or inaccessible. Please try uploading again.`
        );
      }
    }

    // Create or update batch with Pending status
    if (!existingBatch) {
      existingBatch = await ImagesModel.create({
        userId,
        batchId,
        name: `Batch ${batchId?.substring(Math.max(0, batchId.length - 8))}`,
        status: "Pending",
        tokensUsed: 0,
        processedImages: 0,
        failedImagesCount: 0,
        images: [],
        failedImages: [],
        errorMessage: null,
      });
    }

    // Start background processing
    processBatchInBackground(
      images,
      { titleLength, descriptionLength, keywordCount, userId, batchId },
      existingBatch,
      userActivity
    ).catch((error) => {
      console.error(`Background processing error for batch ${batchId}:`, error);
      ImagesModel.findOneAndUpdate(
        { userId, batchId },
        {
          $set: {
            status: "Failed",
            errorMessage: error.message,
          },
          $push: {
            failedImages: {
              $each: (images || []).map((img) => ({
                filename: img.originalname,
                error: error.message || "Batch processing failed",
                retryCount: 0,
                timestamp: new Date(),
              })),
            },
          },
        }
      ).catch((err) => console.error("Failed to update batch status:", err));
    });

    // Send initial response indicating processing has started
    return new ApiResponse(202, true, "Processing started", {
      batchId,
      status: "Processing",
      totalImages: images.length,
      userId,
      _id: existingBatch._id,
    }).send(res);
  } catch (error) {
    console.error(`Error initiating batch ${batchId}:`, error);
    await cleanupUploadDir(req).catch((cleanupErr) => {
      console.error(`Cleanup error after processing failure:`, cleanupErr);
    });
    throw new ApiError(
      error.statusCode || 500,
      error.message || `Failed to initiate image processing`
    );
  }
});

// Updated function to handle background processing with fallback
async function processBatchInBackground(
  images,
  options,
  existingBatch,
  userActivity
) {
  const { titleLength, descriptionLength, keywordCount, userId, batchId } =
    options;

  try {
    // First try: Process in batch mode
    console.log(
      `Starting batch processing for ${images.length} images in batch ${batchId}`
    );
    const processResults = await processBatchWithConcurrencyLimit(
      images,
      { titleLength, descriptionLength, keywordCount, userId, batchId },
      MAX_CONCURRENT_GEMINI_REQUESTS
    );

    // Identify successful and failed results
    const successfulResults = processResults.filter((result) => !result.error);
    let failedResults = processResults.filter((result) => result.error);

    // If we have failed images, try processing them individually as a fallback
    if (failedResults.length > 0) {
      console.log(
        `${failedResults.length} images failed batch processing. Attempting individual processing...`
      );

      // Filter out the original images that failed
      const failedImageObjects = images.filter((img) =>
        failedResults.some((failure) => failure.filename === img.originalname)
      );

      if (failedImageObjects.length > 0) {
        // Process failed images individually
        const fallbackResults = await processFallbackIndividual(
          failedImageObjects,
          { titleLength, descriptionLength, keywordCount, userId, batchId }
        );

        // Update results with successful individual processing
        const newlySuccessful = fallbackResults.filter(
          (result) => !result.error
        );
        const stillFailed = fallbackResults.filter((result) => result.error);

        // Log individual processing results
        console.log(
          `Individual processing results: ${newlySuccessful.length} successful, ${stillFailed.length} failed`
        );

        // Add newly successful results to the successful array
        successfulResults.push(...newlySuccessful);

        // Update failed results to only include those that still failed
        failedResults = stillFailed;
      }
    }

    // Log final processing stats
    console.log(`Final processing stats for batch ${batchId}:`);
    console.log(`- Total images: ${images.length}`);
    console.log(`- Successfully processed: ${successfulResults.length}`);
    console.log(`- Failed after all retries: ${failedResults.length}`);

    // Detailed logging for any remaining failed images
    if (failedResults.length > 0) {
      console.log(
        `The following images could not be processed after all attempts:`
      );
      failedResults.forEach((failure) => {
        console.log(`- ${failure.filename}: ${failure.error}`);
      });
    }

    // Prepare image details for database update
    const imageDetails = successfulResults.map((result) => ({
      imageName: result.filename,
      imageUrl: result.compressedUrl,
      size: result.size,
      metadata: result.metadata,
    }));

    // Update batch with results
    if (successfulResults.length > 0 || failedResults.length > 0) {
      const updateData = {
        $push: {
          images: { $each: imageDetails },
          failedImages: {
            $each: failedResults.map((failure) => ({
              filename: failure.filename,
              error: failure.error,
              retryCount: 2, // Mark as having been through both batch and individual retries
              timestamp: new Date(),
            })),
          },
        },
        $set: {
          processedImages:
            (existingBatch.processedImages || 0) + successfulResults.length,
          failedImagesCount:
            (existingBatch.failedImagesCount || 0) + failedResults.length,
          tokensUsed:
            (existingBatch.tokensUsed || 0) + successfulResults.length,
        },
      };

      // Update status based on results
      if (failedResults.length === 0) {
        updateData.$set.status = "Completed";
      } else if (successfulResults.length === 0) {
        updateData.$set.status = "Failed";
      } else {
        updateData.$set.status = "Partial";
      }

      await ImagesModel.findOneAndUpdate({ userId, batchId }, updateData, {
        new: true,
      });

      // Deduct tokens only for successful results
      const tokensToDeduct = successfulResults.length;
      if (tokensToDeduct > 0) {
        userActivity.useTokens(
          tokensToDeduct,
          `Processed ${tokensToDeduct} images in batch: ${batchId}`,
          batchId
        );
        userActivity.totalImageProcessed += tokensToDeduct;
        await userActivity.save();
      }
    }

    // Clean up uploaded files and directory
    let uploadDir = null;
    for (const image of images) {
      try {
        if (fs.existsSync(image.path)) {
          // Store the upload directory path before deleting the file
          uploadDir = path.dirname(image.path);
          fs.unlinkSync(image.path);
        }
      } catch (error) {
        console.error(`Error cleaning up file ${image.path}:`, error);
      }
    }

    // Clean up the upload directory if it exists and is empty
    if (uploadDir && fs.existsSync(uploadDir)) {
      try {
        const files = fs.readdirSync(uploadDir);
        if (files.length === 0) {
          fs.rmdirSync(uploadDir);
          console.log(`Cleaned up empty directory: ${uploadDir}`);
        }
      } catch (error) {
        console.error(`Error cleaning up directory ${uploadDir}:`, error);
      }
    }
  } catch (error) {
    console.error(
      `Error in background processing for batch ${batchId}:`,
      error
    );
    throw error;
  }
}

export const getBatchStatus = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const userId = req.user._id;

  if (!batchId) {
    throw new ApiError(400, "Batch ID is required");
  }

  const batch = await ImagesModel.findOne({ userId, batchId });

  if (!batch) {
    throw new ApiError(404, "Batch not found");
  }

  const responseData = {
    _id: batch._id,
    batchId: batch.batchId,
    name: batch.name,
    status: batch.status,
    processedImages: batch.processedImages,
    failedImagesCount: batch.failedImagesCount,
    tokensUsed: batch.tokensUsed,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
  };

  // If batch is completed or partial, include the counts and failed images
  if (batch.status === "Completed" || batch.status === "Partial") {
    responseData.successfulImagesCount = batch.images.length;
    responseData.failedImagesCount = batch.failedImages.length;
    responseData.failedImages = batch.failedImages.map((img) => ({
      filename: img.filename,
      error: img.error,
    }));
  }

  // If batch failed, include error message
  if (batch.status === "Failed") {
    responseData.errorMessage = batch.errorMessage;
  }

  return new ApiResponse(
    200,
    true,
    `Batch status: ${batch.status}`,
    responseData
  ).send(res);
});
