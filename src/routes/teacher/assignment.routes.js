import express from "express";
import {
  createAssignment,
  getMyAssignments,
} from "../../controllers/teacher/assignment.controller.js";
import { upload } from "../../middlewares/multerUpload.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Create assignment with attachments
router.post(
  "/",
  protect,
  upload.array("attachments", 5), 
  createAssignment
);

// View assignments created by teacher
router.get("/my", protect, getMyAssignments);

export default router;
