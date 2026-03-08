import express from "express";
import {
  pollMyNotifications,
  markNotificationAsRead,
  getUnreadCount,
} from "../../controllers/student/notification.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Poll notifications
router.get("/", protect, pollMyNotifications);

// Unread count
router.get("/unread-count", protect, getUnreadCount);

// Mark as read
router.patch("/:statusId/read", protect, markNotificationAsRead);

export default router;
