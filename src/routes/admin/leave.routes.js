import express from "express";
import {
  getAllLeaves,
  updateLeaveStatus,
  leaveSummary,
  teacherLeaveHistory,
  getTeacherLeaveBalance,
} from "../../controllers/admin/leave.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";

const router = express.Router();

// Get all leave requests (optional filter by status)
router.get("/", protect, isAdmin, getAllLeaves);

// Leave summary (PENDING / APPROVED / REJECTED counts)
router.get("/summary", protect, isAdmin, leaveSummary);

// Get leave history of a specific teacher
router.get("/teacher/:teacherId", protect, isAdmin, teacherLeaveHistory);

// Get leave balance for a teacher for a year
router.get("/balance", protect, isAdmin, getTeacherLeaveBalance);

// Approve / Reject a leave request
router.patch("/:leaveId", protect, isAdmin, updateLeaveStatus);

export default router;
