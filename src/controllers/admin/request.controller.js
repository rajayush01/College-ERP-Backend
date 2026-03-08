import Request from "../../models/Request.js";
import Student from "../../models/Student.js";
import Teacher from "../../models/Teacher.js";
import AuditLog from "../../models/AuditLog.js";

const requestController = {
  async getAllRequests(req, res) {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json(requests);
  },

  async approveRequest(req, res) {
    const { requestId } = req.params;

    const request = await Request.findById(requestId);
    if (!request || request.status !== "PENDING") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const Model =
      request.targetModel === "Student" ? Student : Teacher;

    const updateFields = {};
    request.changes.forEach((c) => {
      updateFields[c.field] = c.newValue;
    });

    await Model.findByIdAndUpdate(request.targetId, updateFields);

    request.status = "APPROVED";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();

    await AuditLog.create({
      adminId: req.user.id,
      targetModel: request.targetModel,
      targetId: request.targetId,
      action: "APPROVED_REQUEST",
      changes: request.changes,
    });

    res.json({ message: "Request approved & changes applied" });
  },

  async rejectRequest(req, res) {
    const { requestId } = req.params;

    const request = await Request.findById(requestId);
    if (!request || request.status !== "PENDING") {
      return res.status(400).json({ message: "Invalid request" });
    }

    request.status = "REJECTED";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();

    await AuditLog.create({
      adminId: req.user.id,
      targetModel: request.targetModel,
      targetId: request.targetId,
      action: "REJECTED_REQUEST",
      changes: request.changes,
    });

    res.json({ message: "Request rejected" });
  },
};

export default requestController;
