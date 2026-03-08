import Attendance from "../../models/Attendance.js";

export const viewStudentAttendance = async (req, res) => {
  const { batchId, studentId, startDate, endDate } = req.query;

  const filter = {};
  if (batchId) filter.batchId = batchId;
  if (studentId) filter.student = studentId;

  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const data = await Attendance.find(filter)
    .populate("student", "name enrollmentNumber")
    .populate("batchId", "batchName department program semester")
    .sort({ date: -1 });

  res.json(data);
};
