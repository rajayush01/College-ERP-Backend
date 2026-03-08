import express from "express";
import { getMyAttendance } from "../../controllers/student/attendance.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// View own attendance
router.get("/me", protect, getMyAttendance);

export default router;
