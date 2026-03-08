import Exam from "../../models/Exam.js";
import Batch from "../../models/Class.js";

/**
 * Admin: Create Exam
 */
export const createExam = async (req, res) => {
  try {
    const { name, examType, batchIds } = req.body;

    console.log("[CREATE EXAM] Request received", {
      adminId: req.user?._id,
      examType,
      name,
      batchIds,
    });

    /* =========================
       BASIC VALIDATION
    ========================= */
    if (!name || !examType) {
      console.warn("[CREATE EXAM] Missing name or examType");
      return res.status(400).json({ message: "Name and examType are required" });
    }

    if (!["MINOR", "MAJOR"].includes(examType)) {
      console.warn("[CREATE EXAM] Invalid examType:", examType);
      return res.status(400).json({ message: "Invalid exam type" });
    }

    if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
      console.warn("[CREATE EXAM] batchIds missing or invalid");
      return res.status(400).json({
        message: "batchIds array is required",
      });
    }

    /* =========================
       FETCH BATCHES & BUILD SUBJECTS
    ========================= */
    const batches = await Batch.find({ _id: { $in: batchIds } }).populate(
      "subjectFaculty.faculty",
      "name"
    );

    if (!batches.length) {
      console.warn("[CREATE EXAM] No batches found for provided IDs");
      return res.status(404).json({ message: "No batches found" });
    }

    console.log("[CREATE EXAM] Batches found:", {
      count: batches.length,
      batches: batches.map(b => b.batchName),
    });

    // Collect subjects from all batches
    const subjectMap = new Map();

    batches.forEach((batch) => {
      batch.subjectFaculty.forEach((sf) => {
        if (!subjectMap.has(sf.subject)) {
          subjectMap.set(sf.subject, {
            subject: sf.subject,
            teachers: new Set(),
            maxMarks: 100,
          });
        }
        if (sf.faculty?._id) {
          subjectMap.get(sf.subject).teachers.add(sf.faculty._id.toString());
        }
      });
    });

    const subjects = Array.from(subjectMap.values()).map((s) => {
      const teacherArray = Array.from(s.teachers);
      return examType === "MINOR" && teacherArray.length > 0
        ? {
            subject: s.subject,
            teacher: teacherArray[0], // Single teacher for MINOR
            maxMarks: s.maxMarks,
          }
        : {
            subject: s.subject,
            teachers: teacherArray, // Multiple teachers for MAJOR
            maxMarks: s.maxMarks,
          };
    });

    console.log("[CREATE EXAM] Subjects collected:", {
      subjectCount: subjects.length,
      subjects: subjects.map((s) => s.subject),
    });

    if (!subjects.length) {
      console.warn("[CREATE EXAM] No subject faculty found for batches");
      return res.status(400).json({
        message: "No subject faculty found for selected batches",
      });
    }

    /* =========================
       CREATE EXAM
    ========================= */
    const exam = await Exam.create({
      name,
      examType,
      batches: batchIds,
      subjects,
    });

    console.log("[CREATE EXAM] Exam created successfully", {
      examId: exam._id,
      examType,
      batchCount: batchIds.length,
      subjectCount: subjects.length,
    });

    res.status(201).json({
      message: "Exam created successfully",
      exam,
    });
  } catch (error) {
    console.error("[CREATE EXAM] Internal error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Admin: Get all exams
 */
export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate("batches", "batchName department program semester")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: exams.length,
      exams,
    });
  } catch (error) {
    console.error("[GET EXAMS] Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Admin: Toggle exam active status
 */
export const toggleExamStatus = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Prevent disabling published exams
    if (exam.status === "PUBLISHED") {
      return res.status(400).json({
        message: "Published exams cannot be disabled",
      });
    }

    exam.isActive = !exam.isActive;
    await exam.save();

    console.log("[EXAM STATUS TOGGLED]", {
      examId: exam._id,
      isActive: exam.isActive,
    });

    res.status(200).json({
      message: `Exam ${exam.isActive ? "enabled" : "disabled"} successfully`,
      exam,
    });
  } catch (error) {
    console.error("[TOGGLE EXAM] Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Admin: Delete exam
 */
export const deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (exam.status === "PUBLISHED") {
      return res.status(400).json({
        message: "Published exams cannot be deleted",
      });
    }

    await Exam.findByIdAndDelete(examId);

    console.log("[EXAM DELETED]", {
      examId,
      deletedBy: req.user?._id,
    });

    res.status(200).json({
      message: "Exam deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE EXAM] Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



