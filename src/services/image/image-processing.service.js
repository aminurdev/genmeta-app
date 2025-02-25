import fs from "fs/promises";
import path from "path";
import { generate } from "../ai/gemini.service.js";

export async function processImage(file, processDir) {
  const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);

  try {
    // Process the image with AI and add metadata
    const generateResult = await generate(file.path, fileExtension, processDir);

    // Clean up original upload
    await fs.unlink(file.path);

    return {
      filename: file.originalname,
      imagePath: generateResult.outputPath,
      metadata: generateResult.metadata,
    };
  } catch (error) {
    // Clean up files in case of error
    try {
      await fs.unlink(file.path);
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }
    throw error;
  }
}
