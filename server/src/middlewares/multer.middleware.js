import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./public/temp";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);

    let filename = file.originalname;
    let counter = 1;

    while (fs.existsSync(path.join("./public/temp", filename))) {
      filename = `${baseName} (${counter})${ext}`;
      counter++;
    }

    cb(null, filename);
  },
});

export const upload = multer({ storage });
