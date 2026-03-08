import SharedDocument from "../../models/SharedDocument.js";
import { uploadToR2 } from "../../services/r2Upload.service.js";

/**
 * =========================
 * Admin: Upload Shared Document (Multer + R2)
 * =========================
 */
export const uploadSharedDocumentController = async (req, res) => {
  try {
    const {
      title,
      description,
      visibleTo,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Parse visibleTo if it's a JSON string
    let parsedVisibleTo = ["STUDENT", "TEACHER"]; // default
    if (visibleTo) {
      try {
        parsedVisibleTo = typeof visibleTo === 'string' ? JSON.parse(visibleTo) : visibleTo;
      } catch (e) {
        console.warn('Failed to parse visibleTo, using default:', e);
      }
    }

    // Upload to R2 with organized structure: documents/shared/filename
    const uploadResult = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      "documents",
      "shared",
      req.file.mimetype
    );

    const document = await SharedDocument.create({
      title,
      description: description || "",
      fileUrl: uploadResult.fileUrl,
      fileKey: uploadResult.fileKey,
      originalName: uploadResult.originalName,
      uploadedBy: req.user.id,
      visibleTo: Array.isArray(parsedVisibleTo) && parsedVisibleTo.length > 0
        ? parsedVisibleTo
        : ["STUDENT", "TEACHER"],
    });

    res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    console.error("Upload shared document error:", error);
    res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};