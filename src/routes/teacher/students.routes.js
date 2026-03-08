import express from "express";
import { getAssignedStudents } from "../../controllers/teacher/students.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// View assigned students (class-wise)
router.get("/assigned", protect, getAssignedStudents);

export default router;
