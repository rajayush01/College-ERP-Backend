import express from "express";
import { createExam,getAllExams,toggleExamStatus,deleteExam } from "../../controllers/admin/exam.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";

const router = express.Router();

router.post("/", protect, isAdmin, createExam);
router.get("/", protect, isAdmin, getAllExams);
router.patch("/:examId/toggle", protect, isAdmin, toggleExamStatus);
router.delete("/:examId", protect, isAdmin, deleteExam);

export default router;
