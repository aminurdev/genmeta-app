import { Router } from "express";
import {
  downloadBatchAsZip,
  getAllBatches,
  getBatchImages,
  getMetadata,
  updateBatchName,
  updateImage,
} from "../controllers/images.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  deleteImage,
  uploadSingleImage,
} from "../controllers/single-image.controller.js";

const router = Router();

router.post(
  "/upload/single",
  verifyToken,
  upload.single("image"),
  uploadSingleImage
);

router.put("/update", verifyToken, updateImage);
router.delete("/delete", verifyToken, deleteImage);
router.get("/batch/:batchId", verifyToken, getBatchImages);
router.patch("/batch/update/:batchId", verifyToken, updateBatchName);
router.get("/batches", verifyToken, getAllBatches);
router.get("/download/:batchId", downloadBatchAsZip);
router.get("/metadata/:batchId", verifyToken, getMetadata);

export default router;
