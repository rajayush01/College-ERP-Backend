import Assignment from "../../models/Assignment.js";
import Batch from "../../models/Class.js";
import mongoose from "mongoose";

/**
 * =========================
 * Teacher: Create Assignment (Multer + R2)
 * =========================
 */
export const createAssignment = async (req, res) => {
  try {
    const teacherId = req.user.id;

    console.log('📝 [Teacher Assignment] Create request received:', {
      teacherId,
      body: req.body,
      filesCount: req.files?.length || 0
    });

    const {
      title,
      description,
      subject,
      batchId,
      dueDate,
    } = req.body;

    /* =========================
       BASIC VALIDATION
    ========================= */
    if (!title || !description || !subject || !batchId || !dueDate) {
      console.error('❌ [Teacher Assignment] Missing required fields');
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      console.error('❌ [Teacher Assignment] Invalid batch ID:', batchId);
      return res.status(400).json({
        message: "Invalid batch ID",
      });
    }

    /* =========================
       VALIDATE BATCH + TEACHER
    ========================= */
    const batchData = await Batch.findById(batchId);
    if (!batchData) {
      console.error('❌ [Teacher Assignment] Batch not found:', batchId);
      return res.status(404).json({
        message: "Batch not found",
      });
    }

    const isBatchAdvisor =
      batchData.batchAdvisor?.toString() === teacherId;

    const isSubjectFaculty = batchData.subjectFaculty?.some(
      (sf) => sf.faculty.toString() === teacherId
    );

    if (!isBatchAdvisor && !isSubjectFaculty) {
      console.error('❌ [Teacher Assignment] Teacher not assigned to batch:', {
        teacherId,
        batchId,
        isBatchAdvisor,
        isSubjectFaculty
      });
      return res.status(403).json({
        message: "You are not assigned to this batch",
      });
    }

    /* =========================
       HANDLE FILE UPLOADS TO R2
    ========================= */
    let normalizedAttachments = [];

    if (req.files && req.files.length > 0) {
      console.log('📎 [Teacher Assignment] Processing file uploads:', req.files.length);
      
      // Upload files to R2 with organized structure: teacher-assignments/teacherId/assignmentTitle/filename
      const { uploadMultipleToR2 } = await import("../../services/r2Upload.service.js");
      
      // Sanitize title for folder name
      const sanitizedTitle = title
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
      
      console.log('📁 [Teacher Assignment] Upload path:', `teacher-assignments/${teacherId}/${sanitizedTitle}`);
      
      const uploadResults = await uploadMultipleToR2(
        req.files,
        "teacher-assignments",
        `${teacherId}/${sanitizedTitle}`
      );

      console.log('✅ [Teacher Assignment] Files uploaded successfully:', uploadResults.length);

      normalizedAttachments = uploadResults.map((result) => ({
        fileName: result.originalName,
        fileUrl: result.fileUrl,
        fileKey: result.fileKey,
        contentType: req.files.find(f => f.originalname === result.originalName)?.mimetype || "application/pdf",
        size: req.files.find(f => f.originalname === result.originalName)?.size || null,
        uploadedAt: new Date(),
      }));
    }

    /* =========================
       CREATE ASSIGNMENT
    ========================= */
    const assignment = await Assignment.create({
      title,
      description,
      subject,
      batchId,
      dueDate,
      attachments: normalizedAttachments,
      createdBy: teacherId,
    });

    console.log('✅ [Teacher Assignment] Assignment created successfully:', assignment._id);

    res.status(201).json({
      message: "Assignment created successfully",
      assignment,
    });
  } catch (error) {
    console.error("❌ [Teacher Assignment] Create assignment error:", error);
    res.status(500).json({
      message: error.message || "Failed to create assignment",
    });
  }
};

/**
 * =========================
 * Teacher: View Own Assignments
 * =========================
 */
export const getMyAssignments = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const assignments = await Assignment.find({
      createdBy: teacherId,
    })
      .populate("batchId", "batchName department program semester")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error("Get my assignments error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
