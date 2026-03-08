import express from "express";
import { getMyProfile } from "../../controllers/teacher/profile.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// View own profile
router.get("/me", protect, getMyProfile);

export default router;
