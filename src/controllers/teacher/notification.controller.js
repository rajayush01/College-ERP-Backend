import Notification from "../../models/Notification.js";
import NotificationStatus from "../../models/NotificationStatus.js";
import Batch from "../../models/Class.js";
import Student from "../../models/Student.js";

/**
 * Teacher: Poll notifications (from admin)
 */
export const pollMyNotifications = async (req, res) => {
  const teacherId = req.user.id;

  const notifications = await NotificationStatus.find({
    userId: teacherId,
    role: "TEACHER",
  })
    .populate("notification")
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(notifications);
};

/**
 * Teacher: Send notification to assigned students
 */
export const sendNotificationToStudents = async (req, res) => {
  const teacherId = req.user.id;
  const { title, message, batchId, department } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required" });
  }

  let targetType = "ALL_STUDENTS";
  let studentFilter = {};

  // 1️⃣ Validate batch/department assignment if specified
  if (batchId) {
    const batchData = await Batch.findById(batchId);
    if (!batchData) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const isBatchAdvisor =
      batchData.batchAdvisor?.toString() === teacherId;

    const isSubjectFaculty = batchData.subjectFaculty.some(
      (sf) => sf.faculty.toString() === teacherId
    );

    if (!isBatchAdvisor && !isSubjectFaculty) {
      return res.status(403).json({
        message: "You are not assigned to this batch",
      });
    }

    studentFilter.batchId = batchId;
    targetType = "BATCH";
  } else if (department) {
    // Send to all students in a department (if teacher teaches that department)
    const batches = await Batch.find({
      department,
      $or: [
        { batchAdvisor: teacherId },
        { "subjectFaculty.faculty": teacherId },
      ],
    }).select("_id");

    if (!batches.length) {
      return res.status(403).json({
        message: "You are not assigned to this department",
      });
    }

    studentFilter.department = department;
    targetType = "DEPARTMENT";
  }

  // 2️⃣ Resolve target students
  const students = await Student.find(studentFilter).select("_id");

  if (!students.length) {
    return res.status(400).json({ message: "No students found" });
  }

  // 3️⃣ Create notification
  const notification = await Notification.create({
    title,
    message,
    target: {
      type: targetType,
      batchId,
      department,
    },
    createdBy: teacherId,
  });

  // 4️⃣ Create per-student unread status
  const bulkStatuses = students.map((s) => ({
    insertOne: {
      document: {
        notification: notification._id,
        userId: s._id,
        role: "STUDENT",
      },
    },
  }));

  await NotificationStatus.bulkWrite(bulkStatuses);

  res.json({ message: "Notification sent to students" });
};

export const markNotificationAsRead = async (req, res) => {
  const { statusId } = req.params;

  await NotificationStatus.findByIdAndUpdate(statusId, {
    isRead: true,
  });

  res.json({ message: "Marked as read" });
};

