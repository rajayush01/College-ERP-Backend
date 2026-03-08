import multer from "multer";
import multerS3 from "multer-s3";
import { r2 } from "../config/r2.js";

/* =========================
   Upload PDFs to Cloudflare R2
========================= */
export const upload = multer({
  storage: multerS3({
    s3: r2,
    bucket: process.env.R2_BUCKET_NAME,

    // Ensures correct Content-Type in R2
    contentType: multerS3.AUTO_CONTENT_TYPE,

    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop()?.toLowerCase();

      const safeName = file.originalname
        .replace(/\.[^/.]+$/, "")   // remove extension safely
        .replace(/[^a-zA-Z0-9-_]/g, "_")
        .toLowerCase();

      const key = `Elite8-Digital/documents/${safeName}-${Date.now()}.${ext}`;

      cb(null, key);
    },
  }),

  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only PDF files are allowed"));
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});


