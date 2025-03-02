import { Router } from "express";
import {
  downloadBatchAsZip,
  getBatchImages,
  updateImage,
  uploadImages,
} from "../controllers/images.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  deleteImage,
  uploadSingleImage,
} from "../controllers/single-image.controller.js";

const router = Router();

router.post(
  "/upload/multiple",
  verifyToken,
  upload.fields([
    {
      name: "images",
      maxCount: 50,
    },
  ]),
  uploadImages
);
router.post(
  "/upload/single",
  verifyToken,
  upload.single("image"),
  uploadSingleImage
);

router.patch("/update", verifyToken, updateImage);
router.delete("/delete", verifyToken, deleteImage);
router.get("/batch/:batchId", verifyToken, getBatchImages);
router.get("/download/:batchId", verifyToken, downloadBatchAsZip);

export default router;
