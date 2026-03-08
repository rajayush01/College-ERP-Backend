import TimetableDocument from "../../models/TimetableDocument.js";
import Timetable from "../../models/Timetable.js";
import Student from "../../models/Student.js";

export const getMyTimetableDocuments = async (req, res) => {
  try {
    console.log("📘 [Student Timetable Docs] Request received");

    const studentId = req.user.id;
    console.log("👤 Student ID:", studentId);

    const student = await Student.findById(studentId).select("batchId");
    if (!student) {
      console.warn("❌ Student not found:", studentId);
      return res.status(404).json({ message: "Student not found" });
    }

    console.log("🏫 Student batch:", student.batchId.toString());

    // Find documents without populate first to avoid schema errors
    const documents = await TimetableDocument.find({
      batchId: student.batchId,
      isActive: true,
    })
      .select("title fileUrl createdAt batchId") 
      .sort({ createdAt: -1 });

    console.log(`📄 Timetable documents found: ${documents.length}`);

    return res.json(documents);
  } catch (error) {
    console.error("🔥 Student timetable docs error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

/**
 * Student: View timetable for own batch
 */
export const getMyTimetable = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student's batch
    const student = await Student.findById(studentId).select("batchId department program semester");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Fetch timetable for student's batch
    const timetable = await Timetable.find({
      batchId: student.batchId,
    })
      .populate("periods.faculty", "name teacherId")
      .sort({ day: 1 });

    // Ensure correct weekday order
    timetable.sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    );

    return res.json({
      batchId: student.batchId,
      department: student.department,
      program: student.program,
      semester: student.semester,
      timetable,
    });
  } catch (error) {
    console.error("Student timetable error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

