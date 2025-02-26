import fs from "fs/promises";
import path from "path";
import { SUPPORTED_FORMATS } from "./image.utils.js";

export async function validateImageFile(filePath) {
  try {
    await fs.access(filePath);
    const ext = path.extname(filePath).toLowerCase();

    if (!ext) {
      throw new Error("File has no extension");
    }

    if (!SUPPORTED_FORMATS.includes(ext)) {
      throw new Error(`Unsupported image format: ${ext}`);
    }

    return {
      isValid: true,
      extension: ext,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
    };
  }
}

export async function cleanupFiles(filePaths) {
  for (const filePath of filePaths) {
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete file ${filePath}:`, error);
      }
    }
  }
}
