import express from "express";
import {
  getMyResults,
  getMyResultByExam,
} from "../../controllers/student/result.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// View all published results
router.get("/my", protect, getMyResults);

// View result for a specific exam
router.get("/:examId", protect, getMyResultByExam);

export default router;
