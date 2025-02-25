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
