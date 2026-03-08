import Request from "../../models/Request.js";
import Teacher from "../../models/Teacher.js";

/**
 * Teacher: Raise request (profile change / general)
 */
export const raiseRequest = async (req, res) => {
  const teacherId = req.user.id;
  const { type, changes = [], reason } = req.body;
  // type: "PROFILE_CHANGE" | "GENERAL"

  if (!type || !reason) {
    return res.status(400).json({ message: "Type and reason are required" });
  }

  let formattedChanges = [];

  if (type === "PROFILE_CHANGE") {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Build oldValue/newValue safely
    formattedChanges = changes.map((c) => ({
      field: c.field,
      oldValue: teacher[c.field],
      newValue: c.newValue,
    }));
  }

  const request = await Request.create({
    raisedBy: {
      role: "TEACHER",
      userId: teacherId,
    },
    targetModel: "Teacher",
    targetId: teacherId,
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
 * Teacher: View own request history
 */
export const getMyRequests = async (req, res) => {
  const teacherId = req.user.id;

  const requests = await Request.find({
    "raisedBy.userId": teacherId,
    "raisedBy.role": "TEACHER",
  }).sort({ createdAt: -1 });

  res.json(requests);
};

