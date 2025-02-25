import { Router } from "express";
import { uploadImages } from "../controllers/images.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

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
  upload.fields([
    {
      name: "images",
      maxCount: 1,
    },
  ]),
  uploadImages
);

export default router;
