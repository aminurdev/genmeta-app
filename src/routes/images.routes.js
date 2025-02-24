import { Router } from "express";
import { uploadImages } from "../controllers/images.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post(
  "/upload",
  upload.fields([
    {
      name: "images",
      maxCount: 50,
    },
  ]),
  uploadImages
);

export default router;
