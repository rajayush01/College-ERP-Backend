import Assignment from "../../models/Assignment.js";
import AssignmentSubmission from "../../models/AssignmentSubmission.js";
import Batch from "../../models/Class.js";
import Student from "../../models/Student.js";

/**
 * Teacher: View submissions for an assignment
 */
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { assignmentId } = req.params;

    console.log("[Teacher] Fetching submissions for assignment:", assignmentId);

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      console.error("Assignment not found");
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.createdBy.toString() !== teacherId) {
      console.error("Unauthorized teacher access");
      return res.status(403).json({
        message: "You are not allowed to view submissions for this assignment",
      });
    }

    const submissions = await AssignmentSubmission.find({
      assignment: assignmentId,
    })
      .populate("student", "studentId name enrollmentNumber department program semester")
      .sort({ submittedAt: 1 })
      .lean();

    console.log(`Found ${submissions.length} submissions`);

    // Ensure files array exists and is consistent
    const formatted = submissions.map((s) => ({
      ...s,
      files: Array.isArray(s.files) ? s.files : [],
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({
      message: "Failed to fetch assignment submissions",
    });
  }
};

/**
 * Teacher: Grade assignment submission
 */
export const gradeSubmission = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { submissionId } = req.params;
    const { marksObtained, remarks } = req.body;

    console.log("📝 [Teacher] Grading submission:", submissionId);

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate("assignment");

    if (!submission) {
      console.error("❌ Submission not found");
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.assignment.createdBy.toString() !== teacherId) {
      console.error("🚫 Unauthorized grading attempt");
      return res.status(403).json({
        message: "You are not allowed to grade this submission",
      });
    }

    submission.marksObtained = marksObtained;
    submission.remarks = remarks;
    submission.gradedBy = teacherId;
    submission.gradedAt = new Date();

    await submission.save();

    console.log("✅ Submission graded successfully");

    res.json({
      message: "Submission graded successfully",
      submission,
    });
  } catch (err) {
    console.error("🔥 Error grading submission:", err);
    res.status(500).json({
      message: "Failed to grade submission",
    });
  }
};

/**
 * Teacher: Assignment submission analytics
 */
export const getAssignmentAnalytics = async (req, res) => {
  const teacherId = req.user.id;
  const { assignmentId } = req.params;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  if (assignment.createdBy.toString() !== teacherId) {
    return res.status(403).json({ message: "Access denied" });
  }

  // Total students for batch
  const totalStudents = await Student.countDocuments({ 
    batchId: assignment.batchId 
  });

  // Submissions
  const submissions = await AssignmentSubmission.find({
    assignment: assignmentId,
  });

  const submittedCount = submissions.length;
  const pendingCount = totalStudents - submittedCount;

  const graded = submissions.filter((s) => s.marksObtained !== undefined);
  const avgMarks =
    graded.reduce((sum, s) => sum + s.marksObtained, 0) /
      (graded.length || 1);

  res.json({
    totalStudents,
    submitted: submittedCount,
    pending: pendingCount,
    gradedCount: graded.length,
    averageMarks: Number(avgMarks.toFixed(2)),
  });
};


