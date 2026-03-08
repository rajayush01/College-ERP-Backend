import express from "express";
const router = express.Router();

import {
  getDashboardStats,
  studentAttendanceSummary,
  lowAttendanceStudents,
  facultyPresenceSummary,
} from "../../controllers/admin/dashboard.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";

router.get("/stats", protect, isAdmin, getDashboardStats);
router.get("/student-attendance-summary", protect, isAdmin, studentAttendanceSummary);
router.get("/low-attendance-students", protect, isAdmin, lowAttendanceStudents);
router.get("/faculty-presence-summary", protect, isAdmin, facultyPresenceSummary);

export default router;
