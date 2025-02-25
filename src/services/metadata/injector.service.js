import { ExiftoolProcess } from "node-exiftool";
import exiftoolBin from "dist-exiftool";
import fs from "fs/promises";
import path from "path";
import { prepareMetadata } from "../../utils/exif.utils.js";
import { SUPPORTED_FORMATS } from "../../utils/image.utils.js";

const ep = new ExiftoolProcess(exiftoolBin);

export async function addImageMetadata(imagePath, metadata, outputDir) {
  try {
    if (!imagePath || !metadata || !outputDir) {
      throw new Error(
        "Image path, metadata, and output directory are required"
      );
    }

    await fs.access(imagePath);

    const ext = path.extname(imagePath).toLowerCase();
    if (!ext || !SUPPORTED_FORMATS.includes(ext)) {
      throw new Error(`Unsupported or missing image format: ${ext}`);
    }

    const originalFilename = path.basename(imagePath);
    const outputPath = path.join(outputDir, originalFilename);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.copyFile(imagePath, outputPath);

    await ep.open();

    try {
      const metadataToWrite = prepareMetadata(metadata, ext);
      await ep.writeMetadata(outputPath, metadataToWrite, [
        "overwrite_original",
      ]);

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

      const verifyMetadata = await ep.readMetadata(outputPath);
      if (!verifyMetadata?.data?.length) {
        throw new Error("Metadata verification failed");
      }
    } finally {
      await ep.close();
    }

    return { status: true, message: "Metadata added successfully", outputPath };
  } catch (error) {
    await ep.close();
    throw new Error(`Failed to add metadata: ${error.message}`);
  }
}
export async function updateImageMetadata(imagePath, updateData) {
  try {
    if (!imagePath || !updateData) {
      throw new Error("Image path and update data are required");
    }

    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch (error) {
      throw new Error(`Image file not accessible: ${error.message}`);
    }

    // Validate file extension
    const ext = path.extname(imagePath).toLowerCase();
    if (!ext) {
      throw new Error(`File has no extension: ${imagePath}`);
    }
    if (!SUPPORTED_FORMATS.includes(ext)) {
      throw new Error(`Unsupported image format: ${ext}`);
    }

    // Create a backup before making changes
    const backupPath = `${imagePath}.backup`;
    await fs.copyFile(imagePath, backupPath);

    // Open exiftool process
    await ep.open();

    try {
      // Read existing metadata
      const existingMetadata = await ep.readMetadata(imagePath);
      if (
        !existingMetadata ||
        !existingMetadata.data ||
        existingMetadata.data.length === 0
      ) {
        throw new Error("Failed to read existing metadata");
      }

      // Helper function to parse existing keywords
      const parseExistingKeywords = (metadata) => {
        // Check various possible keyword fields
        const keywordsField =
          metadata.Keywords ||
          metadata["PNG:Keywords"] ||
          metadata["IPTC:Keywords"] ||
          metadata["XMP:Subject"] ||
          metadata["XMP-dc:Subject"];

        if (!keywordsField) return [];

        // Handle both array and string formats
        if (Array.isArray(keywordsField)) {
          return keywordsField;
        }

        // Handle string format with various possible delimiters
        return keywordsField
          .split(/[;,]/)
          .map((k) => k.trim())
          .filter(Boolean);
      };

      // Merge existing metadata with update data
      const existingData = existingMetadata.data[0];
      const mergedMetadata = {
        title:
          updateData.title !== undefined
            ? updateData.title
            : existingData.Title || "",
        description:
          updateData.description !== undefined
            ? updateData.description
            : existingData.Description || "",
        keywords:
          updateData.keywords !== undefined
            ? updateData.keywords
            : parseExistingKeywords(existingData),
      };

      // Prepare metadata based on file format
      const metadataToWrite = prepareMetadata(mergedMetadata, ext);

      // Write metadata to file
      await ep.writeMetadata(imagePath, metadataToWrite, [
        "overwrite_original",
      ]);

      // Special handling for PNG keywords
      if (
        ext === ".png" &&
        mergedMetadata.keywords &&
        mergedMetadata.keywords.length > 0
      ) {
        await ep.writeMetadata(
          imagePath,
          {
            Keywords: mergedMetadata.keywords,
            "XMP:Subject": mergedMetadata.keywords,
            "XMP-dc:Subject": mergedMetadata.keywords,
            "PNG:Keywords": mergedMetadata.keywords.join(";"),
          },
          ["overwrite_original"]
        );
      }

      // Verify metadata was written successfully
      const verifyMetadata = await ep.readMetadata(imagePath);
      if (
        !verifyMetadata ||
        !verifyMetadata.data ||
        verifyMetadata.data.length === 0
      ) {
        throw new Error("Metadata verification failed");
      }

      // Remove backup after successful update
      await fs.unlink(backupPath);
    } catch (error) {
      // Restore from backup if anything fails
      await fs.copyFile(backupPath, imagePath);
      await fs.unlink(backupPath);
      throw error;
    } finally {
      // Clean up
      await ep.close();
      try {
        // Attempt to remove backup if it still exists
        await fs.unlink(backupPath).catch(() => {});
      } catch (error) {
        console.warn(`Failed to clean up backup file: ${error.message}`);
      }
    }

    return {
      status: true,
      message: "Metadata updated successfully",
      updatedFields: Object.keys(updateData),
      path: imagePath,
    };
  } catch (error) {
    throw new Error(`Failed to update metadata: ${error.message}`);
  }
}
