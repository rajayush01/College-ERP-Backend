import Notification from "../../models/Notification.js";
import NotificationStatus from "../../models/NotificationStatus.js";
import Student from "../../models/Student.js";
import Teacher from "../../models/Teacher.js";

export const sendNotification = async (req, res) => {
  try {
    const { title, message, targetType, classId, section } = req.body;

    if (!title || !message || !targetType) {
      return res.status(400).json({
        message: "title, message and targetType are required",
      });
    }

    const notification = await Notification.create({
      title,
      message,
      target: {
        type: targetType,
        classId,
        section,
      },
      createdBy: req.user.id,
    });

    let users = [];

    if (targetType === "ALL_STUDENTS") {
      users = await Student.find({}, "_id");
    }

    if (targetType === "ALL_TEACHERS") {
      users = await Teacher.find({}, "_id");
    }

    if (targetType === "CLASS") {
      if (!classId) {
        return res.status(400).json({ message: "classId is required" });
      }
      users = await Student.find({ class: classId }, "_id");
    }

    if (targetType === "CLASS_SECTION") {
      if (!classId || !section) {
        return res
          .status(400)
          .json({ message: "classId and section are required" });
      }
      users = await Student.find({ class: classId, section }, "_id");
    }

    const role =
      targetType === "ALL_TEACHERS" ? "TEACHER" : "STUDENT";

    const bulkStatus = users.map((u) => ({
      insertOne: {
        document: {
          notification: notification._id,
          userId: u._id,
          role,
        },
      },
    }));

    if (bulkStatus.length) {
      await NotificationStatus.bulkWrite(bulkStatus);
    }

    res.json({ message: "Notification sent successfully" });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({ message: "Failed to send notification" });
  }
};
