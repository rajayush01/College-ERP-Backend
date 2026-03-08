import express from "express";

import {
  createStudent,
  listStudents,
  getStudentById,
  uploadStudentDocumentsController,
  updateStudent,
} from "../../controllers/admin/student.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";
import { upload, photoUpload } from "../../middlewares/multerUpload.js"; // ✅ multer

const router = express.Router();

// Create student with optional photo
router.post("/", protect, isAdmin, photoUpload.single("photo"), createStudent);

// List students
router.get("/", protect, isAdmin, listStudents);

// Get student by ID
router.get("/:id", protect, isAdmin, getStudentById);

// Update student with optional photo
router.patch("/:id", protect, isAdmin, photoUpload.single("photo"), updateStudent);

// ✅ Upload student documents (multer + R2, demo mode)
router.post(
  "/:studentId/documents",
  protect,
  isAdmin,
  upload.single("document"), // ✅ multer middleware
  uploadStudentDocumentsController
);

export default router;
