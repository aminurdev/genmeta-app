import mime from "mime";
import fs from "fs/promises";
import { generate } from "../ai/gemini.service.js";

export async function processImage(file, processDir, promptData = {}) {
  const mimeType = mime.getType(file.originalname);

  try {
    // Process the image with AI and add metadata
    const generateResult = await generate(
      file.path,
      mimeType,
      processDir,
      promptData
    );

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
