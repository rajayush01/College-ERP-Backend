import Request from "../../models/Request.js";
import Student from "../../models/Student.js";

/**
 * Student: Raise request (profile change / general)
 */
export const raiseRequest = async (req, res) => {
  const studentId = req.user.id;
  const { type, changes = [], reason } = req.body;
  // type: "PROFILE_CHANGE" | "GENERAL"

  if (!type || !reason) {
    return res.status(400).json({
      message: "Request type and reason are required",
    });
  }

  let formattedChanges = [];

  if (type === "PROFILE_CHANGE") {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    formattedChanges = changes.map((c) => ({
      field: c.field,
      oldValue: student[c.field],
      newValue: c.newValue,
    }));
  }

  const request = await Request.create({
    raisedBy: {
      role: "STUDENT",
      userId: studentId,
    },
    targetModel: "Student",
    targetId: studentId,
    changes: formattedChanges,
    reason,
    status: "PENDING",
  });

  res.status(201).json({
    message: "Request submitted successfully",
    requestId: request._id,
  });
};

/**
 * Student: View own request history
 */
export const getMyRequests = async (req, res) => {
  const studentId = req.user.id;

  const requests = await Request.find({
    "raisedBy.userId": studentId,
    "raisedBy.role": "STUDENT",
  }).sort({ createdAt: -1 });

  res.json(requests);
};

