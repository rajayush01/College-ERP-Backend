import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";

import {
  createBatch,
  assignBatchAdvisor,
  assignSubjectFaculty,
  getAllBatches
} from "../../controllers/admin/batch.controller.js";

const router = express.Router();

// 🔐 All routes are admin-protected
router.use(protect, isAdmin);

// ➕ Create batch
router.post("/", createBatch);

// 👩‍🏫 Assign / update batch advisor
router.patch("/:batchId/batch-advisor", assignBatchAdvisor);

// 📘 Assign / update subject faculty
router.patch("/:batchId/subject-faculty", assignSubjectFaculty);

// 📋 Get all batches
router.get("/", getAllBatches);

export default router;
