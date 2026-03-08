import express from "express";
import {
  getAssignmentSubmissions,
  gradeSubmission,
  getAssignmentAnalytics,
} from "../../controllers/teacher/assignmentGrading.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// View submissions
router.get("/:assignmentId/submissions", protect, getAssignmentSubmissions);

// Grade submission
router.patch("/submission/:submissionId/grade", protect, gradeSubmission);

// Analytics
router.get("/:assignmentId/analytics", protect, getAssignmentAnalytics);

export default router;
