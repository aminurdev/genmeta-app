import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import ApiError from "../utils/api.error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

const s3 = new S3Client({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  forcePathStyle: true,
});

const uploadImages = asyncHandler(async (req, res) => {
  const domain = `${req.protocol}://${req.get("host")}`;
  const images = req.files.images;
  if (!images) return new ApiError(400, "No images uploaded");

  const bucketName = "test-bucket";

  const uploadPromises = images.map(async (image) => {
    const filePath = image.path;
    const fileContent = fs.readFileSync(filePath);
    const objectKey = `uploads/${image.filename}`;

    const uploadParams = {
      Bucket: bucketName,
      Key: objectKey,
      Body: fileContent,
      ContentType: image.mimetype,
    };

    try {
      await s3.send(new PutObjectCommand(uploadParams));

      // ✅ Delete the local file after successful upload
      fs.unlinkSync(filePath);

      return {
        filename: image.filename,
        size: image.size,
        url: `${domain}/${bucketName}/${objectKey}`, // Generate URL dynamically
      };
    } catch (error) {
      console.error(`❌ Error uploading ${image.filename}:`, error);
      throw new ApiError(500, `Failed to upload ${image.filename}`);
    }
  });

  const uploadedImages = await Promise.all(uploadPromises);

  return new ApiResponse(
    200,
    true,
    "Images uploaded and local files deleted",
    uploadedImages
  ).send(res);
});

export { uploadImages };
