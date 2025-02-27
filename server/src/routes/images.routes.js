import { Router } from "express";
import {
  downloadBatchAsZip,
  updateImage,
  uploadImages,
} from "../controllers/images.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { uploadSingleImage } from "../controllers/single-image.controller.js";

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
router.post("/upload/single", upload.single("image"), uploadSingleImage);

router.patch("/update", verifyToken, updateImage);

router.get("/download/:batchId", verifyToken, downloadBatchAsZip);

export default router;
