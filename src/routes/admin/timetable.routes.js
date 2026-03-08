import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";
import { upload } from "../../middlewares/multerUpload.js";

import {
  upsertTimetable,
  getBatchTimetable,
  uploadTimetableDocument,
  toggleTimetableDoc,
  getAllTimetableDocuments,
} from "../../controllers/admin/timetable.controller.js";

import { uploadTimetableDocumentController } from "../../controllers/admin/timetableUpload.controller.js";

const router = express.Router();

// Manual timetable creation/update
router.post("/", protect, isAdmin, upsertTimetable);

// Get timetable for a specific batch
router.get("/:batchId", protect, isAdmin, getBatchTimetable);

// Upload timetable document (NEW - uses multer + R2)
router.post(
  "/upload",
  protect,
  isAdmin,
  upload.single("file"),
  uploadTimetableDocumentController
);

// Legacy upload endpoint (now supports both FormData and URL-based)
router.post("/upload/document", protect, isAdmin, upload.single("file"), uploadTimetableDocument);

// Toggle timetable document active status
router.patch("/document/:docId/toggle", protect, isAdmin, toggleTimetableDoc);

// Get all timetable documents
router.get("/documents/all", protect, isAdmin, getAllTimetableDocuments);

export default router;
