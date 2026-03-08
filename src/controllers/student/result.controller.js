import Exam from "../../models/Exam.js";
import Mark from "../../models/Mark.js";
import Student from "../../models/Student.js";



import mongoose from "mongoose";

export const getMyResults = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await Student.findById(studentId).select("class");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 🔥 CRITICAL FIX
    const classId = new mongoose.Types.ObjectId(
      student.class.toString()
    );

    console.log("🏫 [Results] Student classId:", classId);

    const publishedExams = await Exam.find({
      status: "PUBLISHED",
      classes: classId, // ✅ NOT $in needed for single value
    })
      .select("_id name examType publishedAt subjects classes")
      .sort({ publishedAt: -1 });

    console.log(
      "📘 [Results] Published exams found:",
      publishedExams.length
    );

    if (!publishedExams.length) {
      return res.json([]);
    }

    const examIds = publishedExams.map((e) => e._id);

    const marks = await Mark.find({
      student: studentId,
      exam: { $in: examIds },
    });

    const resultMap = {};

    marks.forEach((m) => {
      const examId = m.exam.toString();

      if (!resultMap[examId]) {
        const exam = publishedExams.find(
          (e) => e._id.toString() === examId
        );

        resultMap[examId] = {
          examId,
          examName: exam.name,
          examType: exam.examType,
          subjects: [],
          totalObtained: 0,
          totalMax: 0,
          publishedAt: exam.publishedAt,
        };
      }

      const exam = publishedExams.find(
        (e) => e._id.toString() === examId
      );

      const maxMarks =
        exam.subjects.find((s) => s.subject === m.subject)
          ?.maxMarks || 0;

      resultMap[examId].subjects.push({
        subject: m.subject,
        marksObtained: m.marksObtained,
        maxMarks,
      });

      resultMap[examId].totalObtained += m.marksObtained;
      resultMap[examId].totalMax += maxMarks;
    });

    const results = Object.values(resultMap).map((r) => ({
      ...r,
      percentage:
        r.totalMax > 0
          ? ((r.totalObtained / r.totalMax) * 100).toFixed(2)
          : null,
    }));

    res.json(results);
  } catch (err) {
    console.error("🔥 [Results] Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getMyResultByExam = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { examId } = req.params;

    const student = await Student.findById(studentId).select("class");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const classId = new mongoose.Types.ObjectId(
      student.class.toString()
    );

    const exam = await Exam.findOne({
      _id: examId,
      status: "PUBLISHED",
      classes: classId,
    }).select("name examType publishedAt subjects");

    if (!exam) {
      return res.status(404).json({
        message: "Result not published or unauthorized",
      });
    }

    const marks = await Mark.find({
      student: studentId,
      exam: examId,
    });

    let totalObtained = 0;
    let totalMax = 0;

    const subjects = marks.map((m) => {
      const maxMarks =
        exam.subjects.find((s) => s.subject === m.subject)
          ?.maxMarks || 0;

      totalObtained += m.marksObtained;
      totalMax += maxMarks;

      return {
        subject: m.subject,
        marksObtained: m.marksObtained,
        maxMarks,
      };
    });

    res.json({
      examId: exam._id,
      examName: exam.name,
      examType: exam.examType,
      publishedAt: exam.publishedAt,
      subjects,
      totalObtained,
      totalMax,
      percentage:
        totalMax > 0
          ? ((totalObtained / totalMax) * 100).toFixed(2)
          : null,
    });
  } catch (error) {
    console.error("🔥 [Result] Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
