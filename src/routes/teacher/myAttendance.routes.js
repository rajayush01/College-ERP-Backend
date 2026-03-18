import express from "express";
import { getMyAttendance } from "../../controllers/admin/teacherAttendance.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getMyAttendance);

export default router;
