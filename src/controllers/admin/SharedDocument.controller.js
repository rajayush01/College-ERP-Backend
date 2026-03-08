import SharedDocument from "../../models/SharedDocument.js";
import mongoose from "mongoose";

/**
 * =========================
 * Admin: Upload PDF Document (URL-based)
 * =========================
 */
export const uploadDocument = async (req, res) => {
  try {
    const {
      title,
      description,
      fileUrl,
      fileKey,
      visibleTo,
    } = req.body;

    /* =========================
       BASIC VALIDATION
    ========================= */
    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    if (!fileUrl || !fileKey) {
      return res.status(400).json({
        message: "fileUrl and fileKey are required",
      });
    }

    const document = await SharedDocument.create({
      title,
      description: description || "",
      fileUrl,          // ✅ R2 public URL
      fileKey,          // ✅ stored for delete later
      uploadedBy: req.user.id,
      visibleTo:
        Array.isArray(visibleTo) && visibleTo.length > 0
          ? visibleTo
          : ["STUDENT", "TEACHER"],
    });

    res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * =========================
 * Admin / Staff: List Uploaded Documents
 * =========================
 */
export const getAllDocuments = async (req, res) => {
  try {
    const docs = await SharedDocument.find()
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email");

    res.status(200).json(docs);
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
