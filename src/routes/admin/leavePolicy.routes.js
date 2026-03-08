import express from "express";
import { setLeavePolicy } from "../../controllers/admin/leavePolicy.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";

const router = express.Router();

// Set / update leave policy (Admin only)
router.post("/", protect, isAdmin, setLeavePolicy);

export default router;
