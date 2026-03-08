import express from "express";

import { sendNotification } from "../../controllers/admin/notification.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { isAdmin } from "../../middlewares/admin.middleware.js";

const router = express.Router();

// POST /api/admin/notification
router.post("/", protect, isAdmin, sendNotification);

export default router;
