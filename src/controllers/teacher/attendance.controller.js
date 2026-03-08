import Attendance from "../../models/Attendance.js";
import Batch from "../../models/Class.js";
import Student from "../../models/Student.js";

/**
 * Teacher: Mark student attendance
 * Only for assigned batches
 */
export const markStudentAttendance = async (req, res) => {
  const teacherId = req.user.id;
  const { batchId, subject, date, records } = req.body;
  /**
   * records = [
   *   { studentId, status } // PRESENT / ABSENT
   * ]
   */

  if (!batchId || !subject || !date || !records?.length) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  // 1️⃣ Validate teacher assignment
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

  // 2️⃣ Validate students belong to the batch
  const studentIds = records.map((r) => r.studentId);

  const validStudents = await Student.find({
    _id: { $in: studentIds },
    batchId,
  }).select("_id");

  if (validStudents.length !== records.length) {
    return res.status(400).json({
      message: "One or more students do not belong to this batch",
    });
  }

  // 3️⃣ Bulk upsert attendance
  const attendanceDate = new Date(date);

  const bulkOps = records.map((r) => ({
    updateOne: {
      filter: {
        student: r.studentId,
        date: attendanceDate,
        subject,
      },
      update: {
        $set: {
          student: r.studentId,
          batchId,
          subject,
          facultyId: teacherId,
          date: attendanceDate,
          status: r.status,
          markedBy: teacherId,
        },
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(bulkOps);

  res.json({
    message: "Attendance marked successfully",
  });
};

/**
 * Teacher: View attendance for a batch (read-only)
 */
export const getBatchAttendance = async (req, res) => {
  const teacherId = req.user.id;
  const { batchId, date } = req.query;

  const batchData = await Batch.findById(batchId);
  if (!batchData) {
    return res.status(404).json({ message: "Batch not found" });
  }

  const isAllowed =
    batchData.batchAdvisor?.toString() === teacherId ||
    batchData.subjectFaculty.some(
      (sf) => sf.faculty.toString() === teacherId
    );

  if (!isAllowed) {
    return res.status(403).json({ message: "Access denied" });
  }

  const filter = { batchId };
  if (date) filter.date = new Date(date);

  const attendance = await Attendance.find(filter)
    .populate("student", "name enrollmentNumber")
    .sort({ date: -1 });

  res.json(attendance);
};

/**
 * Teacher: Attendance summary (date range / academic year)
 */
export const getAttendanceSummary = async (req, res) => {
  const teacherId = req.user.id;
  const { fromDate, toDate } = req.query;

  if (!fromDate || !toDate) {
    return res.status(400).json({
      message: "fromDate and toDate are required",
    });
  }

  const start = new Date(fromDate);
  const end = new Date(toDate);

  // 1️⃣ Batches assigned to teacher
  const batches = await Batch.find({
    $or: [
      { batchAdvisor: teacherId },
      { "subjectFaculty.faculty": teacherId },
    ],
  }).select("_id batchName department program semester");

  if (!batches.length) {
    return res.json({
      totalDays: 0,
      presentDays: 0,
      percent: 0,
      batchWise: [],
    });
  }

  const batchIds = batches.map((b) => b._id);

  // 2️⃣ Attendance grouped by date
  const attendance = await Attendance.find({
    batchId: { $in: batchIds },
    date: { $gte: start, $lte: end },
  }).lean();

  if (!attendance.length) {
    return res.json({
      totalDays: 0,
      presentDays: 0,
      percent: 0,
      batchWise: [],
    });
  }

  // 3️⃣ Unique attendance days
  const uniqueDates = new Set(
    attendance.map((a) => a.date.toISOString().split("T")[0])
  );

  const totalDays = uniqueDates.size;
  const presentDays = totalDays; // attendance exists ⇒ class conducted

  // 4️⃣ Batch-wise stats
  const batchWise = batches.map((batch) => {
    const batchAttendance = attendance.filter(
      (a) => a.batchId.toString() === batch._id.toString()
    );

    const batchDates = new Set(
      batchAttendance.map((a) => a.date.toISOString().split("T")[0])
    );

    return {
      batchId: batch._id,
      batchName: batch.batchName,
      department: batch.department,
      totalDays: batchDates.size,
      percent: batchDates.size
        ? Math.round((batchDates.size / totalDays) * 100)
        : 0,
    };
  });

  res.json({
    totalDays,
    presentDays,
    percent: 100,
    batchWise,
  });
};

