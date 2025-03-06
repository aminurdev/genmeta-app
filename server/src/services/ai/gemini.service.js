import path from "path";
import fs from "fs/promises";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { apiKey, generationConfig, model } from "../../config/gemini.config.js";
import { safetySettings } from "../../utils/safety.settings.js";
import {
  BASE_PROMPT,
  FORBIDDEN_KEYWORDS,
  prompt,
} from "../../utils/image.utils.js";
import { addImageMetadata } from "../metadata/injector.service.js";
import { resizeImage } from "../image/image-resizing.service.js";

const fileManager = new GoogleAIFileManager(apiKey);
const optimizedOutputFilePath = "public/temp/sharp";

async function uploadToGemini(filePath, mimeType) {
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: path.basename(filePath),
  });
  return uploadResult.file;
}

export async function generate(
  filePath,
  mimeType,
  outputPath,
  promptData = {}
) {
  try {
    const optimizedFilePath = await resizeImage(
      filePath,
      optimizedOutputFilePath
    );
    const file = await uploadToGemini(optimizedFilePath, mimeType);
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: file.mimeType,
                fileUri: file.uri,
              },
            },
            { text: BASE_PROMPT },
          ],
        },
      ],
    });

    const forbiddenKeywordsStr = FORBIDDEN_KEYWORDS.join(", ");
    const dataResult = await chatSession.sendMessage(
      `${prompt(promptData?.titleLength || 90, promptData?.descriptionLength || 120, promptData?.keywordCount || 25)}: ${forbiddenKeywordsStr}`
    );
    const jsonResponse = dataResult.response.text();
    const cleanedResponse = jsonResponse
      .replace(/^```json/, "")
      .replace(/```$/, "")
      .trim();
    const parsedJson = JSON.parse(cleanedResponse);
    fs.unlink(optimizedFilePath);

    try {
      const result = await addImageMetadata(filePath, parsedJson, outputPath);
      return { ...result, metadata: parsedJson };
    } catch (metadataError) {
      try {
        await fs.unlink(path.join(outputPath, path.basename(filePath)));
      } catch (cleanupError) {
        console.error("Failed to cleanup file:", cleanupError);
      }
      throw new Error(`Failed to add metadata: ${metadataError.message}`);
    }
  } catch (error) {
    throw new Error(`Error processing SEO metadata: ${error.message}`);
  }
}
