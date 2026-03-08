import express from "express";
import {
  applyLeave,
  getMyLeaves,
  getMyLeaveBalance,
} from "../../controllers/teacher/leave.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Apply for leave
router.post("/apply", protect, applyLeave);

// View leave history
router.get("/my", protect, getMyLeaves);

// View leave balance
router.get("/balance", protect, getMyLeaveBalance);

export default router;
