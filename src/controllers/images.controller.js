import { asyncHandler } from "../utils/asyncHandler.js";

const uploadImages = asyncHandler(async (req, res) => {
  const domain = `${req.protocol}://${req.get("host")}`;
  const images = req.files.images;
  const imagesWithUrls = images.map((image) => ({
    filename: image.filename,
    size: image.size,
    url: `${domain}/${image.path.replace(/\\/g, "/")}`, // Ensure proper URL format
  }));
  console.log(imagesWithUrls);
});

export { uploadImages };
