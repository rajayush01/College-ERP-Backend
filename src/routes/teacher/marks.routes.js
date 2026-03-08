import express from "express";
import {
  getMyExams,
  submitMarks,
  getMyMarks,
} from "../../controllers/teacher/marks.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// View assigned exams
router.get("/exams", protect, getMyExams);

// Enter / update marks
router.post("/submit", protect, submitMarks);

// View entered marks
router.get("/", protect, getMyMarks);

export default router;
