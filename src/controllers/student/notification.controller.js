import NotificationStatus from "../../models/NotificationStatus.js";

/**
 * Student: Poll notifications (from admin & teachers)
 */
export const pollMyNotifications = async (req, res) => {
  const studentId = req.user.id;

  const notifications = await NotificationStatus.find({
    userId: studentId,
    role: "STUDENT",
  })
    .populate({
      path: "notification",
      select: "title message createdBy createdAt",
    })
    .sort({ createdAt: -1 })
    .limit(30);

  res.json(notifications);
};

/**
 * Student: Mark notification as read
 */
export const markNotificationAsRead = async (req, res) => {
  const studentId = req.user.id;
  const { statusId } = req.params;

  const status = await NotificationStatus.findOne({
    _id: statusId,
    userId: studentId,
    role: "STUDENT",
  });

  if (!status) {
    return res.status(404).json({ message: "Notification not found" });
  }

  status.isRead = true;
  await status.save();

  res.json({ message: "Notification marked as read" });
};

/**
 * Student: Get unread notification count
 */
export const getUnreadCount = async (req, res) => {
  const studentId = req.user.id;

  const count = await NotificationStatus.countDocuments({
    userId: studentId,
    role: "STUDENT",
    isRead: false,
  });

  res.json({ unreadCount: count });
};


