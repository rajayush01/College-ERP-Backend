import express from "express";
import {
  getMyTimetable,
  getMyTimetableDocuments,
} from "../../controllers/student/timetable.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// View own timetable
router.get("/me", protect, getMyTimetable);

// View timetable documents (PDF / uploads)
router.get("/me/documents", protect, getMyTimetableDocuments);

export default router;
