import Mark from "../../models/Mark.js";
import Exam from "../../models/Exam.js";
import Student from "../../models/Student.js";

/**
 * Admin / Teacher: Update marks (internal / reuse)
 */
export const updateMarks = async (req, res) => {
  try {
    const { examId, subject, records } = req.body;

    if (!examId || !subject || !records?.length) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const bulkOps = records.map((r) => ({
      updateOne: {
        filter: {
          exam: examId,
          student: r.studentId,
          subject,
        },
        update: {
          $set: {
            marksObtained: r.marksObtained,
            evaluatedBy: req.user.id,
          },
        },
        upsert: true,
      },
    }));

    await Mark.bulkWrite(bulkOps);

    await Exam.findByIdAndUpdate(examId, { status: "EVALUATED" });

    res.json({ message: "Marks updated successfully" });
  } catch (error) {
    console.error("Update marks error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Teacher: Enter / Update marks
 */
export const submitMarks = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { examId, subject, records } = req.body;

    if (!examId || !subject || !records?.length) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (exam.status === "PUBLISHED") {
      return res.status(403).json({
        message: "Results already published. Marks cannot be changed.",
      });
    }

    // Validate subject assignment (MINOR + MAJOR)
    const subjectData = exam.subjects.find(
      (s) =>
        s.subject === subject &&
        (
          s.teacher?.toString() === teacherId ||
          s.teachers?.some(t => t.toString() === teacherId)
        )
    );

    if (!subjectData) {
      return res.status(403).json({
        message: "You are not assigned to this subject",
      });
    }

    // Validate students belong to exam batches
    const studentIds = records.map(r => r.studentId);

    const validStudents = await Student.find({
      _id: { $in: studentIds },
      batchId: { $in: exam.batches },
    }).select("_id");

    if (validStudents.length !== records.length) {
      return res.status(400).json({
        message: "One or more students do not belong to exam batches",
      });
    }

    const bulkOps = records.map((r) => ({
      updateOne: {
        filter: {
          exam: examId,
          student: r.studentId,
          subject,
        },
        update: {
          $set: {
            exam: examId,
            student: r.studentId,
            subject,
            marksObtained: r.marksObtained,
            evaluatedBy: teacherId,
          },
        },
        upsert: true,
      },
    }));

    await Mark.bulkWrite(bulkOps);

    if (exam.examType === "MINOR") {
      exam.status = "PUBLISHED";
      exam.publishedAt = new Date();
    } else {
      exam.status = "EVALUATED";
    }

    await exam.save();

    res.json({
      message:
        exam.examType === "MINOR"
          ? "Marks submitted and published successfully"
          : "Marks submitted and sent for admin approval",
    });
  } catch (error) {
    console.error("Submit marks error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Teacher: View marks entered by me
 */
export const getMyMarks = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { examId, subject } = req.query;

    const filter = { evaluatedBy: teacherId };
    if (examId) filter.exam = examId;
    if (subject) filter.subject = subject;

    const marks = await Mark.find(filter)
      .populate("student", "name enrollmentNumber")
      .populate("exam", "name");

    res.json(marks);
  } catch (error) {
    console.error("Get my marks error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Teacher: Get exams assigned to me
 */
export const getMyExams = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const exams = await Exam.find({
      $or: [
        { "subjects.teacher": teacherId },     // MINOR
        { "subjects.teachers": teacherId },    // MAJOR
      ],
      isActive: true,
    })
      .populate("batches", "batchName department program semester")
      .select("name batches subjects status publishedAt createdAt")
      .sort({ createdAt: -1 });

    const formatted = exams.map((exam) => ({
      _id: exam._id,
      name: exam.name,
      batches: exam.batches,
      status: exam.status,
      publishedAt: exam.publishedAt,
      subjects: exam.subjects.filter(
        (s) =>
          s.teacher?.toString() === teacherId ||
          s.teachers?.some((t) => t.toString() === teacherId)
      ),
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Get my exams error:", error);
    res.status(500).json({
      message: "Failed to fetch exams",
    });
  }
};