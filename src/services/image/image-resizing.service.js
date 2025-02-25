import sharp from "sharp";
import fs from "fs";
import path from "path";

async function resizeImage(inputPath, outputDir) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Extract the original file name
    const fileName = path.basename(inputPath);
    const outputPath = path.join(outputDir, fileName);

    // Read image metadata
    const metadata = await sharp(inputPath).metadata();

    // Check if the width is greater than 1500px
    if (metadata.width > 1500) {
      await sharp(inputPath)
        .resize({ width: 1500 }) // Resize width to 1500px, auto height
        .toFile(outputPath);
      console.log(`✅ Image resized to 1500px width: ${outputPath}`);
    } else {
      // No need to resize, just copy the file
      fs.copyFileSync(inputPath, outputPath);
      console.log(
        `ℹ️ Image width is within limit, copied as is: ${outputPath}`
      );
    }

    // Return the final output path
    return outputPath;
  } catch (error) {
    console.error("❌ Error processing image:", error);
    throw error; // Rethrow to handle it outside
  }
}

export { resizeImage };
