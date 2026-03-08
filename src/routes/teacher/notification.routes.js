import express from "express";
import {
  pollMyNotifications,
  sendNotificationToStudents,
  markNotificationAsRead,
} from "../../controllers/teacher/notification.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Poll admin notifications
router.get("/", protect, pollMyNotifications);

// Send message to assigned students
router.post("/send", protect, sendNotificationToStudents);

// Mark as read
router.patch("/:statusId/read", protect, markNotificationAsRead);

export default router;
