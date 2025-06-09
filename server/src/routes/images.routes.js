import { Router } from "express";
import {
  deleteImage,
  downloadBatchAsZip,
  getAllBatches,
  getBatchImages,
  getMetadata,
  updateBatchName,
  updateImage,
} from "../controllers/images.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

import {
  getBatchStatus,
  uploadMultipleImages,
} from "../controllers/multipleImages.controller.js";

const router = Router();

import {
  cleanupUploadDir,
  UploadMiddleware,
} from "../middlewares/multiple-images-multer.middleware.js";
import ApiError from "../utils/api.error.js";
import multer from "multer";

router.post(
  "/upload/multiple",
  verifyUser,
  (req, res, next) => {
    UploadMiddleware.array("images", 200)(req, res, async (err) => {
      if (err) {
        console.error("Error in multer middleware:", err);

        // Clean up any uploaded files if an error occurs
        cleanupUploadDir(req).catch((cleanupErr) => {
          console.error("Error during cleanup:", cleanupErr);
        });

        if (err instanceof ApiError) {
          return res.status(err.statusCode).json({
            success: false,
            message: err.message,
          });
        }

        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
              success: false,
              message: "Too many files uploaded. Maximum is 100 files.",
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
          });
        }

        throw new ApiError(500, `Server error: ${err.message}`);
      }

      // Check token AFTER Multer processes files
      try {
        const userId = req.user?._id;
        if (!userId) {
          throw new ApiError(401, "Authentication required");
        }

        // Get actual file count
        const uploadedFileCount = req.files?.length || 0;

        if (req.user.token.available < uploadedFileCount) {
          throw new ApiError(
            400,
            `Insufficient tokens. Need ${uploadedFileCount} tokens, have ${req.user.token.available}`
          );
        }

        req.totalExpectedFiles = uploadedFileCount;

        next();
      } catch (error) {
        console.error("Error during token check:", error);

        cleanupUploadDir(req).catch((cleanupErr) => {
          console.error("Error during cleanup:", cleanupErr);
        });

        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message || "Internal server error",
        });
      }
    });
  },
  uploadMultipleImages
);

router.get("/processingStatus/:batchId", verifyUser, getBatchStatus);

router.put("/update", verifyUser, updateImage);
router.delete("/delete", verifyUser, deleteImage);
router.get("/batch/:batchId", verifyUser, getBatchImages);
router.patch("/batch/update/:batchId", verifyUser, updateBatchName);
router.get("/batches", verifyUser, getAllBatches);
router.get("/download/:batchId", downloadBatchAsZip);
router.get("/metadata/:batchId", verifyUser, getMetadata);

export default router;
