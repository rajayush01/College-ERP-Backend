import multer from "multer";
import multerS3 from "multer-s3";
import { r2 } from "../config/r2.js";

/* =========================
   Upload Teacher Documents to R2
========================= */
export const uploadTeacherDocuments = multer({
  storage: multerS3({
    s3: r2,
    bucket: process.env.R2_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,

    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const safeName = file.originalname
        .replace(`.${ext}`, "")
        .replace(/\s+/g, "_")
        .toLowerCase();

      const key = `Elite8-Digital/teacher-documents/${safeName}-${Date.now()}.${ext}`;
      cb(null, key);
    },
  }),

  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(
        new Error("Only PDF files are allowed"),
        false
      );
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per PDF
  },
}).array("documents", 10); // up to 10 PDFs
