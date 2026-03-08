const NotificationStatus = require("../../models/NotificationStatus");

exports.pollNotifications = async (req, res) => {
  const { role, id } = req.user;

  const notifications = await NotificationStatus.find({
    userId: id,
    role,
  })
    .populate("notification")
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(notifications);
};


exports.markAsRead = async (req, res) => {
  const { notificationStatusId } = req.params;

  await NotificationStatus.findByIdAndUpdate(notificationStatusId, {
    isRead: true,
  });

  res.json({ message: "Marked as read" });
};

