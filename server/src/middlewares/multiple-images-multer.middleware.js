import multer from "multer";
import fs from "fs";
import path from "path";
import ApiError from "../utils/api.error.js";

const createUploadMiddleware = () => {
  const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
      try {
        const userId = req.user?._id;
        if (!userId) {
          return cb(new ApiError(401, "Authentication required"), null);
        }

        if (!req.batchId) {
          req.batchId = req.body.batchId || Date.now().toString();
        }

        const uploadDir = path.join(
          "./public/temp",
          userId.toString(),
          req.batchId
        );

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        req.uploadBatchPath = uploadDir;
        cb(null, uploadDir);
      } catch (error) {
        cb(
          new ApiError(
            500,
            `Error creating upload directory: ${error.message}`
          ),
          null
        );
      }
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      let filename = file.originalname;
      let counter = 1;

      while (fs.existsSync(path.join(req.uploadBatchPath, filename))) {
        filename = `${baseName} (${counter})${ext}`;
        counter++;
      }

      cb(null, filename);
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: 50 * 1024 * 1024,
      files: 200,
    },
  });
};

export const UploadMiddleware = createUploadMiddleware();

// Enhanced cleanup function
export const cleanupUploadDir = async (req) => {
  if (!req.uploadBatchPath) return;

  try {
    // Check if directory exists
    if (!fs.existsSync(req.uploadBatchPath)) {
      return;
    }

    // Get all files in the directory
    const files = fs.readdirSync(req.uploadBatchPath);

    // Delete each file
    for (const file of files) {
      const filePath = path.join(req.uploadBatchPath, file);
      fs.unlinkSync(filePath);
    }

    // Remove directory
    fs.rmdirSync(req.uploadBatchPath);

    // Try to remove parent directory if empty
    const userDir = path.dirname(req.uploadBatchPath);
    const remainingItems = fs.readdirSync(userDir);
    if (remainingItems.length === 0) {
      fs.rmdirSync(userDir);
    }
  } catch (error) {
    console.error(`Failed to clean up upload directory: ${error.message}`);
  }
};
