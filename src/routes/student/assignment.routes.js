import express from "express";
import {
  getMyAssignments,
  submitAssignment,
  getMySubmission,
} from "../../controllers/student/assignment.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multerUpload.js"; // ✅ multer

const router = express.Router();

// Get assignments for logged-in student
router.get("/my", protect, getMyAssignments);

// ✅ Submit assignment (multer + R2)
router.post(
  "/submit",
  protect,
  upload.array("files", 5), // 👈 allow multiple files
  submitAssignment
);

// Get my submission
router.get("/:assignmentId/submission", protect, getMySubmission);

export default router;
