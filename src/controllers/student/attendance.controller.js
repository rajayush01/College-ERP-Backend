import Attendance from "../../models/Attendance.js";
import Student from "../../models/Student.js";
import Batch from "../../models/Class.js";
import mongoose from "mongoose";

/**
 * Student: View attendance (day-wise, subject-wise)
 */
export const getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { from, to, month, year } = req.query;

    // 1️⃣ Fetch student
    const student = await Student.findById(studentId).select("batchId");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 2️⃣ Build date filter
    const filter = {
      student: new mongoose.Types.ObjectId(studentId),
    };

    if (from && to) {
      filter.date = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    } else if (month && year) {
      filter.date = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0),
      };
    }

    // 3️⃣ Fetch attendance (day-wise)
    const attendance = await Attendance.find(filter).sort({ date: -1 });

    // 4️⃣ Fetch batch + subject-faculty mapping
    const batchData = await Batch.findById(student.batchId)
      .populate("subjectFaculty.faculty", "name teacherId");

    if (!batchData) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // 5️⃣ Overall stats
    const totalDays = attendance.length;
    const presentDays = attendance.filter(
      (a) => a.status === "PRESENT"
    ).length;

    // 6️⃣ Subject-wise view
    const subjects = batchData.subjectFaculty.map((sf) => {
      const subjectAttendance = attendance.filter(a => a.subject === sf.subject);
      const total = subjectAttendance.length;
      const present = subjectAttendance.filter(a => a.status === "PRESENT").length;

      return {
        subject: sf.subject,
        faculty: sf.faculty,
        stats: {
          total,
          present,
          absent: total - present,
          percentage:
            total > 0
              ? Number(((present / total) * 100).toFixed(2))
              : 0,
        },
        records: subjectAttendance.map((a) => ({
          date: a.date,
          status: a.status,
        })),
      };
    });

    // 7️⃣ Response
    res.json({
      summary: {
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        attendancePercentage:
          totalDays > 0
            ? Number(((presentDays / totalDays) * 100).toFixed(2))
            : 0,
      },
      subjects,
    });
  } catch (error) {
    console.error("Attendance error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
