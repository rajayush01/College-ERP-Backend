import mongoose from "mongoose";
import TimetableDocument from "../../models/TimetableDocument.js";
import { uploadToR2 } from "../../services/r2Upload.service.js";

/**
 * =========================
 * Admin: Upload Timetable Document (Multer + R2)
 * =========================
 */
export const uploadTimetableDocumentController = async (req, res) => {
  try {
    const { classId, title } = req.body;

    if (!classId) {
      return res.status(400).json({
        message: "classId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "Invalid class ID" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to R2 with organized structure: timetables/classId/filename
    const uploadResult = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      "timetables",
      classId,
      req.file.mimetype
    );

    const doc = await TimetableDocument.create({
      class: classId,
      title: title || "Class Timetable",
      fileUrl: uploadResult.fileUrl,
      fileKey: uploadResult.fileKey,
      originalName: uploadResult.originalName,
      uploadedBy: req.user.id,
      isActive: true,
    });

    res.status(201).json({
      message: "Timetable uploaded successfully",
      document: doc,
    });
  } catch (error) {
    console.error("Upload timetable error:", error);
    res.status(500).json({ 
      message: error.message || "Internal server error" 
    });
  }
};