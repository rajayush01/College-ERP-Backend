import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";

import {
  createTeacher,
  listTeachers,
  getTeacherById,
  updateTeacher,
  uploadTeacherDocumentsController,
  getAllTeachersForDropdown,
} from "../../controllers/admin/teacher.controller.js";

// ✅ Reuse generic multer middleware
import { upload, photoUpload } from "../../middlewares/multerUpload.js";

const router = express.Router();

// 🔹 DROPDOWN ROUTE (MUST BE FIRST)
router.get("/dropdown", protect, isAdmin, getAllTeachersForDropdown);

// 🔹 LIST (TABLE)
router.get("/", protect, isAdmin, listTeachers);

// 🔹 CREATE with optional photo
router.post("/", protect, isAdmin, photoUpload.single("photo"), createTeacher);

// 🔹 UPDATE with optional photo
router.patch("/:id", protect, isAdmin, photoUpload.single("photo"), updateTeacher);

// 🔹 UPLOAD TEACHER DOCUMENTS (PDF / images → R2)
router.post(
  "/:id/documents",
  protect,
  isAdmin,
  upload.single("document"), // ✅ multer (memoryStorage)
  uploadTeacherDocumentsController
);

// 🔹 GET BY ID (KEEP LAST)
router.get("/:id", protect, isAdmin, getTeacherById);

export default router;
