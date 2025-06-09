import mime from "mime";
import fs from "fs";
import sharp from "sharp";
import config from "../../config/index.js";
import exiftoolBin from "dist-exiftool";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ExiftoolProcess } from "node-exiftool";
import { prepareMetadata } from "../../utils/exif.utils.js";
import path from "path";
import os from "node:os";
import {
  generationConfig,
  model,
  safetySettings,
} from "../../config/gemini.config.js";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { getDirectS3Url, s3 } from "../aws/aws.service.js";
import { BASE_PROMPT, FORBIDDEN_KEYWORDS, prompt } from "../ai/prompt.js";

const bucketName = config.aws.bucketName;
const compressBucketName = config.aws.compressBucketName;

const MAX_CONCURRENT_UPLOAD_REQUESTS = 15;
const IMAGE_BATCH_SIZE = 5;

// Replace the validateMetadata function with a more strict version
export const validateMetadata = (metadata, originalFilename) => {
  // Check if metadata is properly formed
  if (!metadata || typeof metadata !== "object") return false;

  // Check if title is valid (not just the default fallback format)
  if (
    !metadata.title ||
    metadata.title.startsWith("Image ") ||
    metadata.title === originalFilename ||
    metadata.title.length < 20 || // Require longer, more descriptive titles
    metadata.title.includes("image_") ||
    metadata.title.includes("filename")
  ) {
    console.warn(`Invalid title: "${metadata.title}"`);
    return false;
  }

  // Check if description is valid
  if (
    !metadata.description ||
    metadata.description.startsWith("Uploaded image file") ||
    metadata.description.length < 40 || // Require more detailed descriptions
    metadata.description.includes("image file") ||
    metadata.description.includes("upload")
  ) {
    console.warn(
      `Invalid description: "${metadata.description?.substring(0, 40)}..."`
    );
    return false;
  }

  // Check if keywords are valid
  if (
    !Array.isArray(metadata.keywords) ||
    metadata.keywords.length < 10 || // Require a reasonable number of keywords
    (metadata.keywords.length <= 5 &&
      (metadata.keywords.includes("image") ||
        metadata.keywords.includes("upload") ||
        metadata.keywords.includes("photo")))
  ) {
    console.warn(
      `Invalid keywords: ${metadata.keywords ? JSON.stringify(metadata.keywords) : "none"}`
    );
    return false;
  }

  return true;
};

/**
 * Group images into batches of specified size
 * @param {Array} images - Array of images to process
 * @param {Number} batchSize - Number of images per batch
 * @returns {Array} - Array of image batches
 */
function batchImages(images, batchSize = IMAGE_BATCH_SIZE) {
  const batches = [];
  for (let i = 0; i < images.length; i += batchSize) {
    batches.push(images.slice(i, i + batchSize));
  }
  return batches;
}

export async function uploadCompressedImage({
  imageData,
  originalKey,
  userId,
  batchId,
  filename,
}) {
  const compressedKey = `compressed/${userId}/${batchId}/${filename}`;

  try {
    const imageBuffer =
      typeof imageData === "string" ? await fs.readFile(imageData) : imageData;

    let quality = 80;
    let outputBuffer = await sharp(imageBuffer)
      .resize({ width: 1200, height: 1200, fit: "inside" })
      .jpeg({ quality })
      .toBuffer();

    while (outputBuffer.length > 102400 && quality > 20) {
      quality -= 10;
      outputBuffer = await sharp(imageBuffer)
        .resize({ width: 1000, height: 1000, fit: "inside" })
        .jpeg({ quality })
        .toBuffer();
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: compressBucketName,
        Key: compressedKey,
        Body: outputBuffer,
        ContentType: "image/jpeg",
      })
    );

    return {
      status: "success",
      originalKey,
      compressedKey,
      compressedUrl: getDirectS3Url(compressedKey),
      compressedSize: Math.round(outputBuffer.length / 1024),
    };
  } catch (error) {
    console.error(`Error compressing image: ${error.message}`);
    return { status: "failed", error: error.message, originalKey };
  }
}

/**
 * Process images with improved parallelism
 * @param {Array} images - Array of images to process
 * @param {Object} options - Processing options
 * @param {Number} concurrencyLimit - Maximum number of parallel operations
 * @returns {Promise<Array>} - Results from all processed images
 */
export async function processBatchWithConcurrencyLimit(
  images,
  options,
  concurrencyLimit = MAX_CONCURRENT_UPLOAD_REQUESTS
) {
  const results = [];
  const totalImages = images.length;
  console.log(
    `Processing ${totalImages} images with concurrency limit ${concurrencyLimit}`
  );

  // Group images into batches for multi-image processing
  const imageBatches = batchImages(images, IMAGE_BATCH_SIZE);
  // console.log(
  //   `Created ${imageBatches.length} batches of ${IMAGE_BATCH_SIZE} images each`
  // );

  // Process batches with concurrency limit
  const semaphore = new Semaphore(concurrencyLimit);
  const processPromises = imageBatches.map(async (batch, batchIndex) => {
    const release = await semaphore.acquire();
    try {
      // Verify files exist before processing
      const validImages = batch.filter(
        (item) => item.path && fs.existsSync(item.path)
      );

      if (validImages.length === 0) {
        console.error(`No valid files in batch ${batchIndex + 1}`);
        return batch.map((item) => ({
          filename: item.originalname,
          error: `File not found: ${item.path}`,
          status: "failed",
        }));
      }

      // Process batch together
      const batchResults = await processBatch(validImages, options);
      // console.log(
      //   `Processed batch ${batchIndex + 1}/${imageBatches.length} (${validImages.length} images)`
      // );
      return batchResults;
    } catch (error) {
      console.error(
        `Error processing batch ${batchIndex + 1}: ${error.message}`
      );
      return batch.map((item) => ({
        filename: item.originalname,
        error: error.message || "Unknown error",
        status: "failed",
      }));
    } finally {
      release();
    }
  });

  // Wait for all promises to settle
  const allResults = await Promise.allSettled(processPromises);

  // Process results
  allResults.forEach((result) => {
    if (result.status === "fulfilled") {
      results.push(...result.value);
    } else {
      results.push({
        filename: "unknown",
        error: result.reason?.message || "Unknown error",
        status: "failed",
      });
    }
  });

  return results;
}

/**
 * Process a batch of images together with Gemini
 * @param {Array} batch - Array of images to process together
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} - Results from processed batch
 */
async function processBatch(batch, options) {
  const { titleLength, descriptionLength, keywordCount, userId, batchId } =
    options;
  const results = [];
  const tempFiles = [];

  try {
    // Create temporary directory for processing if it doesn't exist
    const tempDir = path.join(os.tmpdir(), "image-processing");
    if (!fs.existsSync(tempDir)) {
      await fs.promises.mkdir(tempDir, { recursive: true });
    }

    // First, prepare all images in parallel
    const preparedImages = await Promise.all(
      batch.map(async (image) => {
        const mimeType = mime.getType(image.originalname);

        // Read the uploaded image
        const imageBuffer = await fs.promises.readFile(image.path);

        // Create a smaller version for Gemini analysis
        const tempResizedPath = path.join(
          tempDir,
          `resized_${Date.now()}_${path.basename(image.filename || image.originalname)}`
        );
        await sharp(imageBuffer)
          .resize({ width: 768, withoutEnlargement: true })
          .jpeg({ quality: 70 })
          .toFile(tempResizedPath);

        // Prepare original image for metadata
        const tempOriginalPath = path.join(
          tempDir,
          `original_${Date.now()}_${path.basename(image.filename || image.originalname)}`
        );
        await fs.promises.writeFile(tempOriginalPath, imageBuffer);

        // Add to temp files list for cleanup
        tempFiles.push(tempResizedPath, tempOriginalPath);

        return {
          originalImage: image,
          resizedPath: tempResizedPath,
          originalPath: tempOriginalPath,
          mimeType,
          imageBuffer,
        };
      })
    );

    // Now send all images to Gemini in a single request
    const geminiFiles = await Promise.all(
      preparedImages.map(async (item) => {
        return {
          file: await uploadToGemini(item.resizedPath, item.mimeType),
          originalItem: item,
        };
      })
    );

    // Create parts array for Gemini request
    const parts = [];
    geminiFiles.forEach(({ file }) => {
      parts.push({ fileData: { mimeType: file.mimeType, fileUri: file.uri } });
    });

    // Add the text prompt as the last part
    parts.push({ text: BASE_PROMPT });

    // Start chat with all images
    let chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        {
          role: "user",
          parts: parts,
        },
      ],
    });

    // Send prompt for all images
    const forbiddenKeywordsStr = FORBIDDEN_KEYWORDS.join(", ");
    const promptStr = prompt(
      titleLength || 90,
      descriptionLength || 120,
      keywordCount || 25
    );

    // Add retry logic for Gemini API and JSON parsing with improved error handling
    let metadataArray = null;
    let retryCount = 0;
    const MAX_RETRIES = 2;
    const INITIAL_TIMEOUT = 20000; // 20 seconds

    retry_loop: while (retryCount <= MAX_RETRIES) {
      // Calculate timeout with backoff
      const timeout = INITIAL_TIMEOUT * (1 + retryCount * 0.5);

      try {
        // Make the API call with timeout
        const result = await Promise.race([
          chatSession.sendMessage(`${promptStr}: ${forbiddenKeywordsStr}`),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`Gemini API timeout after ${timeout}ms`)),
              timeout
            )
          ),
        ]);

        const jsonResponse = result.response.text();

        // Clean and parse the response - handle any text before or after code blocks
        let cleanedResponse = jsonResponse;

        // Find the first occurrence of ```json or ``` and extract everything between
        const jsonBlockMatch = jsonResponse.match(
          /```(?:json)?\s*([\s\S]*?)```/
        );
        if (jsonBlockMatch) {
          cleanedResponse = jsonBlockMatch[1].trim();
        } else {
          cleanedResponse = jsonResponse
            .replace(/^```json/, "")
            .replace(/```$/, "")
            .trim();
        }

        // Additional cleanup for common issues
        cleanedResponse = cleanedResponse
          .replace(/^[^{[\s]*/, "")
          .replace(/[^}\]]\s*$/, "")
          .trim();

        try {
          // Parse the JSON with repair attempt
          try {
            metadataArray = JSON.parse(cleanedResponse);
          } catch (initialParseError) {
            console.warn(
              `Initial JSON parsing failed: ${initialParseError.message}`
            );
            const repairedJson = repairJson(cleanedResponse);

            if (repairedJson !== cleanedResponse) {
              metadataArray = JSON.parse(repairedJson);
            } else {
              throw initialParseError;
            }
          }

          // Ensure it's an array
          if (!Array.isArray(metadataArray)) {
            metadataArray = [metadataArray];
          }

          // Check for complete metadata (correct number of items)
          if (metadataArray.length < preparedImages.length) {
            console.warn(
              `Attempt ${retryCount + 1}: Incomplete metadata (${metadataArray.length} items for ${preparedImages.length} images)`
            );

            if (retryCount === MAX_RETRIES) {
              // Generate placeholder items for each missing image
              while (metadataArray.length < preparedImages.length) {
                const missingIdx = metadataArray.length;
                const originalImage = preparedImages[missingIdx].originalImage;
                const baseName = path
                  .basename(
                    originalImage.originalname,
                    path.extname(originalImage.originalname)
                  )
                  .replace(/[-_]/g, " ");

                const placeholder = {
                  title: `Professional image of ${baseName}`,
                  description: `High quality detailed image showing ${baseName} with professional composition and lighting. Perfect for commercial use and design projects.`,
                  keywords: [
                    "professional",
                    "high quality",
                    "detailed",
                    "commercial use",
                    "photography",
                    "digital image",
                    "stock photo",
                    baseName,
                  ],
                  _generated: "placeholder_from_incomplete_response",
                };

                metadataArray.push(placeholder);
              }
            } else {
              throw new Error(
                `Incomplete metadata: expected ${preparedImages.length} items, got ${metadataArray.length}`
              );
            }
          }

          // Validate each metadata item
          for (let idx = 0; idx < metadataArray.length; idx++) {
            const isValid = validateMetadata(
              metadataArray[idx],
              path.basename(
                preparedImages[idx]?.originalImage?.originalname ||
                  `image_${idx}`
              )
            );

            if (!isValid) {
              console.warn(
                `Attempt ${retryCount + 1}: Invalid metadata for image ${idx}`
              );
              throw new Error(`Invalid metadata format for image ${idx}`);
            }
          }

          break retry_loop;
        } catch (parseError) {
          console.warn(
            `Attempt ${retryCount + 1}: Error: ${parseError.message}`
          );
          console.log("Failed to parse Gemini response. Raw response:");
          console.log(jsonResponse);
          metadataArray = null;

          if (retryCount === MAX_RETRIES) {
            throw new Error(
              `Failed to parse or validate Gemini response: ${parseError.message}`
            );
          }
        }
      } catch (apiError) {
        console.warn(
          `Attempt ${retryCount + 1}: Gemini API error: ${apiError.message}`
        );
        if (apiError.response?.text) {
          console.log("Gemini API error response:");
          console.log(apiError.response.text);
        }

        if (!apiError.message.includes("timeout")) {
          chatSession = model.startChat({
            generationConfig,
            safetySettings,
            history: [{ role: "user", parts: parts }],
          });
        }

        if (retryCount === MAX_RETRIES) {
          throw new Error(` ${apiError.message}`);
        }
      }

      retryCount++;
      const baseDelay = 1000 * Math.pow(2, retryCount);
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // If we've exhausted all retries and still don't have valid metadata
    if (!metadataArray) {
      throw new Error(`Failed to get valid metadata`);
    }

    // Process each image with metadata in parallel
    const uploadSemaphore = new Semaphore(MAX_CONCURRENT_UPLOAD_REQUESTS);
    const uploadPromises = preparedImages.map(async (item, index) => {
      const release = await uploadSemaphore.acquire();
      try {
        // Get metadata for this image
        let metadata = metadataArray[index];

        // If metadata is missing or invalid, try to process this image individually
        if (
          !metadata ||
          !validateMetadata(metadata, item.originalImage.originalname)
        ) {
          console.log(
            `Retrying individual image: ${item.originalImage.originalname}`
          );

          // Create a new chat session for this single image
          const singleImageParts = [
            {
              fileData: {
                mimeType: item.mimeType,
                fileUri: (await uploadToGemini(item.resizedPath, item.mimeType))
                  .uri,
              },
            },
            { text: BASE_PROMPT },
          ];

          const singleImageChat = model.startChat({
            generationConfig,
            safetySettings,
            history: [{ role: "user", parts: singleImageParts }],
          });

          try {
            const singleImageResult = await singleImageChat.sendMessage(
              `${promptStr}: ${forbiddenKeywordsStr}`
            );

            const singleImageResponse = singleImageResult.response.text();
            let singleImageMetadata = null;

            try {
              // Try to parse the response
              const cleanedResponse = singleImageResponse
                .replace(/^```json/, "")
                .replace(/```$/, "")
                .trim();

              singleImageMetadata = JSON.parse(cleanedResponse);
              if (!Array.isArray(singleImageMetadata)) {
                singleImageMetadata = [singleImageMetadata];
              }
              singleImageMetadata = singleImageMetadata[0];
            } catch (parseError) {
              console.error(
                `Failed to parse single image response: ${parseError.message}`
              );
              throw new Error(`Invalid metadata format for single image`);
            }

            if (
              validateMetadata(
                singleImageMetadata,
                item.originalImage.originalname
              )
            ) {
              metadata = singleImageMetadata;
            } else {
              throw new Error(`Invalid metadata for single image`);
            }
          } catch (singleImageError) {
            console.error(
              `Single image processing failed: ${singleImageError.message}`
            );
            throw singleImageError;
          }
        }

        // Add metadata to the original image
        const metadataResult = await addMetadataToImage(
          item.originalPath,
          metadata
        );
        tempFiles.push(metadataResult.outputPath);

        // Read the final buffer with metadata
        const finalBuffer = await fs.promises.readFile(
          metadataResult.outputPath
        );

        // Upload the image to S3
        const objectKey = `uploads/${userId}/${batchId}/${item.originalImage.filename || path.basename(item.originalImage.originalname)}`;
        const uploadParams = {
          Bucket: bucketName,
          Key: objectKey,
          Body: finalBuffer,
          ContentType: item.mimeType,
        };
        const command = new PutObjectCommand(uploadParams);
        await s3.send(command);

        // Create and upload compressed version
        const compressResult = await uploadCompressedImage({
          imageData: finalBuffer,
          originalKey: objectKey,
          userId,
          batchId,
          filename:
            item.originalImage.filename ||
            path.basename(item.originalImage.originalname),
        });

        return {
          filename: item.originalImage.originalname,
          compressedUrl: compressResult.compressedUrl,
          size: item.originalImage.size,
          compressedSize: compressResult.compressedSize + "KB",
          metadata,
        };
      } finally {
        release();
      }
    });

    // Wait for all uploads to complete
    const uploadResults = await Promise.allSettled(uploadPromises);

    // Process results
    uploadResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          filename: preparedImages[index].originalImage.originalname,
          error: result.reason?.message || "Unknown error",
          status: "failed",
        });
      }
    });

    // Clean up temp files
    cleanupTempFilesAsync(tempFiles);

    return results;
  } catch (error) {
    // Clean up temp files
    cleanupTempFilesAsync(tempFiles);

    // Return error object for all images in the batch
    return batch.map((image) => ({
      filename: image.originalname,
      error: error.message || "Unknown error",
      status: "failed",
    }));
  }
}

// Async cleanup function that doesn't block the main process
function cleanupTempFilesAsync(tempFiles) {
  Promise.all(
    tempFiles.map((path) =>
      fs.promises
        .unlink(path)
        .catch((err) => console.error(`Failed to delete ${path}:`, err))
    )
  ).catch((err) => console.error("Error during cleanup:", err));
}

// Upload image to Gemini
const apiKey = config.geminiApiKey;
const fileManager = new GoogleAIFileManager(apiKey);

async function uploadToGemini(filePath, mimeType) {
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: path.basename(filePath),
  });
  return uploadResult.file;
}

// Simple semaphore implementation for controlling concurrency
class Semaphore {
  constructor(max) {
    this.max = max;
    this.count = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.count < this.max) {
      this.count++;
      return this._createRelease();
    }

    // Create a promise that will be resolved when a resource is released
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.count++;
        resolve(this._createRelease());
      });
    });
  }

  _createRelease() {
    return () => {
      this.count--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    };
  }
}

// Optimize the addMetadataToImage function
async function addMetadataToImage(imagePath, metadata) {
  const ext = path.extname(imagePath).toLowerCase();
  const outputPath = imagePath + ".meta" + ext;
  await fs.promises.copyFile(imagePath, outputPath);

  const ep = new ExiftoolProcess(exiftoolBin);
  try {
    await ep.open();

    const metadataToWrite = prepareMetadata(metadata, ext);
    await ep.writeMetadata(outputPath, metadataToWrite, ["overwrite_original"]);

    if (ext === ".png" && metadata.keywords?.length) {
      await ep.writeMetadata(
        outputPath,
        {
          Keywords: metadata.keywords,
          "XMP:Subject": metadata.keywords,
          "XMP-dc:Subject": metadata.keywords,
          "PNG:Keywords": metadata.keywords.join(";"),
        },
        ["overwrite_original"]
      );
    }

    return { status: true, message: "Metadata added successfully", outputPath };
  } finally {
    await ep.close();
  }
}

/**
 * Attempts to repair malformed JSON by fixing common issues
 * @param {string} jsonString - The potentially malformed JSON string
 * @returns {string} - A repaired JSON string that may be parseable
 */
function repairJson(jsonString) {
  if (!jsonString) return "";

  try {
    // First try parsing as-is
    JSON.parse(jsonString);
    return jsonString; // If no error, return unchanged
  } catch (error) {
    // console.log(`Attempting to repair malformed JSON: ${error.message}`);

    let repairedJson = jsonString;

    // The position in the error message can help locate the issue
    const positionMatch = error.message.match(/position (\d+)/);
    const errorPosition = positionMatch ? parseInt(positionMatch[1]) : -1;

    if (errorPosition > 0) {
      console.log(`Error detected near position ${errorPosition}`);

      // Extract context around the error (20 chars before and after)
      const start = Math.max(0, errorPosition - 20);
      const end = Math.min(jsonString.length, errorPosition + 20);
      const context = jsonString.substring(start, end);
      console.log(`Context around error: "${context}"`);
    }

    // Fix dangling commas in objects
    repairedJson = repairedJson.replace(/,\s*}/g, "}");

    // Fix dangling commas in arrays
    repairedJson = repairedJson.replace(/,\s*\]/g, "]");

    // Add missing quotes around property names
    repairedJson = repairedJson.replace(
      /({|,)\s*([a-zA-Z0-9_]+)\s*:/g,
      '$1"$2":'
    );

    // Fix missing commas between properties
    repairedJson = repairedJson.replace(/"\s*}\s*{\s*"/g, '"},{"');
    repairedJson = repairedJson.replace(/"\s*}\s*"/g, '"},"');

    // Fix unescaped quotes in strings - fixed regex without unnecessary escapes
    repairedJson = repairedJson.replace(/(:\s*".*?)(?<!\\)"(.*?")/g, '$1\\"$2');

    // Fix for incomplete arrays or objects
    if (repairedJson.split("{").length > repairedJson.split("}").length) {
      repairedJson += "}";
    }
    if (repairedJson.split("[").length > repairedJson.split("]").length) {
      repairedJson += "]";
    }

    // Ensure the JSON is wrapped in brackets if it seems like an array
    if (!repairedJson.startsWith("[") && repairedJson.includes('{"title":')) {
      repairedJson = "[" + repairedJson + "]";
    }

    return repairedJson;
  }
}

/**
 * Process a single image with Gemini as a fallback mechanism
 * @param {Object} image - Single image to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Results from processed image
 */
async function processSingleImage(image, options) {
  const { titleLength, descriptionLength, keywordCount, userId, batchId } =
    options;
  const tempFiles = [];

  try {
    // Create temporary directory for processing if it doesn't exist
    const tempDir = path.join(os.tmpdir(), "image-processing");
    if (!fs.existsSync(tempDir)) {
      await fs.promises.mkdir(tempDir, { recursive: true });
    }

    const mimeType = mime.getType(image.originalname);

    // Read the uploaded image
    const imageBuffer = await fs.promises.readFile(image.path);

    // Create a smaller version for Gemini analysis
    const tempResizedPath = path.join(
      tempDir,
      `resized_${Date.now()}_${path.basename(image.filename || image.originalname)}`
    );
    await sharp(imageBuffer)
      .resize({ width: 768, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toFile(tempResizedPath);

    // Prepare original image for metadata
    const tempOriginalPath = path.join(
      tempDir,
      `original_${Date.now()}_${path.basename(image.filename || image.originalname)}`
    );
    await fs.promises.writeFile(tempOriginalPath, imageBuffer);

    // Add to temp files list for cleanup
    tempFiles.push(tempResizedPath, tempOriginalPath);

    // Upload image to Gemini
    const file = await uploadToGemini(tempResizedPath, mimeType);

    // Create parts array for Gemini request
    const parts = [
      { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
      { text: BASE_PROMPT },
    ];

    // Start chat with single image
    let chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        {
          role: "user",
          parts: parts,
        },
      ],
    });

    // Send prompt for the image
    const forbiddenKeywordsStr = FORBIDDEN_KEYWORDS.join(", ");
    const promptStr = prompt(
      titleLength || 90,
      descriptionLength || 120,
      keywordCount || 25
    );

    // Add retry logic for Gemini API and JSON parsing with improved error handling
    let metadata = null;
    let retryCount = 0;
    const MAX_RETRIES = 2;
    const INITIAL_TIMEOUT = 20000; // 20 seconds

    // Loop for single image processing retries
    retry_loop: while (retryCount <= MAX_RETRIES) {
      // Calculate timeout with backoff
      const timeout = INITIAL_TIMEOUT * (1 + retryCount * 0.5);

      try {
        // Make the API call with timeout
        const result = await Promise.race([
          chatSession.sendMessage(`${promptStr}: ${forbiddenKeywordsStr}`),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`Gemini API timeout after ${timeout}ms`)),
              timeout
            )
          ),
        ]);

        const jsonResponse = result.response.text();

        // Clean and parse the response - handle any text before or after code blocks
        let cleanedResponse = jsonResponse;

        // Find the first occurrence of ```json or ``` and extract everything between
        const jsonBlockMatch = jsonResponse.match(
          /```(?:json)?\s*([\s\S]*?)```/
        );
        if (jsonBlockMatch) {
          cleanedResponse = jsonBlockMatch[1].trim();
        } else {
          // If no code block markers found, try to clean the response directly
          cleanedResponse = jsonResponse
            .replace(/^```json/, "")
            .replace(/```$/, "")
            .trim();
        }

        // Additional cleanup for common issues
        cleanedResponse = cleanedResponse
          .replace(/^[^{[\s]*/, "") // Remove any text before first { or [
          .replace(/[^}\]]\s*$/, "") // Remove any text after last } or ]
          .trim();

        try {
          // Parse the JSON with repair attempt
          try {
            metadata = JSON.parse(cleanedResponse);
          } catch (initialParseError) {
            console.warn(
              `Initial JSON parsing failed: ${initialParseError.message}`
            );
            const repairedJson = repairJson(cleanedResponse);

            if (repairedJson !== cleanedResponse) {
              metadata = JSON.parse(repairedJson);
            } else {
              throw initialParseError;
            }
          }

          // If it's an array, take the first item (we're processing a single image)
          if (Array.isArray(metadata)) {
            metadata = metadata[0];
          }

          // Validate metadata
          const isValid = validateMetadata(
            metadata,
            path.basename(image.originalname || `image`)
          );

          if (!isValid) {
            console.warn(
              `Attempt ${retryCount + 1}: Invalid metadata for image ${image.originalname}`
            );
            throw new Error(
              `Invalid metadata format for image ${image.originalname}`
            );
          }

          break retry_loop;
        } catch (parseError) {
          // JSON parsing or validation error
          console.warn(
            `Attempt ${retryCount + 1}: Error: ${parseError.message}`
          );
          console.log("Failed to parse Gemini response. Raw response:");
          console.log(jsonResponse);
          metadata = null;

          if (retryCount === MAX_RETRIES) {
            throw new Error(
              `Failed to parse or validate Gemini response: ${parseError.message}`
            );
          }
        }
      } catch (apiError) {
        // API error or timeout
        console.warn(
          `Attempt ${retryCount + 1}: Gemini API error: ${apiError.message}`
        );
        if (apiError.response?.text) {
          console.log("Gemini API error response:");
          console.log(apiError.response.text);
        }

        // Create a new chat session if not a timeout error
        if (!apiError.message.includes("timeout")) {
          chatSession = model.startChat({
            generationConfig,
            safetySettings,
            history: [{ role: "user", parts: parts }],
          });
        }

        if (retryCount === MAX_RETRIES) {
          throw new Error(` ${apiError.message}`);
        }
      }

      // Increment retry counter
      retryCount++;

      // Calculate delay with exponential backoff and jitter
      const baseDelay = 1000 * Math.pow(2, retryCount); // 2s, 4s, 8s, etc.
      const jitter = Math.random() * 1000; // Random jitter up to 1s
      const delay = baseDelay + jitter;

      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // If we still don't have valid metadata, throw an error
    if (!metadata) {
      throw new Error(
        `Failed to get valid metadata after ${MAX_RETRIES + 1} attempts`
      );
    }

    // Add metadata to the image
    const metadataResult = await addMetadataToImage(tempOriginalPath, metadata);
    tempFiles.push(metadataResult.outputPath);

    // Read the final buffer with metadata
    const finalBuffer = await fs.promises.readFile(metadataResult.outputPath);

    // Upload the image to S3
    const objectKey = `uploads/${userId}/${batchId}/${image.filename || path.basename(image.originalname)}`;
    const uploadParams = {
      Bucket: bucketName,
      Key: objectKey,
      Body: finalBuffer,
      ContentType: mimeType,
    };
    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    // Create and upload compressed version
    const compressResult = await uploadCompressedImage({
      imageData: finalBuffer,
      originalKey: objectKey,
      userId,
      batchId,
      filename: image.filename || path.basename(image.originalname),
    });

    // Clean up temp files
    cleanupTempFilesAsync(tempFiles);

    return {
      filename: image.originalname,
      compressedUrl: compressResult.compressedUrl,
      size: image.size,
      compressedSize: compressResult.compressedSize + "KB",
      metadata,
    };
  } catch (error) {
    // Clean up temp files
    cleanupTempFilesAsync(tempFiles);

    // Return error object
    return {
      filename: image.originalname,
      error: error.message || "Unknown error",
      status: "failed",
    };
  }
}

/**
 * Process failed images individually after batch processing failures
 * @param {Array} failedImages - Array of failed images to retry individually
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} - Results from all processed images
 */
export async function processFallbackIndividual(failedImages, options) {
  console.log(
    `Processing ${failedImages.length} failed images individually as fallback`
  );

  // Process images one by one with limited concurrency
  const semaphore = new Semaphore(3); // Lower concurrency for individual processing
  const results = [];

  // Process each image individually
  const processPromises = failedImages.map(async (image) => {
    const release = await semaphore.acquire();
    try {
      // Verify file exists before processing
      if (!image.path || !fs.existsSync(image.path)) {
        console.error(`File not found: ${image.path}`);
        return {
          filename: image.originalname,
          error: `File not found: ${image.path}`,
          status: "failed",
        };
      }

      // Process this single image
      return await processSingleImage(image, options);
    } catch (error) {
      console.error(
        `Error processing individual image ${image.originalname}: ${error.message}`
      );
      return {
        filename: image.originalname,
        error: error.message || "Unknown error",
        status: "failed",
      };
    } finally {
      release();
    }
  });

  // Wait for all promises to settle
  const allResults = await Promise.allSettled(processPromises);

  // Process results
  allResults.forEach((result) => {
    if (result.status === "fulfilled") {
      results.push(result.value);
    } else {
      results.push({
        filename: "unknown",
        error: result.reason?.message || "Unknown error",
        status: "failed",
      });
    }
  });

  return results;
}
