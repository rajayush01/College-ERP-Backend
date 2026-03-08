import Exam from "../../models/Exam.js";

/**
 * Admin: Publish results (MAJOR exams only)
 */
export const publishResults = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (exam.examType !== "MAJOR") {
      return res.status(400).json({
        message: "Minor exams are auto-published by teachers",
      });
    }

    if (exam.status !== "EVALUATED") {
      return res.status(400).json({
        message: "Exam not ready for publishing",
      });
    }

    exam.status = "PUBLISHED";
    exam.publishedAt = new Date();
    await exam.save();

    res.json({ message: "Results published successfully" });
  } catch (error) {
    console.error("Publish results error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
