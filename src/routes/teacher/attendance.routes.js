import express from "express";
import {
  markStudentAttendance,
  getBatchAttendance,
  getAttendanceSummary
} from "../../controllers/teacher/attendance.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Mark attendance
router.post("/mark", protect, markStudentAttendance);

// View past attendance
router.get("/", protect, getBatchAttendance);


router.get("/summary",protect,getAttendanceSummary);

export default router;
