import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multerUpload.js";
import {
  getMyPersonalTimetables,
  uploadPersonalTimetablePDF,
  savePersonalTimetableManual,
  deletePersonalTimetable,
} from "../../controllers/teacher/myTimetable.controller.js";

const router = express.Router();

router.get("/", protect, getMyPersonalTimetables);
router.post("/upload", protect, upload.single("file"), uploadPersonalTimetablePDF);
router.post("/manual", protect, savePersonalTimetableManual);
router.delete("/:id", protect, deletePersonalTimetable);

export default router;
