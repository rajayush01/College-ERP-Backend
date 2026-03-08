import express from "express";
import {
  uploadDocument,
  getAllDocuments,
} from "../../controllers/admin/SharedDocument.controller.js";
import { uploadSharedDocumentController } from "../../controllers/admin/sharedDocumentUpload.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";
import { upload } from "../../middlewares/multerUpload.js";

const router = express.Router();

/**
 * Admin: Upload shared document (NEW - uses multer + R2)
 */
router.post(
  "/upload",
  protect,
  isAdmin,
  upload.single("file"),
  uploadSharedDocumentController
);

/**
 * Admin: Upload shared PDF document (LEGACY - R2 URL-based, NO multer)
 */
router.post(
  "/",
  protect,
  isAdmin,
  uploadDocument
);

/**
 * Admin: List shared documents
 */
router.get("/", protect, isAdmin, getAllDocuments);

export default router;
