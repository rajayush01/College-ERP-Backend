// src/routes/admin/teacherAttendance.routes.js
import express from "express";

import {
  markTeacherAttendance,
  getTeacherAttendanceReport
} from "../../controllers/admin/teacherAttendance.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";

const router = express.Router();

/**
 * Admin: Mark Teacher Attendance
 */
router.post("/mark", protect, isAdmin, markTeacherAttendance);
router.get("/", protect, isAdmin, getTeacherAttendanceReport);

export default router;
