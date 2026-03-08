import multer from "multer";
import multerS3 from "multer-s3";
import { r2 } from "../config/r2.js";

if (!process.env.R2_BUCKET_NAME) {
  throw new Error("❌ R2_BUCKET_NAME is missing in .env");
}

const uploadStudentDocuments = multer({
  storage: multerS3({
    s3: r2,
    bucket: process.env.R2_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,

    key: (req, file, cb) => {
      console.log("📎 [Student Upload] File:", file.originalname);

      const ext = file.originalname.split(".").pop();
      const safeName = file.originalname
        .replace(`.${ext}`, "")
        .replace(/\s+/g, "_")
        .toLowerCase();

      const key = `Elite8-Digital/student-documents/${safeName}-${Date.now()}.${ext}`;
      console.log("🪣 R2 key:", key);

      cb(null, key);
    },
  }),

  fileFilter: (req, file, cb) => {
    console.log("🔍 fileFilter:", file.mimetype);
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files allowed"), false);
  },

  limits: { fileSize: 5 * 1024 * 1024 },
});

export default uploadStudentDocuments;
