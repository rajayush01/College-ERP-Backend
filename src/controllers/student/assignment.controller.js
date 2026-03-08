import Assignment from "../../models/Assignment.js";
import AssignmentSubmission from "../../models/AssignmentSubmission.js";
import Student from "../../models/Student.js";
import mongoose from "mongoose";

/**
 * =========================
 * Student: View assignments for own batch
 * =========================
 */
export const getMyAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await Student.findById(studentId).select("batchId");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const assignments = await Assignment.find({
      batchId: student.batchId,
    })
      .populate("createdBy", "name teacherId")
      .sort({ dueDate: 1 });

    // Fetch submissions for these assignments
    const assignmentIds = assignments.map((a) => a._id);

    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignmentIds },
      student: studentId,
    });

    const submissionMap = {};
    submissions.forEach((s) => {
      submissionMap[s.assignment.toString()] = s;
    });

    const result = assignments.map((a) => ({
      _id: a._id,
      title: a.title,
      description: a.description,
      subject: a.subject,
      batchId: a.batchId,
      dueDate: a.dueDate,
      createdBy: a.createdBy,
      attachments: Array.isArray(a.attachments) ? a.attachments : [],
      submission: submissionMap[a._id.toString()] || null,
    }));

    res.json(result);
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * Student: Submit Assignment (Multer + R2)
 * =========================
 */
export const submitAssignment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { assignmentId } = req.body;

    console.log('📝 [Student Assignment] Submit request received:', {
      studentId,
      assignmentId,
      body: req.body,
      filesCount: req.files?.length || 0,
      files: req.files?.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })) || []
    });

    if (!assignmentId) {
      console.error('❌ [Student Assignment] Missing assignmentId');
      return res.status(400).json({
        message: "assignmentId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      console.error('❌ [Student Assignment] Invalid assignmentId:', assignmentId);
      return res.status(400).json({
        message: "Invalid assignment ID",
      });
    }

    if (!req.files || req.files.length === 0) {
      console.error('❌ [Student Assignment] No files provided');
      return res.status(400).json({
        message: "At least one file is required",
      });
    }

    // Validate assignment
    console.log('🔍 [Student Assignment] Looking up assignment:', assignmentId);
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      console.error('❌ [Student Assignment] Assignment not found:', assignmentId);
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    // Deadline check
    const now = new Date();
    if (assignment.dueDate && now > new Date(assignment.dueDate)) {
      console.error('❌ [Student Assignment] Deadline passed:', {
        dueDate: assignment.dueDate,
        now: now
      });
      return res.status(400).json({
        message: "Submission deadline passed",
      });
    }

    console.log('📤 [Student Assignment] Uploading files to R2...');
    // Upload files to R2 with organized structure: assignments/studentId/assignmentId/filename
    const { uploadMultipleToR2 } = await import("../../services/r2Upload.service.js");
    const uploadResults = await uploadMultipleToR2(
      req.files,
      "assignments",
      `${studentId}/${assignmentId}`
    );

    console.log('✅ [Student Assignment] Files uploaded successfully:', uploadResults.length);

    const normalizedFiles = uploadResults.map((result) => ({
      fileName: result.originalName,
      fileUrl: result.fileUrl,
      fileKey: result.fileKey,
      uploadedAt: new Date(),
    }));

    console.log('💾 [Student Assignment] Saving submission to database...');
    // Upsert submission
    const submission = await AssignmentSubmission.findOneAndUpdate(
      {
        assignment: assignmentId,
        student: studentId,
      },
      {
        assignment: assignmentId,
        student: studentId,
        files: normalizedFiles,
        submittedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    console.log('🎉 [Student Assignment] Submission completed successfully:', submission._id);

    res.json({
      message: "Assignment submitted successfully",
      submission,
    });
  } catch (err) {
    console.error("❌ [Student Assignment] Submit assignment error:", err);
    res.status(500).json({
      message: err.message || "Server error while submitting assignment",
    });
  }
};

/**
 * =========================
 * Student: View My Submission
 * =========================
 */
export const getMySubmission = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({
        message: "Invalid assignment ID",
      });
    }

    const submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: studentId,
    });

    res.json(submission);
  } catch (error) {
    console.error("Get submission error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
